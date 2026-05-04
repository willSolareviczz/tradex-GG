/**
 * tradex-GG
 * @author willSolareviczz
 * @github https://github.com/willSolareviczz/tradex-GG
 * @section backend
 */
const pool = require('../config/db');

exports.getHistory = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const [countRes, dataRes] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM openings WHERE user_id = $1', [req.userId]),
      pool.query(
        `SELECT o.id, o.created_at, o.sold, o.sell_price,
                o.server_seed, o.server_seed_hash, o.client_seed, o.nonce,
                s.name as skin_name, s.weapon, s.skin_name as skin_short,
                s.rarity, s.rarity_color, s.image_url, s.market_price, s.wear,
                COALESCE(s.site_price, s.market_price) AS site_price,
                c.name as case_name, c.image_url as case_image
         FROM openings o
         JOIN skins s ON o.skin_id = s.id
         JOIN cases c ON o.case_id = c.id
         WHERE o.user_id = $1
         ORDER BY o.created_at DESC
         LIMIT $2 OFFSET $3`,
        [req.userId, limit, offset]
      ),
    ]);

    const total = parseInt(countRes.rows[0].count);
    res.json({
      items: dataRes.rows,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('Erro ao buscar histórico:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
