/**
 * tradex-GG
 * @author willSolareviczz
 * @github https://github.com/willSolareviczz/tradex-GG
 * @section backend
 */
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const dailyController = require('../controllers/dailyController');

router.get('/status', auth, dailyController.getStatus);
router.post('/claim', auth, dailyController.claim);

module.exports = router;
