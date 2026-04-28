/**
 * tradex-GG
 * @author willSolareviczz
 * @section backend/routes
 */
const express = require('express');
const router  = express.Router();
const Jimp    = require('jimp');

// Simple in-memory cache: url → PNG Buffer
const cache = new Map();
const CACHE_MAX = 600;

function evictIfNeeded() {
  if (cache.size >= CACHE_MAX) {
    cache.delete(cache.keys().next().value);
  }
}

// GET /api/image/weapon-crop?url=<encoded_steam_url>
router.get('/weapon-crop', async (req, res) => {
  const { url } = req.query;

  if (!url) return res.status(400).end();

  // Only allow Steam CDN domains
  let decoded;
  try { decoded = decodeURIComponent(url); } catch { return res.status(400).end(); }
  const ALLOWED = ['steamstatic.com', 'steamcommunity.com', 'cdn.csgoskins.gg'];
  if (!ALLOWED.some(d => decoded.includes(d))) {
    return res.status(400).end();
  }

  res.set('Cache-Control', 'public, max-age=604800'); // 7 days
  res.set('Content-Type', 'image/png');

  if (cache.has(decoded)) return res.send(cache.get(decoded));

  try {
    const img = await Jimp.read(decoded);
    img.autocrop({ tolerance: 0.005, cropSymmetric: false });
    const buf = await img.getBufferAsync(Jimp.MIME_PNG);
    evictIfNeeded();
    cache.set(decoded, buf);
    res.send(buf);
  } catch (err) {
    // On failure redirect to original so the image still shows
    res.redirect(decoded);
  }
});

module.exports = router;
