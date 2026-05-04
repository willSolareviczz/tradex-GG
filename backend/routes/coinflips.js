/**
 * tradex-GG
 * @section backend — Coinflip routes
 */
const express   = require('express');
const router    = express.Router();
const rateLimit = require('express-rate-limit');
const auth      = require('../middleware/auth');
const ctrl      = require('../controllers/coinflipController');

const flipLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  message: { error: 'Muitas requisições. Aguarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/',            ctrl.getCoinflips);
router.post('/',           flipLimiter, auth, ctrl.createCoinflip);
router.post('/:id/join',   flipLimiter, auth, ctrl.joinCoinflip);
router.post('/:id/cancel', auth, ctrl.cancelCoinflip);

module.exports = router;
