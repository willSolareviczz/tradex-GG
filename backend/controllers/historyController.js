/**
 * tradex-GG
 * @author willSolareviczz
 * @github https://github.com/willSolareviczz/tradex-GG
 * @section backend
 */
const pool = require('../config/db');

exports.getHistory = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.id, o.created_at, o.sold, o.sell_price,
              s.name as skin_name, s.weapon, s.skin_name as skin_short,
              s.rarity, s.rarity_color, s.image_url, s.market_price,
              c.name as case_name, c.image_url as case_image
       FROM openings o
       JOIN skins s ON o.skin_id = s.id
       JOIN cases c ON o.case_id = c.id
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC
       LIMIT 100`,
      [req.userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar histórico:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
