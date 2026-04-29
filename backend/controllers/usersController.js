/**
 * tradex-GG
 * @author willSolareviczz
 * @github https://github.com/willSolareviczz/tradex-GG
 * @section backend
 */
const pool = require('../config/db');

const DAILY_BONUS_AMOUNT = 500; // R$5,00

exports.getMe = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, email, balance, avatar_url, created_at,
              COALESCE(xp, 0) AS xp, COALESCE(level, 1) AS level,
              email_verified, daily_claimed_at
       FROM users WHERE id = $1`,
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const user = result.rows[0];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    user.daily_available = !user.daily_claimed_at || new Date(user.daily_claimed_at) < today;
    delete user.daily_claimed_at;

    res.json(user);
  } catch (err) {
    console.error('Erro ao buscar usuário:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.claimDaily = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(
      'SELECT daily_claimed_at FROM users WHERE id = $1 FOR UPDATE',
      [req.userId]
    );

    const claimedAt = result.rows[0]?.daily_claimed_at;
    const today = new Date(); today.setHours(0, 0, 0, 0);

    if (claimedAt && new Date(claimedAt) >= today) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Bônus diário já coletado hoje. Volte amanhã!' });
    }

    await client.query(
      'UPDATE users SET balance = balance + $1, daily_claimed_at = NOW() WHERE id = $2',
      [DAILY_BONUS_AMOUNT, req.userId]
    );

    await client.query(
      `INSERT INTO transactions (user_id, type, amount, description)
       VALUES ($1, 'deposit', $2, 'Bônus diário')`,
      [req.userId, DAILY_BONUS_AMOUNT]
    );

    const updated = await client.query(
      'SELECT balance FROM users WHERE id = $1',
      [req.userId]
    );

    await client.query('COMMIT');

    res.json({
      message: 'Bônus diário coletado!',
      amount: DAILY_BONUS_AMOUNT,
      new_balance: updated.rows[0].balance,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro ao coletar bônus diário:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    client.release();
  }
};

exports.getProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const userResult = await pool.query(
      'SELECT id, username, avatar_url, created_at FROM users WHERE id = $1',
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const statsResult = await pool.query(
      `SELECT
        COUNT(*) as total_openings,
        COUNT(CASE WHEN sold = true THEN 1 END) as total_sold
      FROM openings WHERE user_id = $1`,
      [id]
    );

    const bestDropResult = await pool.query(
      `SELECT s.name, s.rarity, s.rarity_color, s.market_price, s.image_url
       FROM openings o JOIN skins s ON o.skin_id = s.id
       WHERE o.user_id = $1
       ORDER BY s.market_price DESC LIMIT 1`,
      [id]
    );

    const recentResult = await pool.query(
      `SELECT o.created_at, s.name, s.rarity, s.rarity_color, s.market_price, s.image_url, c.name as case_name
       FROM openings o
       JOIN skins s ON o.skin_id = s.id
       JOIN cases c ON o.case_id = c.id
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC LIMIT 10`,
      [id]
    );

    res.json({
      user: userResult.rows[0],
      stats: statsResult.rows[0],
      best_drop: bestDropResult.rows[0] || null,
      recent_openings: recentResult.rows,
    });
  } catch (err) {
    console.error('Erro ao buscar perfil:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
