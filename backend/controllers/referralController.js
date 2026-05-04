/**
 * tradex-GG
 * @section backend — Referral System
 */
const crypto = require('crypto');
const pool   = require('../config/db');

function genCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase(); // e.g. "A3F2B891"
}

// GET /api/referral/code — returns or creates the user's referral code
exports.getCode = async (req, res) => {
  try {
    let result = await pool.query(
      'SELECT referral_code FROM users WHERE id = $1', [req.userId]
    );
    let code = result.rows[0]?.referral_code;

    if (!code) {
      // Generate unique code (retry on collision)
      let attempts = 0;
      while (!code && attempts < 10) {
        const candidate = genCode();
        try {
          await pool.query(
            'UPDATE users SET referral_code = $1 WHERE id = $2', [candidate, req.userId]
          );
          code = candidate;
        } catch (e) {
          if (e.code !== '23505') throw e; // only retry on unique violation
          attempts++;
        }
      }
    }

    const baseUrl = process.env.SITE_URL || '';
    res.json({ code, url: `${baseUrl}/register.html?ref=${code}` });
  } catch (err) {
    console.error('referral.getCode:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// GET /api/referral/stats — how many people I referred + total referrer bonus earned
exports.getStats = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         COUNT(*)::int AS total_referred,
         COUNT(*) FILTER (WHERE referral_bonus_paid = TRUE)::int AS bonuses_paid
       FROM users
       WHERE referred_by = $1`,
      [req.userId]
    );
    const row = result.rows[0];
    res.json({
      total_referred: row.total_referred,
      bonuses_paid:   row.bonuses_paid,
      bonus_per_ref:  1000, // centavos
    });
  } catch (err) {
    console.error('referral.getStats:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
