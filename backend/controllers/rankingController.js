/**
 * tradex-GG
 * @author willSolareviczz
 * @github https://github.com/willSolareviczz/tradex-GG
 * @section backend
 */
const pool = require('../config/db');

exports.getRanking = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.created_at, u.username, u.avatar_url,
              s.name as skin_name, s.rarity, s.rarity_color, s.image_url, s.market_price,
              c.name as case_name
       FROM openings o
       JOIN users u ON o.user_id = u.id
       JOIN skins s ON o.skin_id = s.id
       JOIN cases c ON o.case_id = c.id
       ORDER BY s.market_price DESC
       LIMIT 50`
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar ranking:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
