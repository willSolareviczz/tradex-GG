/**
 * tradex-GG
 * @author willSolareviczz
 * @github https://github.com/willSolareviczz/tradex-GG
 * @section backend
 */
const pool = require('../config/db');
const crypto = require('crypto');

// GET /api/battle/list
exports.list = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT b.*, c.name as case_name, c.image_url as case_image, c.price as case_price,
              u.username as creator_username,
              (SELECT COUNT(*) FROM battle_players bp WHERE bp.battle_id = b.id) as player_count
       FROM battles b
       JOIN cases c ON c.id = b.case_id
       LEFT JOIN users u ON u.id = b.creator_id
       WHERE b.status = 'waiting'
       ORDER BY b.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro interno' });
  }
};

// GET /api/battle/history
exports.history = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT b.*, c.name as case_name,
              (SELECT username FROM users WHERE id = b.creator_id) as creator_username
       FROM battles b
       JOIN cases c ON c.id = b.case_id
       WHERE b.status = 'completed'
       ORDER BY b.completed_at DESC
       LIMIT 20`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro interno' });
  }
};

// GET /api/battle/:id
exports.getOne = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT b.*, c.name as case_name, c.image_url as case_image, c.price as case_price
       FROM battles b
       JOIN cases c ON c.id = b.case_id
       WHERE b.id = $1`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Battle não encontrada' });

    const battle = rows[0];

    const { rows: players } = await pool.query(
      `SELECT bp.*, u.username, u.avatar_url
       FROM battle_players bp
       LEFT JOIN users u ON u.id = bp.user_id
       WHERE bp.battle_id = $1
       ORDER BY bp.slot ASC`,
      [battle.id]
    );

    const { rows: openings } = await pool.query(
      `SELECT bo.*, s.name as skin_name, s.weapon, s.image_url, s.rarity_color
       FROM battle_openings bo
       JOIN skins s ON s.id = bo.skin_id
       WHERE bo.battle_id = $1
       ORDER BY bo.player_slot ASC`,
      [battle.id]
    );

    res.json({ ...battle, players, openings });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno' });
  }
};

// POST /api/battle/create
exports.create = async (req, res) => {
  const userId = req.userId;
  const { case_id, max_players } = req.body;
  const maxPlayers = parseInt(max_players) || 2;

  if (maxPlayers < 2 || maxPlayers > 4) return res.status(400).json({ error: 'Max jogadores: 2-4' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: caseRows } = await client.query(
      `SELECT * FROM cases WHERE id = $1`,
      [case_id]
    );
    if (!caseRows[0]) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Caixa não encontrada' }); }
    const c = caseRows[0];

    const { rows: userRows } = await client.query(
      `UPDATE users SET balance = balance - $1 WHERE id = $2 AND balance >= $1 RETURNING balance`,
      [c.price, userId]
    );
    if (!userRows[0]) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Saldo insuficiente' }); }

    const { rows: battleRows } = await client.query(
      `INSERT INTO battles (case_id, creator_id, max_players, entry_fee, status)
       VALUES ($1, $2, $3, $4, 'waiting') RETURNING id`,
      [case_id, userId, maxPlayers, c.price]
    );
    const battleId = battleRows[0].id;

    await client.query(
      `INSERT INTO battle_players (battle_id, user_id, slot) VALUES ($1, $2, 1)`,
      [battleId, userId]
    );
    await client.query(
      `INSERT INTO transactions (user_id, type, amount, description) VALUES ($1, 'game_bet', $2, 'Case Battle - criou')`,
      [userId, c.price]
    );

    await client.query('COMMIT');
    res.json({ success: true, battle_id: battleId, new_balance: userRows[0].balance });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[battle] create:', err.message);
    res.status(500).json({ error: 'Erro interno' });
  } finally {
    client.release();
  }
};

// POST /api/battle/:id/join
exports.join = async (req, res) => {
  const userId = req.userId;
  const battleId = parseInt(req.params.id);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `SELECT b.*, c.price as case_price FROM battles b JOIN cases c ON c.id = b.case_id WHERE b.id = $1 FOR UPDATE`,
      [battleId]
    );
    const battle = rows[0];
    if (!battle) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Battle não encontrada' }); }
    if (battle.status !== 'waiting') { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Battle já iniciada' }); }

    const { rows: players } = await client.query(
      `SELECT * FROM battle_players WHERE battle_id = $1`,
      [battleId]
    );
    if (players.find(p => p.user_id === userId)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Você já está nessa battle' });
    }
    if (players.length >= battle.max_players) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Battle cheia' });
    }

    const { rows: userRows } = await client.query(
      `UPDATE users SET balance = balance - $1 WHERE id = $2 AND balance >= $1 RETURNING balance`,
      [battle.case_price, userId]
    );
    if (!userRows[0]) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Saldo insuficiente' }); }

    const nextSlot = Math.max(...players.map(p => p.slot)) + 1;
    await client.query(
      `INSERT INTO battle_players (battle_id, user_id, slot) VALUES ($1, $2, $3)`,
      [battleId, userId, nextSlot]
    );
    await client.query(
      `INSERT INTO transactions (user_id, type, amount, description) VALUES ($1, 'game_bet', $2, 'Case Battle - entrou')`,
      [userId, battle.case_price]
    );

    await client.query('COMMIT');
    res.json({ success: true, new_balance: userRows[0].balance });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[battle] join:', err.message);
    res.status(500).json({ error: 'Erro interno' });
  } finally {
    client.release();
  }
};
