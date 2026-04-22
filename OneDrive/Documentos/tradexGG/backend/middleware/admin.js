/**
 * tradex-GG
 * @author willSolareviczz
 * @github https://github.com/willSolareviczz/tradex-GG
 * @section backend
 */
const pool = require('../config/db');

async function adminMiddleware(req, res, next) {
  try {
    const result = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [req.userId]
    );

    if (result.rows.length === 0 || result.rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado: apenas administradores' });
    }

    next();
  } catch {
    return res.status(500).json({ error: 'Erro ao verificar permissões' });
  }
}

module.exports = adminMiddleware;
