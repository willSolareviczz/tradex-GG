/**
 * tradex-GG
 * @author willSolareviczz
 * @github https://github.com/willSolareviczz/tradex-GG
 * @section backend
 */
const pool = require('../config/db');

exports.getInventory = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 24));
    const offset = (page - 1) * limit;

    const [countRes, dataRes, summaryRes] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM openings WHERE user_id = $1 AND sold = false', [req.userId]),
      pool.query(
        `SELECT o.id as opening_id, o.created_at, s.id as skin_id, s.name, s.weapon,
                s.skin_name, s.wear, s.rarity, s.rarity_color, s.image_url,
                s.market_price,
                COALESCE(s.site_price, s.market_price) AS site_price,
                c.name as case_name
         FROM openings o
         JOIN skins s ON o.skin_id = s.id
         JOIN cases c ON o.case_id = c.id
         WHERE o.user_id = $1 AND o.sold = false
         ORDER BY o.created_at DESC
         LIMIT $2 OFFSET $3`,
        [req.userId, limit, offset]
      ),
      pool.query(
        `SELECT
           COUNT(*)::int AS total_count,
           COALESCE(SUM(COALESCE(s.site_price, s.market_price)), 0)::int AS total_value
         FROM openings o
         JOIN skins s ON o.skin_id = s.id
         WHERE o.user_id = $1 AND o.sold = false`,
        [req.userId]
      ),
    ]);

    const total = parseInt(countRes.rows[0].count);
    res.json({
      items: dataRes.rows,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      summary: summaryRes.rows[0],
    });
  } catch (err) {
    console.error('Erro ao buscar inventário:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.sellSkin = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;

    // Get opening and lock it
    // Usa site_price (atualizado via API) com fallback para market_price
    const openingResult = await client.query(
      `SELECT o.id, o.sold, COALESCE(s.site_price, s.market_price) AS sell_price
       FROM openings o
       JOIN skins s ON o.skin_id = s.id
       WHERE o.id = $1 AND o.user_id = $2 FOR UPDATE`,
      [id, req.userId]
    );

    if (openingResult.rows.length === 0) {
      throw { status: 404, message: 'Item não encontrado' };
    }

    if (openingResult.rows[0].sold) {
      throw { status: 400, message: 'Item já foi vendido' };
    }

    const sellPrice = openingResult.rows[0].sell_price;

    // Mark as sold
    await client.query(
      'UPDATE openings SET sold = true, sell_price = $1 WHERE id = $2',
      [sellPrice, id]
    );

    // Add balance to user
    await client.query(
      'UPDATE users SET balance = balance + $1 WHERE id = $2',
      [sellPrice, req.userId]
    );

    // Record transaction
    await client.query(
      `INSERT INTO transactions (user_id, type, amount, description)
       VALUES ($1, 'sell', $2, 'Venda de skin')`,
      [req.userId, sellPrice]
    );

    // Get new balance
    const balanceResult = await client.query(
      'SELECT balance FROM users WHERE id = $1',
      [req.userId]
    );

    await client.query('COMMIT');

    res.json({
      message: 'Item vendido com sucesso',
      sell_price: sellPrice,
      new_balance: balanceResult.rows[0].balance,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    console.error('Erro ao vender skin:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    client.release();
  }
};

exports.sellAll = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const openings = await client.query(
      `SELECT o.id, COALESCE(s.site_price, s.market_price) AS sell_price
       FROM openings o
       JOIN skins s ON o.skin_id = s.id
       WHERE o.user_id = $1 AND o.sold = false
       FOR UPDATE`,
      [req.userId]
    );

    if (openings.rows.length === 0) {
      await client.query('ROLLBACK');
      const balRes = await pool.query('SELECT balance FROM users WHERE id = $1', [req.userId]);
      return res.json({ sold: 0, total_amount: 0, new_balance: balRes.rows[0].balance });
    }

    const totalAmount = openings.rows.reduce((sum, r) => sum + parseInt(r.sell_price), 0);
    const valueRows = openings.rows.map(r => `(${r.id}, ${parseInt(r.sell_price)})`).join(',');

    await client.query(
      `UPDATE openings SET sold = true, sell_price = v.price
       FROM (VALUES ${valueRows}) AS v(id, price)
       WHERE openings.id = v.id`
    );

    await client.query('UPDATE users SET balance = balance + $1 WHERE id = $2', [totalAmount, req.userId]);

    await client.query(
      `INSERT INTO transactions (user_id, type, amount, description)
       VALUES ($1, 'sell', $2, $3)`,
      [req.userId, totalAmount, `Venda em massa de ${openings.rows.length} ${openings.rows.length === 1 ? 'item' : 'itens'}`]
    );

    const balRes = await client.query('SELECT balance FROM users WHERE id = $1', [req.userId]);
    await client.query('COMMIT');

    res.json({ sold: openings.rows.length, total_amount: totalAmount, new_balance: balRes.rows[0].balance });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('sellAll:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    client.release();
  }
};
