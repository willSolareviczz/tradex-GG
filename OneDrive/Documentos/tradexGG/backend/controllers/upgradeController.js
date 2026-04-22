/**
 * tradex-GG
 * @author willSolareviczz
 * @github https://github.com/willSolareviczz/tradex-GG
 * @section backend
 */
const crypto = require('crypto');
const pool = require('../config/db');
const { awardXP } = require('../services/xpService');

/**
 * GET /api/upgrade/inventory
 * Retorna openings nao vendidas do usuario com dados da skin.
 */
exports.getInventory = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.id AS opening_id,
              s.id AS skin_id,
              s.name,
              s.weapon,
              s.skin_name,
              s.wear,
              s.rarity,
              s.rarity_color,
              s.image_url,
              s.market_price,
              COALESCE(s.site_price, s.market_price) AS site_price,
              COALESCE(s.site_price, s.market_price) AS value
       FROM openings o
       JOIN skins s ON o.skin_id = s.id
       WHERE o.user_id = $1
         AND o.sold = false
       ORDER BY COALESCE(s.site_price, s.market_price) DESC`,
      [req.userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar inventário para upgrade:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

/**
 * GET /api/upgrade/targets?min_value=X&max_value=Y
 * Retorna skins disponíveis como alvo dentro do range de valor.
 */
exports.getTargets = async (req, res) => {
  try {
    const minValue = parseInt(req.query.min_value) || 0;
    const maxValue = parseInt(req.query.max_value) || 99999999;

    if (minValue < 0 || maxValue < minValue) {
      return res.status(400).json({ error: 'Range de valor inválido' });
    }

    const result = await pool.query(
      `SELECT id AS skin_id,
              name,
              weapon,
              skin_name,
              wear,
              rarity,
              rarity_color,
              image_url,
              market_price,
              COALESCE(site_price, market_price) AS site_price,
              COALESCE(site_price, market_price) AS value
       FROM skins
       WHERE COALESCE(site_price, market_price) >= $1
         AND COALESCE(site_price, market_price) <= $2
       ORDER BY COALESCE(site_price, market_price) ASC
       LIMIT 60`,
      [minValue, maxValue]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar alvos de upgrade:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

/**
 * POST /api/upgrade/attempt
 * Body: { opening_id, target_skin_id }
 */
exports.attempt = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { opening_id, target_skin_id } = req.body;

    if (!opening_id || !target_skin_id) {
      throw { status: 400, message: 'opening_id e target_skin_id são obrigatórios' };
    }

    // Buscar e travar a opening do usuario
    const openingResult = await client.query(
      `SELECT o.id, o.sold, o.skin_id,
              COALESCE(s.site_price, s.market_price) AS value
       FROM openings o
       JOIN skins s ON o.skin_id = s.id
       WHERE o.id = $1 AND o.user_id = $2 AND o.sold = false
       FOR UPDATE`,
      [opening_id, req.userId]
    );

    if (openingResult.rows.length === 0) {
      throw { status: 404, message: 'Item não encontrado ou já utilizado' };
    }

    const fromValue = openingResult.rows[0].value;

    // Buscar skin alvo
    const targetResult = await client.query(
      `SELECT id, name, weapon, skin_name, wear, rarity, rarity_color, image_url,
              market_price, COALESCE(site_price, market_price) AS site_price,
              COALESCE(site_price, market_price) AS value
       FROM skins
       WHERE id = $1`,
      [target_skin_id]
    );

    if (targetResult.rows.length === 0) {
      throw { status: 404, message: 'Skin alvo não encontrada' };
    }

    const targetSkin = targetResult.rows[0];
    const toValue = targetSkin.value;

    if (toValue <= fromValue) {
      throw { status: 400, message: 'A skin alvo deve ter valor maior que a skin apostada' };
    }

    // Calcular chance: (V1 / V2) * 0.90
    const winChance = (fromValue / toValue) * 0.90;

    // Resultado: gerar número [0, 1)
    // crypto.randomInt(0, 1000000) / 1000000 para precisão de 6 casas
    const roll = crypto.randomInt(0, 1000000) / 1000000;
    const won = roll < winChance;

    // Marcar opening original como vendida (removida do inventario)
    await client.query(
      'UPDATE openings SET sold = true, sell_price = $1 WHERE id = $2',
      [fromValue, opening_id]
    );

    let newOpeningId = null;

    if (won) {
      // Criar nova opening com a skin alvo
      const newOpening = await client.query(
        `INSERT INTO openings (user_id, case_id, skin_id)
         VALUES ($1, NULL, $2)
         RETURNING id`,
        [req.userId, target_skin_id]
      );
      newOpeningId = newOpening.rows[0].id;
    }

    // Registrar upgrade na tabela upgrades
    await client.query(
      `INSERT INTO upgrades (user_id, from_opening_id, to_skin_id, from_value, to_value, win_chance, won)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [req.userId, opening_id, target_skin_id, fromValue, toValue, Math.round(winChance * 10000), won]
    );

    // Conceder +5 XP pela tentativa
    await awardXP(req.userId, 5, client);

    await client.query('COMMIT');

    return res.json({
      won,
      roll: parseFloat(roll.toFixed(6)),
      win_chance: parseFloat(winChance.toFixed(6)),
      from_value: fromValue,
      to_value: toValue,
      new_opening_id: newOpeningId,
      target_skin: {
        id: targetSkin.id,
        name: targetSkin.name,
        weapon: targetSkin.weapon,
        skin_name: targetSkin.skin_name,
        wear: targetSkin.wear,
        rarity: targetSkin.rarity,
        rarity_color: targetSkin.rarity_color,
        image_url: targetSkin.image_url,
        market_price: targetSkin.market_price,
        site_price: targetSkin.site_price,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    console.error('Erro ao processar upgrade:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    client.release();
  }
};
