/**
 * tradex-GG
 * @author willSolareviczz
 * @github https://github.com/willSolareviczz/tradex-GG
 * @section backend
 */
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const optAuth = require('../middleware/optionalAuth');
const ctrl = require('../controllers/crashController');

router.get('/current', optAuth, ctrl.getCurrent);
router.get('/history', ctrl.getHistory);
router.post('/bet', auth, ctrl.placeBet);
router.post('/cashout', auth, ctrl.cashout);

module.exports = router;
