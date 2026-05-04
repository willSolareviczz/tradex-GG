/**
 * tradex-GG
 * @author willSolareviczz
 * @section backend — Battle Mode PvP
 */
const crypto     = require('crypto');
const pool       = require('../config/db');
const { awardXP } = require('../services/xpService');
const sseService  = require('../services/sseService');
const { createNotification } = require('../services/notificationService');

function pickSkin(skins) {
  const total = skins.reduce((s, x) => s + x.weight, 0);
  const rand  = crypto.randomInt(0, total);
  let acc = 0;
  for (const skin of skins) {
    acc += skin.weight;
    if (rand < acc) return skin;
  }
  return skins[skins.length - 1];
}

exports.getBattles = async (req, res) => {
  try {
    const [waitingRes, recentRes] = await Promise.all([
      pool.query(
        `SELECT b.id, b.case_id, c.name AS case_name, c.price AS case_price, c.image_url AS case_image,
                b.creator_id, u.username AS creator_username, b.created_at
         FROM battles b
         JOIN cases c ON b.case_id = c.id
         JOIN users u ON b.creator_id = u.id
         WHERE b.status = 'waiting'
         ORDER BY b.created_at DESC
         LIMIT 30`
      ),
      pool.query(
        `SELECT b.id, c.name AS case_name, c.price AS case_price,
                b.creator_id, uc.username AS creator_username,
                b.joiner_id,  uj.username AS joiner_username,
                b.winner_id,
                cs.weapon AS creator_weapon, cs.skin_name AS creator_skin_name,
                cs.rarity_color AS creator_rarity_color, cs.image_url AS creator_image_url,
                COALESCE(cs.site_price, cs.market_price) AS creator_value,
                js.weapon AS joiner_weapon,  js.skin_name AS joiner_skin_name,
                js.rarity_color AS joiner_rarity_color,  js.image_url AS joiner_image_url,
                COALESCE(js.site_price, js.market_price) AS joiner_value,
                b.completed_at
         FROM battles b
         JOIN cases c   ON b.case_id = c.id
         JOIN users uc  ON b.creator_id = uc.id
         LEFT JOIN users uj  ON b.joiner_id = uj.id
         LEFT JOIN openings co ON b.creator_opening_id = co.id
         LEFT JOIN skins cs    ON co.skin_id = cs.id
         LEFT JOIN openings jo ON b.joiner_opening_id = jo.id
         LEFT JOIN skins js    ON jo.skin_id = js.id
         WHERE b.status = 'completed'
         ORDER BY b.completed_at DESC
         LIMIT 20`
      ),
    ]);

    res.json({ waiting: waitingRes.rows, recent: recentRes.rows });
  } catch (err) {
    console.error('getBattles:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.createBattle = async (req, res) => {
  const { case_id } = req.body;
  if (!case_id) return res.status(400).json({ error: 'case_id obrigatório' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const userRes = await client.query(
      'SELECT balance, username FROM users WHERE id = $1 FOR UPDATE', [req.userId]
    );
    if (!userRes.rows[0]) throw { status: 404, message: 'Usuário não encontrado' };

    const caseRes = await client.query(
      'SELECT id, name, price, image_url FROM cases WHERE id = $1 AND is_active = true AND is_deleted = false',
      [case_id]
    );
    if (!caseRes.rows[0]) throw { status: 404, message: 'Caixa não encontrada' };

    const { balance, username } = userRes.rows[0];
    const { price, name, image_url } = caseRes.rows[0];

    if (balance < price) throw { status: 400, message: 'Saldo insuficiente' };

    await client.query('UPDATE users SET balance = balance - $1 WHERE id = $2', [price, req.userId]);
    await client.query(
      `INSERT INTO transactions (user_id, type, amount, description) VALUES ($1, 'case_open', $2, $3)`,
      [req.userId, price, `Battle criada: ${name}`]
    );

    const bRes = await client.query(
      `INSERT INTO battles (case_id, creator_id, status, price) VALUES ($1, $2, 'waiting', $3) RETURNING id, created_at`,
      [case_id, req.userId, price]
    );

    await client.query('COMMIT');

    const battle = {
      id: bRes.rows[0].id,
      case_id: parseInt(case_id),
      case_name: name,
      case_price: price,
      case_image: image_url,
      creator_id: req.userId,
      creator_username: username,
      created_at: bRes.rows[0].created_at,
    };

    setImmediate(() => sseService.broadcast('new-battle', battle));

    res.json({ battle, new_balance: balance - price });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('createBattle:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    client.release();
  }
};

exports.joinBattle = async (req, res) => {
  const { id } = req.params;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const bRes = await client.query(
      `SELECT b.*, c.price, c.name AS case_name
       FROM battles b JOIN cases c ON b.case_id = c.id
       WHERE b.id = $1 FOR UPDATE`,
      [id]
    );
    const battle = bRes.rows[0];
    if (!battle)                          throw { status: 404, message: 'Batalha não encontrada' };
    if (battle.status !== 'waiting')      throw { status: 400, message: 'Batalha já encerrada' };
    if (battle.creator_id === req.userId) throw { status: 400, message: 'Você não pode entrar na própria batalha' };

    const joinerRes = await client.query(
      'SELECT balance, username FROM users WHERE id = $1 FOR UPDATE', [req.userId]
    );
    const { balance: joinerBal, username: joinerName } = joinerRes.rows[0];
    if (joinerBal < battle.price) throw { status: 400, message: 'Saldo insuficiente' };

    const creatorRes = await client.query('SELECT username FROM users WHERE id = $1', [battle.creator_id]);

    await client.query('UPDATE users SET balance = balance - $1 WHERE id = $2', [battle.price, req.userId]);
    await client.query(
      `INSERT INTO transactions (user_id, type, amount, description) VALUES ($1, 'case_open', $2, $3)`,
      [req.userId, battle.price, `Battle: ${battle.case_name}`]
    );

    const skinsRes = await client.query(
      `SELECT cs.weight, s.id AS skin_id, s.name, s.weapon, s.skin_name, s.wear,
              s.rarity, s.rarity_color, s.image_url, s.market_price,
              COALESCE(s.site_price, s.market_price) AS site_price
       FROM case_skins cs JOIN skins s ON cs.skin_id = s.id
       WHERE cs.case_id = $1`,
      [battle.case_id]
    );
    const skins = skinsRes.rows;
    if (!skins.length) throw { status: 500, message: 'Caixa sem itens configurados' };

    const creatorSkin = pickSkin(skins);
    const joinerSkin  = pickSkin(skins);

    const creatorWins = creatorSkin.site_price >= joinerSkin.site_price;
    const winnerId    = creatorWins ? battle.creator_id : req.userId;

    // Both skins go to winner
    const coRes = await client.query(
      'INSERT INTO openings (user_id, case_id, skin_id) VALUES ($1, $2, $3) RETURNING id',
      [winnerId, battle.case_id, creatorSkin.skin_id]
    );
    const joRes = await client.query(
      'INSERT INTO openings (user_id, case_id, skin_id) VALUES ($1, $2, $3) RETURNING id',
      [winnerId, battle.case_id, joinerSkin.skin_id]
    );

    await awardXP(battle.creator_id, 15, client);
    await awardXP(req.userId, 15, client);

    await client.query(
      `UPDATE battles
       SET status = 'completed', joiner_id = $1,
           creator_opening_id = $2, joiner_opening_id = $3,
           winner_id = $4, completed_at = NOW()
       WHERE id = $5`,
      [req.userId, coRes.rows[0].id, joRes.rows[0].id, winnerId, id]
    );

    await client.query('COMMIT');

    const skinShape = (skin, opening_id) => ({
      opening_id,
      name:        skin.name,
      weapon:      skin.weapon,
      skin_name:   skin.skin_name,
      wear:        skin.wear,
      rarity:      skin.rarity,
      rarity_color: skin.rarity_color,
      image_url:   skin.image_url,
      value:       skin.site_price,
    });

    const result = {
      battle_id:        parseInt(id),
      creator_id:       battle.creator_id,
      creator_username: creatorRes.rows[0].username,
      joiner_id:        req.userId,
      joiner_username:  joinerName,
      winner_id:        winnerId,
      creator_skin:     skinShape(creatorSkin, coRes.rows[0].id),
      joiner_skin:      skinShape(joinerSkin,  joRes.rows[0].id),
      new_balance:      joinerBal - battle.price,
    };

    setImmediate(() => {
      sseService.broadcast('battle-completed', {
        battle_id:        result.battle_id,
        creator_username: result.creator_username,
        joiner_username:  result.joiner_username,
        winner_id:        winnerId,
        creator_skin:     result.creator_skin,
        joiner_skin:      result.joiner_skin,
      });
      const totalVal = result.creator_skin.value + result.joiner_skin.value;
      const fmtVal   = `R$${(totalVal / 100).toFixed(2).replace('.', ',')}`;
      const creatorWon = winnerId === battle.creator_id;
      createNotification(battle.creator_id, 'battle',
        creatorWon ? `Batalha vencida! 🏆` : `Batalha perdida`,
        creatorWon ? `Você ganhou as duas skins (${fmtVal})!` : `${result.joiner_username} venceu.`,
        '/battle.html'
      );
      createNotification(req.userId, 'battle',
        !creatorWon ? `Batalha vencida! 🏆` : `Batalha perdida`,
        !creatorWon ? `Você ganhou as duas skins (${fmtVal})!` : `${result.creator_username} venceu.`,
        '/battle.html'
      );
    });

    res.json(result);
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('joinBattle:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    client.release();
  }
};

exports.cancelBattle = async (req, res) => {
  const { id } = req.params;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const bRes = await client.query(
      `SELECT b.*, c.price FROM battles b JOIN cases c ON b.case_id = c.id WHERE b.id = $1 FOR UPDATE`,
      [id]
    );
    const battle = bRes.rows[0];
    if (!battle)                             throw { status: 404, message: 'Batalha não encontrada' };
    if (battle.creator_id !== req.userId)    throw { status: 403, message: 'Sem permissão' };
    if (battle.status !== 'waiting')         throw { status: 400, message: 'Batalha já encerrada' };

    await client.query('UPDATE users SET balance = balance + $1 WHERE id = $2', [battle.price, req.userId]);
    await client.query(
      `INSERT INTO transactions (user_id, type, amount, description) VALUES ($1, 'deposit', $2, 'Reembolso: batalha cancelada')`,
      [req.userId, battle.price]
    );
    await client.query(`UPDATE battles SET status = 'cancelled' WHERE id = $1`, [id]);

    const userRes = await client.query('SELECT balance FROM users WHERE id = $1', [req.userId]);
    await client.query('COMMIT');

    setImmediate(() => sseService.broadcast('battle-cancelled', { battle_id: parseInt(id) }));

    res.json({ message: 'Batalha cancelada', new_balance: userRes.rows[0].balance });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('cancelBattle:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    client.release();
  }
};
