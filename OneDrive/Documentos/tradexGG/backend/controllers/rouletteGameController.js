/**
 * tradex-GG
 * @author willSolareviczz
 * @github https://github.com/willSolareviczz/tradex-GG
 * @section backend
 */
const pool = require('../config/db');

// GET /api/roulette-game/current
exports.getCurrent = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM roulette_rounds ORDER BY id DESC LIMIT 1`
    );
    const round = rows[0];
    if (!round) return res.json({ status: 'betting', bets: [] });

    const { rows: bets } = await pool.query(
      `SELECT rb.id, rb.amount, rb.bet_on, rb.won, rb.profit,
              rb.is_bot, rb.bot_name, u.username
       FROM roulette_bets rb
       LEFT JOIN users u ON u.id = rb.user_id
       WHERE rb.round_id = $1
       ORDER BY rb.created_at ASC`,
      [round.id]
    );

    res.json({
      round_id:       round.id,
      status:         round.status,
      betting_ends_at: round.betting_ends_at,
      time_left_ms:   Math.max(0, new Date(round.betting_ends_at).getTime() - Date.now()),
      roll_value:     round.roll_value,
      color:          round.color,
      rolled_at:      round.rolled_at,
      bets,
    });
  } catch (err) {
    console.error('[roulette] getCurrent:', err.message);
    res.status(500).json({ error: 'Erro interno' });
  }
};

// POST /api/roulette-game/bet
exports.placeBet = async (req, res) => {
  const userId = req.userId;
  const { amount, bet_on } = req.body;

  if (!amount || amount < 100) return res.status(400).json({ error: 'Aposta mínima: R$1,00' });
  if (!['red', 'black', 'green'].includes(bet_on)) return res.status(400).json({ error: 'Cor inválida' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `SELECT * FROM roulette_rounds WHERE status = 'betting' ORDER BY id DESC LIMIT 1`
    );
    if (!rows[0] || new Date(rows[0].betting_ends_at) <= new Date()) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Apostas encerradas para este round' });
    }
    const round = rows[0];

    const { rows: userRows } = await client.query(
      `UPDATE users SET balance = balance - $1 WHERE id = $2 AND balance >= $1 RETURNING balance`,
      [amount, userId]
    );
    if (!userRows[0]) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Saldo insuficiente' });
    }

    await client.query(
      `INSERT INTO roulette_bets (round_id, user_id, amount, bet_on) VALUES ($1, $2, $3, $4)`,
      [round.id, userId, amount, bet_on]
    );
    await client.query(
      `INSERT INTO transactions (user_id, type, amount, description) VALUES ($1, 'game_bet', $2, 'Roulette - aposta')`,
      [userId, amount]
    );

    await client.query('COMMIT');
    res.json({ success: true, new_balance: userRows[0].balance });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[roulette] placeBet:', err.message);
    res.status(500).json({ error: 'Erro interno' });
  } finally {
    client.release();
  }
};

// GET /api/roulette-game/history
exports.getHistory = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, roll_value, color, rolled_at
       FROM roulette_rounds
       WHERE status IN ('rolling', 'completed') AND color IS NOT NULL
       ORDER BY id DESC LIMIT 30`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro interno' });
  }
};
