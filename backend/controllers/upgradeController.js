/**
 * tradex-GG
 * @author willSolareviczz
 * @github https://github.com/willSolareviczz/tradex-GG
 * @section backend
 */
const crypto = require('crypto');
const pool   = require('../config/db');

// Retorna inventário não vendido do usuário (para seleção de upgrade)
exports.getInventoryForUpgrade = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.id AS opening_id, s.id AS skin_id, s.name, s.weapon, s.skin_name,
              s.wear, s.rarity, s.rarity_color, s.image_url,
              COALESCE(s.site_price, s.market_price) AS value
       FROM openings o
       JOIN skins s ON o.skin_id = s.id
       WHERE o.user_id = $1 AND o.sold = false
       ORDER BY value DESC
       LIMIT 100`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar inventário para upgrade:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Retorna skins disponíveis como alvo (valor acima do threshold)
exports.getTargetSkins = async (req, res) => {
  try {
    const minValue = Math.max(0, parseInt(req.query.minValue) || 0);
    // Alvo deve valer no mínimo 10% a mais que a skin de origem
    const threshold = Math.floor(minValue * 1.1);

    const result = await pool.query(
      `SELECT DISTINCT ON (s.weapon, s.skin_name, s.wear)
              s.id, s.name, s.weapon, s.skin_name, s.wear,
              s.rarity, s.rarity_color, s.image_url,
              COALESCE(s.site_price, s.market_price) AS value
       FROM skins s
       WHERE COALESCE(s.site_price, s.market_price) > $1
         AND COALESCE(s.site_price, s.market_price) > 0
       ORDER BY s.weapon, s.skin_name, s.wear, value ASC
       LIMIT 120`,
      [threshold]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar skins alvo:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Realiza o upgrade
exports.performUpgrade = async (req, res) => {
  const { opening_id, target_skin_id } = req.body;

  if (!opening_id || !target_skin_id) {
    return res.status(400).json({ error: 'Selecione um item e uma skin alvo' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Busca e trava o opening
    const openingRes = await client.query(
      `SELECT o.id, o.sold, o.skin_id,
              s.name, s.weapon, s.skin_name, s.wear, s.rarity, s.rarity_color, s.image_url,
              COALESCE(s.site_price, s.market_price) AS from_value
       FROM openings o
       JOIN skins s ON o.skin_id = s.id
       WHERE o.id = $1 AND o.user_id = $2 AND o.sold = false
       FOR UPDATE`,
      [opening_id, req.userId]
    );

    if (openingRes.rows.length === 0) {
      throw { status: 404, message: 'Item não encontrado ou já foi vendido' };
    }

    // 2. Busca a skin alvo
    const targetRes = await client.query(
      `SELECT id, name, weapon, skin_name, wear, rarity, rarity_color, image_url,
              COALESCE(site_price, market_price) AS to_value
       FROM skins WHERE id = $1`,
      [target_skin_id]
    );

    if (targetRes.rows.length === 0) {
      throw { status: 404, message: 'Skin alvo não encontrada' };
    }

    const fromSkin   = openingRes.rows[0];
    const toSkin     = targetRes.rows[0];
    const from_value = parseInt(fromSkin.from_value);
    const to_value   = parseInt(toSkin.to_value);

    if (to_value <= from_value) {
      throw { status: 400, message: 'A skin alvo deve valer mais do que a sua skin' };
    }

    if (to_value < Math.floor(from_value * 1.1)) {
      throw { status: 400, message: 'A skin alvo deve valer pelo menos 10% a mais' };
    }

    // 3. Calcula chance em basis points (max 75%)
    const win_chance = Math.min(7500, Math.floor((from_value / to_value) * 9000));

    // 4. Provably fair roll via HMAC-SHA256
    const serverSeed = crypto.randomBytes(32).toString('hex');
    const hmac = crypto.createHmac('sha256', serverSeed);
    hmac.update(`${req.userId}:${opening_id}:${target_skin_id}`);
    const roll = (parseInt(hmac.digest('hex').slice(0, 8), 16) % 10000) + 1;
    const won  = roll <= win_chance;

    // 5. Remove a skin original do inventário
    await client.query(
      'UPDATE openings SET sold = true, sell_price = 0 WHERE id = $1',
      [opening_id]
    );

    // 6. Se ganhou, adiciona a skin alvo (case_id de origem para auditoria)
    let new_opening_id = null;
    if (won) {
      const caseIdRes = await client.query(
        'SELECT case_id FROM openings WHERE id = $1', [opening_id]
      );
      const origCaseId = caseIdRes.rows[0]?.case_id ?? null;
      const newOpening = await client.query(
        'INSERT INTO openings (user_id, case_id, skin_id) VALUES ($1, $2, $3) RETURNING id',
        [req.userId, origCaseId, target_skin_id]
      );
      new_opening_id = newOpening.rows[0].id;
    }

    // 7. Registra o upgrade
    await client.query(
      `INSERT INTO upgrades (user_id, from_opening_id, to_skin_id, from_value, to_value, win_chance, won)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [req.userId, opening_id, target_skin_id, from_value, to_value, win_chance, won]
    );

    await client.query('COMMIT');

    res.json({
      won,
      win_chance,
      roll,
      server_seed: serverSeed,
      from_skin: fromSkin,
      to_skin: toSkin,
      new_opening_id,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('Erro no upgrade:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    client.release();
  }
};

// Histórico de upgrades do usuário
exports.getUpgradeHistory = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ug.id, ug.from_value, ug.to_value, ug.win_chance, ug.won, ug.created_at,
              fs.weapon AS from_weapon, fs.skin_name AS from_skin_name,
              fs.rarity_color AS from_rarity_color,
              ts.weapon AS to_weapon, ts.skin_name AS to_skin_name,
              ts.rarity_color AS to_rarity_color
       FROM upgrades ug
       JOIN skins ts ON ug.to_skin_id = ts.id
       JOIN openings fo ON ug.from_opening_id = fo.id
       JOIN skins fs ON fo.skin_id = fs.id
       WHERE ug.user_id = $1
       ORDER BY ug.created_at DESC
       LIMIT 20`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar histórico de upgrades:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
