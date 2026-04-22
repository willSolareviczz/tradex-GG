/**
 * tradex-GG
 * @author willSolareviczz
 * @github https://github.com/willSolareviczz/tradex-GG
 * @section backend
 */
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const steamController = require('../controllers/steamController');

// Bot status (public)
router.get('/bot/status', steamController.getBotStatus);

// Bot inventory - items available for purchase
router.get('/bot/inventory', steamController.getBotInventory);

// Get skin price
router.get('/price', steamController.getSkinPrice);

// User's Steam inventory
router.get('/inventory/:steamId', auth, steamController.getUserInventory);

// Deposit skins (user -> bot)
router.post('/deposit', auth, steamController.depositSkins);

// Withdraw skin (bot -> user)
router.post('/withdraw', auth, steamController.withdrawSkin);

// Save trade URL
router.post('/trade-url', auth, steamController.saveTradeUrl);

// Check trade offer status
router.get('/trade/:offerId', auth, steamController.getTradeStatus);

module.exports = router;
