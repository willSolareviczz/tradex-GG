/**
 * tradex-GG
 * @author willSolareviczz
 * @github https://github.com/willSolareviczz/tradex-GG
 * @section backend
 */
const jwt  = require('jsonwebtoken');
const pool = require('../config/db');

async function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  try {
    const token   = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userRes = await pool.query(
      'SELECT is_banned, banned_reason FROM users WHERE id = $1',
      [decoded.id]
    );
    const user = userRes.rows[0];
    if (!user) return res.status(401).json({ error: 'Usuário não encontrado' });
    if (user.is_banned) {
      return res.status(403).json({
        error: 'Conta banida',
        reason: user.banned_reason || 'Violação dos termos de uso.',
      });
    }

    req.userId = decoded.id;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

module.exports = authMiddleware;
