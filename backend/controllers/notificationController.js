/**
 * tradex-GG
 * @section backend — Notifications
 */
const pool = require('../config/db');

const LIMIT = 30;

exports.list = async (req, res) => {
  try {
    const [notifs, countRes] = await Promise.all([
      pool.query(
        `SELECT id, type, title, body, url, is_read, created_at
         FROM notifications
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2`,
        [req.userId, LIMIT]
      ),
      pool.query(
        'SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1 AND is_read = FALSE',
        [req.userId]
      ),
    ]);
    res.json({ notifications: notifs.rows, unread: countRes.rows[0].count });
  } catch (err) {
    console.error('notifications.list:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE',
      [req.userId]
    );
    res.json({ message: 'ok' });
  } catch (err) {
    console.error('notifications.markAllRead:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.markRead = async (req, res) => {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    res.json({ message: 'ok' });
  } catch (err) {
    console.error('notifications.markRead:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
