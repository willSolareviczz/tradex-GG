/**
 * tradex-GG
 * @author willSolareviczz
 * @github https://github.com/willSolareviczz/tradex-GG
 * @section backend
 */
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const historyController = require('../controllers/historyController');

router.get('/', auth, historyController.getHistory);

module.exports = router;
