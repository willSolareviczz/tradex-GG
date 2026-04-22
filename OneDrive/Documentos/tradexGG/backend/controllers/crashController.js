/**
 * tradex-GG
 * @author willSolareviczz
 * @github https://github.com/willSolareviczz/tradex-GG
 * @section backend
 */
const pool = require('../config/db');
const { currentMultiplier, GROWTH_MS } = require('../services/botService');

// GET /api/crash/current
exports.getCurrent = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM crash_games ORDER BY id DESC LIMIT 1`
    );
    const game = rows[0];
    if (!game) return res.json({ status: 'waiting', multiplier: 1.00 });

    let multiplier = 1.00;
    if (game.status === 'running') {
      multiplier = Math.max(1.00, currentMultiplier(game.started_at));
    } else if (game.status === 'crashed') {
      multiplier = game.crash_point;
    }

    const { rows: bets } = await pool.query(
      `SELECT cb.id, cb.amount, cb.cashout_at, cb.cashout_target, cb.profit,
              cb.is_bot, cb.bot_name, u.username
       FROM crash_bets cb
       LEFT JOIN users u ON u.id = cb.user_id
       WHERE cb.game_id = $1
       ORDER BY cb.created_at ASC`,
      [game.id]
    );

    // My bet if logged in
    let myBet = null;
    if (req.userId) {
      myBet = bets.find(b => !b.is_bot && b.user_id === req.userId) || null;
    }

    res.json({
      game_id:    game.id,
      status:     game.status,
      multiplier: Math.round(multiplier * 100) / 100,
      crash_point: game.status === 'crashed' ? game.crash_point : null,
      started_at: game.started_at,
      crashed_at: game.crashed_at,
      created_at: game.created_at,
      bets,
      my_bet: myBet,
    });
  } catch (err) {
    console.error('[crash] getCurrent error:', err.message);
    res.status(500).json({ error: 'Erro interno' });
  }
};

// POST /api/crash/bet
exports.placeBet = async (req, res) => {
  const userId = req.userId;
  const { amount } = req.body;
  if (!amount || amount < 100) return res.status(400).json({ error: 'Aposta mínima: R$1,00' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get current waiting game
    const { rows } = await client.query(
      `SELECT * FROM crash_games WHERE status = 'waiting' ORDER BY id DESC LIMIT 1`
    );
    if (!rows[0]) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Nenhum jogo aguardando apostas' });
    }
    const game = rows[0];

    // Check duplicate bet
    const { rows: existing } = await client.query(
      `SELECT id FROM crash_bets WHERE game_id = $1 AND user_id = $2`,
      [game.id, userId]
    );
    if (existing.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Você já apostou neste round' });
    }

    // Deduct balance
    const { rows: userRows } = await client.query(
      `UPDATE users SET balance = balance - $1 WHERE id = $2 AND balance >= $1 RETURNING balance`,
      [amount, userId]
    );
    if (!userRows[0]) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Saldo insuficiente' });
    }

    await client.query(
      `INSERT INTO crash_bets (game_id, user_id, amount) VALUES ($1, $2, $3)`,
      [game.id, userId, amount]
    );
    await client.query(
      `INSERT INTO transactions (user_id, type, amount, description) VALUES ($1, 'game_bet', $2, 'Crash - aposta')`,
      [userId, amount]
    );

    await client.query('COMMIT');
    res.json({ success: true, new_balance: userRows[0].balance });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[crash] placeBet error:', err.message);
    res.status(500).json({ error: 'Erro interno' });
  } finally {
    client.release();
  }
};

// POST /api/crash/cashout
exports.cashout = async (req, res) => {
  const userId = req.userId;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get running game
    const { rows: games } = await client.query(
      `SELECT * FROM crash_games WHERE status = 'running' ORDER BY id DESC LIMIT 1`
    );
    if (!games[0]) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Nenhum jogo em andamento' });
    }
    const game = games[0];

    const mult = Math.max(1.00, currentMultiplier(game.started_at));

    // Get user's bet
    const { rows: betRows } = await client.query(
      `SELECT * FROM crash_bets WHERE game_id = $1 AND user_id = $2 AND cashout_at IS NULL`,
      [game.id, userId]
    );
    if (!betRows[0]) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Aposta não encontrada ou já sacada' });
    }
    const bet = betRows[0];

    const roundedMult = Math.round(mult * 100) / 100;
    const payout = Math.round(bet.amount * roundedMult);
    const profit = payout - bet.amount;

    await client.query(
      `UPDATE crash_bets SET cashout_at = $1, profit = $2 WHERE id = $3`,
      [roundedMult, profit, bet.id]
    );
    const { rows: userRows } = await client.query(
      `UPDATE users SET balance = balance + $1 WHERE id = $2 RETURNING balance`,
      [payout, userId]
    );
    await client.query(
      `INSERT INTO transactions (user_id, type, amount, description) VALUES ($1, 'game_win', $2, $3)`,
      [userId, payout, `Crash - saque em ${roundedMult}x`]
    );

    await client.query('COMMIT');
    res.json({ success: true, multiplier: roundedMult, payout, profit, new_balance: userRows[0].balance });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[crash] cashout error:', err.message);
    res.status(500).json({ error: 'Erro interno' });
  } finally {
    client.release();
  }
};

// GET /api/crash/history
exports.getHistory = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, crash_point, status, created_at, crashed_at
       FROM crash_games WHERE status = 'crashed'
       ORDER BY id DESC LIMIT 20`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro interno' });
  }
};
