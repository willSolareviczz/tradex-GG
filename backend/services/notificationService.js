/**
 * tradex-GG
 * @section backend — Notification Service
 */
const pool       = require('../config/db');
const sseService = require('./sseService');

/**
 * Create a notification for a user and push it via SSE.
 * Silently swallows errors — notifications are non-critical.
 * @param {object|import('pg').PoolClient} dbOrClient  pool or transaction client
 */
async function createNotification(userId, type, title, body, url, dbOrClient) {
  try {
    const db = dbOrClient || pool;
    const result = await db.query(
      `INSERT INTO notifications (user_id, type, title, body, url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, created_at`,
      [userId, type, title, body || null, url || null]
    );
    const notif = {
      id:         result.rows[0].id,
      user_id:    userId,
      type,
      title,
      body:       body || null,
      url:        url  || null,
      is_read:    false,
      created_at: result.rows[0].created_at,
    };
    setImmediate(() => sseService.broadcast('notification', { user_id: userId, notification: notif }));
  } catch (err) {
    console.error('notificationService.create:', err.message);
  }
}

module.exports = { createNotification };
