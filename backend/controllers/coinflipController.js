/**
 * tradex-GG
 * @author willSolareviczz
 * @section backend — Coinflip Mode
 */
const crypto     = require('crypto');
const pool       = require('../config/db');
const { awardXP } = require('../services/xpService');
const sseService  = require('../services/sseService');
const { createNotification } = require('../services/notificationService');

const VALUE_TOLERANCE = 0.40; // joiner skin must be within 40% of creator skin value

exports.getCoinflips = async (req, res) => {
  try {
    const [waitingRes, recentRes] = await Promise.all([
      pool.query(
        `SELECT cf.id, cf.creator_id, u.username AS creator_username,
                cf.creator_value,
                s.name AS skin_name, s.weapon, s.skin_name AS skin_skin_name,
                s.wear, s.rarity_color, s.image_url,
                cf.created_at
         FROM coinflips cf
         JOIN users u ON cf.creator_id = u.id
         JOIN openings o ON cf.creator_opening_id = o.id
         JOIN skins s ON o.skin_id = s.id
         WHERE cf.status = 'waiting'
         ORDER BY cf.created_at DESC
         LIMIT 30`
      ),
      pool.query(
        `SELECT cf.id,
                cf.creator_id, uc.username AS creator_username,
                cf.joiner_id,  uj.username AS joiner_username,
                cf.winner_id, cf.creator_value, cf.joiner_value,
                cs.weapon AS creator_weapon, cs.skin_name AS creator_skin_name,
                cs.rarity_color AS creator_rarity_color, cs.image_url AS creator_image_url,
                js.weapon AS joiner_weapon,  js.skin_name AS joiner_skin_name,
                js.rarity_color AS joiner_rarity_color,  js.image_url AS joiner_image_url,
                cf.completed_at
         FROM coinflips cf
         JOIN users uc  ON cf.creator_id = uc.id
         LEFT JOIN users uj ON cf.joiner_id = uj.id
         LEFT JOIN openings co ON cf.creator_opening_id = co.id
         LEFT JOIN skins cs ON co.skin_id = cs.id
         LEFT JOIN openings jo ON cf.joiner_opening_id = jo.id
         LEFT JOIN skins js ON jo.skin_id = js.id
         WHERE cf.status = 'completed'
         ORDER BY cf.completed_at DESC
         LIMIT 20`
      ),
    ]);

    res.json({ waiting: waitingRes.rows, recent: recentRes.rows });
  } catch (err) {
    console.error('getCoinflips:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.createCoinflip = async (req, res) => {
  const { opening_id } = req.body;
  if (!opening_id) return res.status(400).json({ error: 'opening_id obrigatório' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verify opening belongs to user and is unsold and not already in a coinflip
    const openingRes = await client.query(
      `SELECT o.id, o.user_id, o.sold,
              COALESCE(s.site_price, s.market_price) AS value,
              s.name, s.weapon, s.skin_name, s.wear, s.rarity_color, s.image_url
       FROM openings o
       JOIN skins s ON o.skin_id = s.id
       WHERE o.id = $1 FOR UPDATE`,
      [opening_id]
    );
    const opening = openingRes.rows[0];
    if (!opening)                        throw { status: 404, message: 'Item não encontrado' };
    if (opening.user_id !== req.userId)  throw { status: 403, message: 'Item não pertence a você' };
    if (opening.sold)                    throw { status: 400, message: 'Item já vendido' };

    // Check not already in active coinflip
    const inGameRes = await client.query(
      `SELECT id FROM coinflips
       WHERE (creator_opening_id = $1 OR joiner_opening_id = $1) AND status = 'waiting'`,
      [opening_id]
    );
    if (inGameRes.rows.length > 0) throw { status: 400, message: 'Item já em coinflip ativo' };

    const userRes = await client.query(
      'SELECT username FROM users WHERE id = $1', [req.userId]
    );

    const cfRes = await client.query(
      `INSERT INTO coinflips (creator_id, creator_opening_id, creator_value, status)
       VALUES ($1, $2, $3, 'waiting') RETURNING id, created_at`,
      [req.userId, opening_id, opening.value]
    );

    await client.query('COMMIT');

    const coinflip = {
      id:               cfRes.rows[0].id,
      creator_id:       req.userId,
      creator_username: userRes.rows[0].username,
      creator_value:    opening.value,
      skin_name:        opening.name,
      weapon:           opening.weapon,
      skin_skin_name:   opening.skin_name,
      wear:             opening.wear,
      rarity_color:     opening.rarity_color,
      image_url:        opening.image_url,
      created_at:       cfRes.rows[0].created_at,
    };

    setImmediate(() => sseService.broadcast('new-coinflip', coinflip));

    res.json({ coinflip });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('createCoinflip:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    client.release();
  }
};

exports.joinCoinflip = async (req, res) => {
  const { id } = req.params;
  const { opening_id } = req.body;
  if (!opening_id) return res.status(400).json({ error: 'opening_id obrigatório' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const cfRes = await client.query(
      `SELECT * FROM coinflips WHERE id = $1 FOR UPDATE`, [id]
    );
    const cf = cfRes.rows[0];
    if (!cf)                          throw { status: 404, message: 'Coinflip não encontrado' };
    if (cf.status !== 'waiting')      throw { status: 400, message: 'Coinflip já encerrado' };
    if (cf.creator_id === req.userId) throw { status: 400, message: 'Não pode entrar no próprio coinflip' };

    // Verify joiner's opening
    const joinerOpeningRes = await client.query(
      `SELECT o.id, o.user_id, o.sold,
              COALESCE(s.site_price, s.market_price) AS value,
              s.weapon, s.skin_name, s.rarity_color, s.image_url
       FROM openings o
       JOIN skins s ON o.skin_id = s.id
       WHERE o.id = $1 FOR UPDATE`,
      [opening_id]
    );
    const joinerOpening = joinerOpeningRes.rows[0];
    if (!joinerOpening)                          throw { status: 404, message: 'Item não encontrado' };
    if (joinerOpening.user_id !== req.userId)    throw { status: 403, message: 'Item não pertence a você' };
    if (joinerOpening.sold)                      throw { status: 400, message: 'Item já vendido' };

    // Value tolerance check
    const ratio = joinerOpening.value / cf.creator_value;
    if (ratio < (1 - VALUE_TOLERANCE) || ratio > (1 + VALUE_TOLERANCE)) {
      throw {
        status: 400,
        message: `Valor incompatível. Seu item (${formatCentavos(joinerOpening.value)}) deve estar entre ${formatCentavos(Math.floor(cf.creator_value * (1 - VALUE_TOLERANCE)))} e ${formatCentavos(Math.ceil(cf.creator_value * (1 + VALUE_TOLERANCE)))}`,
      };
    }

    // Get creator's opening skin info
    const creatorOpeningRes = await client.query(
      `SELECT s.weapon, s.skin_name, s.rarity_color, s.image_url
       FROM openings o JOIN skins s ON o.skin_id = s.id
       WHERE o.id = $1`, [cf.creator_opening_id]
    );

    const joinerRes  = await client.query('SELECT username FROM users WHERE id = $1', [req.userId]);
    const creatorRes = await client.query('SELECT username FROM users WHERE id = $1', [cf.creator_id]);

    // Flip — HMAC-based
    const serverSeed = crypto.randomBytes(32).toString('hex');
    const hmac = crypto.createHmac('sha256', serverSeed);
    hmac.update(`${req.userId}:${cf.creator_id}:${id}`);
    const hex    = hmac.digest('hex').slice(0, 8);
    const roll   = parseInt(hex, 16) % 2;
    const creatorWins = roll === 0;
    const winnerId    = creatorWins ? cf.creator_id : req.userId;

    // Transfer both skins to winner
    await client.query(
      'UPDATE openings SET user_id = $1 WHERE id = $2 OR id = $3',
      [winnerId, cf.creator_opening_id, opening_id]
    );

    await awardXP(cf.creator_id, 20, client);
    await awardXP(req.userId, 20, client);

    await client.query(
      `UPDATE coinflips
       SET status = 'completed', joiner_id = $1, joiner_opening_id = $2,
           joiner_value = $3, winner_id = $4, server_seed = $5, completed_at = NOW()
       WHERE id = $6`,
      [req.userId, opening_id, joinerOpening.value, winnerId, serverSeed, id]
    );

    await client.query('COMMIT');

    const creatorSkin = creatorOpeningRes.rows[0];
    const result = {
      coinflip_id:      parseInt(id),
      creator_id:       cf.creator_id,
      creator_username: creatorRes.rows[0].username,
      joiner_id:        req.userId,
      joiner_username:  joinerRes.rows[0].username,
      winner_id:        winnerId,
      creator_skin: {
        weapon: creatorSkin.weapon, skin_name: creatorSkin.skin_name,
        rarity_color: creatorSkin.rarity_color, image_url: creatorSkin.image_url,
        value: cf.creator_value,
      },
      joiner_skin: {
        weapon: joinerOpening.weapon, skin_name: joinerOpening.skin_name,
        rarity_color: joinerOpening.rarity_color, image_url: joinerOpening.image_url,
        value: joinerOpening.value,
      },
      server_seed,
    };

    setImmediate(() => {
      const totalVal = result.creator_skin.value + result.joiner_skin.value;
      const fmtVal   = `R$${(totalVal / 100).toFixed(2).replace('.', ',')}`;
      const creatorWon = winnerId === cf.creator_id;
      createNotification(cf.creator_id, 'coinflip',
        creatorWon ? `Coinflip vencido! 🪙` : `Coinflip perdido`,
        creatorWon ? `Você ganhou as duas skins (${fmtVal})!` : `${result.joiner_username} venceu no cara ou coroa.`,
        '/coinflip.html'
      );
      createNotification(req.userId, 'coinflip',
        !creatorWon ? `Coinflip vencido! 🪙` : `Coinflip perdido`,
        !creatorWon ? `Você ganhou as duas skins (${fmtVal})!` : `${result.creator_username} venceu no cara ou coroa.`,
        '/coinflip.html'
      );
    });
    setImmediate(() => sseService.broadcast('coinflip-completed', {
      coinflip_id:      result.coinflip_id,
      creator_username: result.creator_username,
      joiner_username:  result.joiner_username,
      winner_id:        winnerId,
      creator_skin:     result.creator_skin,
      joiner_skin:      result.joiner_skin,
    }));

    res.json(result);
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('joinCoinflip:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    client.release();
  }
};

exports.cancelCoinflip = async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const cfRes = await client.query(`SELECT * FROM coinflips WHERE id = $1 FOR UPDATE`, [id]);
    const cf = cfRes.rows[0];
    if (!cf)                           throw { status: 404, message: 'Coinflip não encontrado' };
    if (cf.creator_id !== req.userId)  throw { status: 403, message: 'Sem permissão' };
    if (cf.status !== 'waiting')       throw { status: 400, message: 'Coinflip já encerrado' };

    await client.query(`UPDATE coinflips SET status = 'cancelled' WHERE id = $1`, [id]);
    await client.query('COMMIT');

    setImmediate(() => sseService.broadcast('coinflip-cancelled', { coinflip_id: parseInt(id) }));

    res.json({ message: 'Coinflip cancelado. Item devolvido ao inventário.' });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('cancelCoinflip:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    client.release();
  }
};

// Helper — not imported from formatPrice (backend)
function formatCentavos(c) {
  return `R$${(c / 100).toFixed(2).replace('.', ',')}`;
}
