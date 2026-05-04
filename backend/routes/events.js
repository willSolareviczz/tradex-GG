/**
 * tradex-GG
 * @author willSolareviczz
 * @section backend — SSE route
 */
const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');
const { addClient } = require('../services/sseService');

router.get('/live-drops', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // Send initial snapshot so the ticker populates instantly
  try {
    const result = await pool.query(
      `SELECT u.username,
              s.weapon, s.skin_name, s.image_url, s.rarity_color,
              COALESCE(s.site_price, s.market_price) AS price
       FROM openings o
       JOIN users u ON o.user_id = u.id
       JOIN skins  s ON o.skin_id = s.id
       WHERE o.created_at > NOW() - INTERVAL '2 hours'
       ORDER BY o.created_at DESC
       LIMIT 30`
    );
    res.write(`event: snapshot\ndata: ${JSON.stringify(result.rows)}\n\n`);
  } catch {
    // continue — snapshot failure is non-critical
  }

  addClient(res);

  const heartbeat = setInterval(() => {
    try { res.write(': heartbeat\n\n'); } catch { clearInterval(heartbeat); }
  }, 25000);

  req.on('close', () => clearInterval(heartbeat));
});

module.exports = router;
