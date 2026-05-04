/**
 * tradex-GG
 * @section backend — Live Chat
 */
const pool       = require('../config/db');
const sseService = require('../services/sseService');

const MAX_LEN    = 200;
const HISTORY    = 50;

// Sanitização server-side: remove HTML/scripts
function sanitize(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\//g, '&#x2F;');
}

// Rate limit por usuário: no máximo 1 msg a cada 2s
const userLastMsg = new Map();
const MSG_COOLDOWN_MS = 2000;

exports.getMessages = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, user_id, username, message, created_at
       FROM chat_messages
       ORDER BY created_at DESC
       LIMIT $1`,
      [HISTORY]
    );
    res.json({ messages: result.rows.reverse() });
  } catch (err) {
    console.error('chat.getMessages:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.sendMessage = async (req, res) => {
  const raw     = (req.body.message || '').toString().trim();
  const message = sanitize(raw);
  if (!message)             return res.status(400).json({ error: 'Mensagem vazia' });
  if (raw.length > MAX_LEN)
    return res.status(400).json({ error: `Mensagem muito longa (máx ${MAX_LEN} caracteres)` });

  // Rate limit por usuário
  const now = Date.now();
  const last = userLastMsg.get(req.userId) || 0;
  if (now - last < MSG_COOLDOWN_MS) {
    return res.status(429).json({ error: 'Aguarde um momento antes de enviar outra mensagem.' });
  }
  userLastMsg.set(req.userId, now);

  try {
    const userRes = await pool.query(
      'SELECT username, chat_muted_until FROM users WHERE id = $1', [req.userId]
    );
    const userRow = userRes.rows[0];
    if (!userRow) return res.status(404).json({ error: 'Usuário não encontrado' });
    if (userRow.chat_muted_until && new Date(userRow.chat_muted_until) > new Date()) {
      return res.status(403).json({ error: 'Você está mutado no chat.' });
    }
    const username = sanitize(userRow.username);

    const result = await pool.query(
      `INSERT INTO chat_messages (user_id, username, message)
       VALUES ($1, $2, $3)
       RETURNING id, created_at`,
      [req.userId, username, message]
    );

    const msg = {
      id:         result.rows[0].id,
      user_id:    req.userId,
      username,
      message,
      created_at: result.rows[0].created_at,
    };

    setImmediate(() => sseService.broadcast('chat-message', msg));

    // Prune old messages (keep last 500)
    setImmediate(() =>
      pool.query(
        `DELETE FROM chat_messages
         WHERE id NOT IN (
           SELECT id FROM chat_messages ORDER BY created_at DESC LIMIT 500
         )`
      ).catch(() => {})
    );

    res.json({ message: msg });
  } catch (err) {
    console.error('chat.sendMessage:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
