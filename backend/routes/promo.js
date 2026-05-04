/**
 * tradex-GG
 * @section backend — Promo routes
 */
const express   = require('express');
const router    = express.Router();
const rateLimit = require('express-rate-limit');
const auth      = require('../middleware/auth');
const ctrl      = require('../controllers/promoController');

const redeemLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: 'Muitas tentativas. Aguarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/redeem', redeemLimiter, auth, ctrl.redeem);

module.exports = router;
