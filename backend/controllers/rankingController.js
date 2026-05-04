/**
 * tradex-GG
 * @author willSolareviczz
 * @github https://github.com/willSolareviczz/tradex-GG
 * @section backend
 */
const pool = require('../config/db');

exports.getXpRanking = async (req, res) => {
  try {
    const userId = req.userId || null; // opcional (auth middleware pode não estar ativo)

    const [topRes, posRes] = await Promise.all([
      pool.query(
        `SELECT u.id, u.username, u.avatar_url,
                COALESCE(u.xp, 0) AS xp,
                COALESCE(u.level, 1) AS level,
                COUNT(o.id)::int AS total_openings
         FROM users u
         LEFT JOIN openings o ON o.user_id = u.id
         GROUP BY u.id
         ORDER BY xp DESC, total_openings DESC
         LIMIT 50`
      ),
      userId
        ? pool.query(
            `SELECT position FROM (
               SELECT u.id, ROW_NUMBER() OVER (ORDER BY COALESCE(u.xp,0) DESC) AS position
               FROM users u
             ) ranked WHERE id = $1`,
            [userId]
          )
        : { rows: [] },
    ]);

    res.json({
      ranking: topRes.rows,
      my_position: posRes.rows[0]?.position ?? null,
    });
  } catch (err) {
    console.error('Erro ao buscar ranking XP:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

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
