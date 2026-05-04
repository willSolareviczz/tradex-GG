/**
 * tradex-GG
 * @author willSolareviczz
 * @github https://github.com/willSolareviczz/tradex-GG
 * @section backend
 */
const express = require('express');
const router = express.Router();
const rankingController = require('../controllers/rankingController');
const optionalAuth = require('../middleware/optionalAuth');

router.get('/', rankingController.getRanking);
router.get('/xp', optionalAuth, rankingController.getXpRanking);

module.exports = router;
