/**
 * tradex-GG
 * @author willSolareviczz
 * @github https://github.com/willSolareviczz/tradex-GG
 * @section backend
 */
const pool = require('../config/db');

exports.getMe = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, balance, avatar_url, created_at, COALESCE(xp, 0) AS xp, COALESCE(level, 1) AS level FROM users WHERE id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao buscar usuário:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
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
