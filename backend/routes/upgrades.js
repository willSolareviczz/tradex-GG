/**
 * tradex-GG
 * @author willSolareviczz
 * @github https://github.com/willSolareviczz/tradex-GG
 * @section backend
 */
const express = require('express');
const router  = express.Router();
const rateLimit = require('express-rate-limit');
const auth    = require('../middleware/auth');
const c       = require('../controllers/upgradeController');

// 10 upgrades por minuto por IP
const upgradeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Muitos upgrades. Aguarde um momento.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/inventory', auth, c.getInventoryForUpgrade);
router.get('/targets',   auth, c.getTargetSkins);
router.post('/',         upgradeLimiter, auth, c.performUpgrade);
router.get('/history',   auth, c.getUpgradeHistory);

module.exports = router;
