/**
 * tradex-GG
 * @section backend — Battle routes
 */
const express    = require('express');
const router     = express.Router();
const rateLimit  = require('express-rate-limit');
const auth       = require('../middleware/auth');
const ctrl       = require('../controllers/battleController');

const battleLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  message: { error: 'Muitas requisições de batalha. Aguarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/',           ctrl.getBattles);
router.post('/',          battleLimiter, auth, ctrl.createBattle);
router.post('/:id/join',  battleLimiter, auth, ctrl.joinBattle);
router.post('/:id/cancel', auth, ctrl.cancelBattle);

module.exports = router;
