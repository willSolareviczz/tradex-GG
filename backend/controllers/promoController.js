/**
 * tradex-GG
 * @section backend — Promo Codes
 */
const pool = require('../config/db');

// ── User: redeem a code ───────────────────────────────────────────────────────
exports.redeem = async (req, res) => {
  const code = (req.body.code || '').toString().trim().toUpperCase();
  if (!code) return res.status(400).json({ error: 'Código obrigatório' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Fetch code and lock row
    const codeRes = await client.query(
      `SELECT * FROM promo_codes
       WHERE code = $1 FOR UPDATE`,
      [code]
    );
    const promo = codeRes.rows[0];

    if (!promo || !promo.is_active)
      throw { status: 400, message: 'Código inválido ou inativo' };

    if (promo.expires_at && new Date(promo.expires_at) < new Date())
      throw { status: 400, message: 'Código expirado' };

    if (promo.max_uses !== null && promo.uses_count >= promo.max_uses)
      throw { status: 400, message: 'Código esgotado' };

    // Check if already used by this user
    const usedRes = await client.query(
      'SELECT 1 FROM promo_code_uses WHERE code_id = $1 AND user_id = $2',
      [promo.id, req.userId]
    );
    if (usedRes.rows.length > 0)
      throw { status: 400, message: 'Você já usou este código' };

    // Apply bonus
    await client.query(
      'UPDATE users SET balance = balance + $1 WHERE id = $2',
      [promo.bonus_amount, req.userId]
    );
    await client.query(
      `INSERT INTO transactions (user_id, type, amount, description)
       VALUES ($1, 'deposit', $2, $3)`,
      [req.userId, promo.bonus_amount, `Código promocional: ${promo.code}`]
    );
    await client.query(
      'INSERT INTO promo_code_uses (code_id, user_id) VALUES ($1, $2)',
      [promo.id, req.userId]
    );
    await client.query(
      'UPDATE promo_codes SET uses_count = uses_count + 1 WHERE id = $1',
      [promo.id]
    );

    const balRes = await client.query(
      'SELECT balance FROM users WHERE id = $1', [req.userId]
    );
    await client.query('COMMIT');

    res.json({
      bonus:       promo.bonus_amount,
      new_balance: balRes.rows[0].balance,
      description: promo.description || null,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('promo.redeem:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    client.release();
  }
};

// ── Admin: list codes ─────────────────────────────────────────────────────────
exports.listCodes = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, code, description, bonus_amount, max_uses, uses_count,
              expires_at, is_active, created_at
       FROM promo_codes
       ORDER BY created_at DESC`
    );
    res.json({ codes: result.rows });
  } catch (err) {
    console.error('promo.listCodes:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ── Admin: create code ────────────────────────────────────────────────────────
exports.createCode = async (req, res) => {
  const code         = (req.body.code || '').toString().trim().toUpperCase();
  const description  = (req.body.description || '').toString().trim() || null;
  const bonus_amount = Math.round(Number(req.body.bonus_amount));
  const max_uses     = req.body.max_uses ? Math.round(Number(req.body.max_uses)) : null;
  const expires_at   = req.body.expires_at || null;

  if (!code || !/^[A-Z0-9_-]{2,32}$/.test(code))
    return res.status(400).json({ error: 'Código inválido (2-32 chars, A-Z 0-9 _ -)' });
  if (!Number.isFinite(bonus_amount) || bonus_amount < 1)
    return res.status(400).json({ error: 'Bônus inválido' });

  try {
    const result = await pool.query(
      `INSERT INTO promo_codes (code, description, bonus_amount, max_uses, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [code, description, bonus_amount, max_uses, expires_at]
    );
    res.json({ code: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Código já existe' });
    console.error('promo.createCode:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ── Admin: toggle active ──────────────────────────────────────────────────────
exports.toggleCode = async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE promo_codes SET is_active = NOT is_active WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Código não encontrado' });
    res.json({ code: result.rows[0] });
  } catch (err) {
    console.error('promo.toggleCode:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ── Admin: delete code ────────────────────────────────────────────────────────
exports.deleteCode = async (req, res) => {
  try {
    await pool.query('DELETE FROM promo_codes WHERE id = $1', [req.params.id]);
    res.json({ message: 'Código removido' });
  } catch (err) {
    console.error('promo.deleteCode:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
