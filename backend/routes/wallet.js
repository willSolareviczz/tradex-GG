/**
 * tradex-GG
 * @author willSolareviczz
 * @github https://github.com/willSolareviczz/tradex-GG
 * @section backend
 */
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const walletController = require('../controllers/walletController');

router.post('/deposit',  auth, walletController.addBalance);
router.post('/withdraw', auth, walletController.withdraw);
router.get('/transactions', auth, walletController.getTransactions);

module.exports = router;
