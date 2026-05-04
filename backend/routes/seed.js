/**
 * tradex-GG
 * @section backend — Provably Fair Seeds
 */
const express = require('express');
const router  = express.Router();
const crypto  = require('crypto');
const auth    = require('../middleware/auth');
const pool    = require('../config/db');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT client_seed, opening_nonce FROM users WHERE id = $1', [req.userId]
    );
    const { client_seed, opening_nonce } = result.rows[0];
    res.json({
      client_seed,
      client_seed_hash: crypto.createHash('sha256').update(client_seed).digest('hex'),
      opening_nonce,
    });
  } catch (err) {
    console.error('seed GET:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const seed = (req.body.client_seed || '').toString().trim();
    if (!seed || seed.length < 8 || seed.length > 64) {
      return res.status(400).json({ error: 'Seed deve ter entre 8 e 64 caracteres' });
    }

    await pool.query(
      'UPDATE users SET client_seed = $1 WHERE id = $2', [seed, req.userId]
    );

    res.json({
      message: 'Seed atualizada',
      client_seed: seed,
      client_seed_hash: crypto.createHash('sha256').update(seed).digest('hex'),
    });
  } catch (err) {
    console.error('seed POST:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

module.exports = router;
