/**
 * tradex-GG
 * @author willSolareviczz
 * @github https://github.com/willSolareviczz/tradex-GG
 * @section backend
 */
const pool = require('../config/db');

// GET /api/coinflip/list
exports.list = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT cf.*, u.username as creator_username
       FROM coinflips cf
       LEFT JOIN users u ON u.id = cf.creator_id
       WHERE cf.status = 'waiting'
       ORDER BY cf.created_at DESC
       LIMIT 20`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro interno' });
  }
};

// GET /api/coinflip/history
exports.history = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT cf.*,
              uc.username as creator_username,
              uj.username as joiner_username,
              uw.username as winner_username
       FROM coinflips cf
       LEFT JOIN users uc ON uc.id = cf.creator_id
       LEFT JOIN users uj ON uj.id = cf.joiner_id
       LEFT JOIN users uw ON uw.id = cf.winner_id
       WHERE cf.status = 'completed'
       ORDER BY cf.completed_at DESC
       LIMIT 30`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro interno' });
  }
};

// POST /api/coinflip/create
exports.create = async (req, res) => {
  const userId = req.userId;
  const { amount, side } = req.body; // side: 'T' or 'CT'

  if (!amount || amount < 100) return res.status(400).json({ error: 'Aposta mínima: R$1,00' });
  if (!['T', 'CT'].includes(side)) return res.status(400).json({ error: 'Escolha T ou CT' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: userRows } = await client.query(
      `UPDATE users SET balance = balance - $1 WHERE id = $2 AND balance >= $1 RETURNING balance`,
      [amount, userId]
    );
    if (!userRows[0]) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Saldo insuficiente' });
    }

    await client.query(
      `INSERT INTO transactions (user_id, type, amount, description) VALUES ($1, 'game_bet', $2, 'Coinflip - criou')`,
      [userId, amount]
    );

    const { rows } = await client.query(
      `INSERT INTO coinflips (creator_id, amount, creator_side, status)
       VALUES ($1, $2, $3, 'waiting') RETURNING id`,
      [userId, amount, side]
    );

    await client.query('COMMIT');
    res.json({ success: true, flip_id: rows[0].id, new_balance: userRows[0].balance });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[coinflip] create error:', err.message);
    res.status(500).json({ error: 'Erro interno' });
  } finally {
    client.release();
  }
};

// POST /api/coinflip/:id/join
exports.join = async (req, res) => {
  const userId = req.userId;
  const flipId = parseInt(req.params.id);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `SELECT * FROM coinflips WHERE id = $1 FOR UPDATE`,
      [flipId]
    );
    const flip = rows[0];

    if (!flip) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Coinflip não encontrado' }); }
    if (flip.status !== 'waiting') { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Coinflip já encerrado' }); }
    if (flip.creator_id === userId) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Você não pode entrar no seu próprio coinflip' }); }

    const { rows: userRows } = await client.query(
      `UPDATE users SET balance = balance - $1 WHERE id = $2 AND balance >= $1 RETURNING balance`,
      [flip.amount, userId]
    );
    if (!userRows[0]) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Saldo insuficiente' }); }

    const joinerSide = flip.creator_side === 'T' ? 'CT' : 'T';
    const winSide = Math.random() < 0.5 ? 'T' : 'CT';
    const winnerId = winSide === flip.creator_side ? flip.creator_id : userId;
    const prize = Math.round(flip.amount * 2 * 0.95);

    await client.query(
      `UPDATE coinflips SET status='completed', joiner_id=$1, winner_side=$2, winner_id=$3, completed_at=NOW()
       WHERE id=$4`,
      [userId, winSide, winnerId, flipId]
    );
    await client.query(
      `UPDATE users SET balance = balance + $1 WHERE id = $2`,
      [prize, winnerId]
    );
    await client.query(
      `INSERT INTO transactions (user_id, type, amount, description) VALUES ($1, 'game_bet', $2, 'Coinflip - entrou')`,
      [userId, flip.amount]
    );
    await client.query(
      `INSERT INTO transactions (user_id, type, amount, description) VALUES ($1, 'game_win', $2, 'Coinflip - ganhou')`,
      [winnerId, prize]
    );

    await client.query('COMMIT');

    const updatedBalance = winnerId === userId ? userRows[0].balance + prize : userRows[0].balance;
    res.json({
      success: true,
      winner_side: winSide,
      winner_id: winnerId,
      you_won: winnerId === userId,
      prize,
      new_balance: updatedBalance,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[coinflip] join error:', err.message);
    res.status(500).json({ error: 'Erro interno' });
  } finally {
    client.release();
  }
};

// GET /api/coinflip/:id
exports.getOne = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT cf.*,
              uc.username as creator_username,
              uj.username as joiner_username
       FROM coinflips cf
       LEFT JOIN users uc ON uc.id = cf.creator_id
       LEFT JOIN users uj ON uj.id = cf.joiner_id
       WHERE cf.id = $1`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Não encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro interno' });
  }
};
