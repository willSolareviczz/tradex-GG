/**
 * tradex-GG
 * @author willSolareviczz
 * @github https://github.com/willSolareviczz/tradex-GG
 * @section backend
 */
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/rouletteGameController');

router.get('/current', ctrl.getCurrent);
router.get('/history', ctrl.getHistory);
router.post('/bet', auth, ctrl.placeBet);

module.exports = router;
