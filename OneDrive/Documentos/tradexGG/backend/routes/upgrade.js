/**
 * tradex-GG
 * @author willSolareviczz
 * @github https://github.com/willSolareviczz/tradex-GG
 * @section backend
 */
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upgradeController = require('../controllers/upgradeController');

router.get('/inventory', auth, upgradeController.getInventory);
router.get('/targets', auth, upgradeController.getTargets);
router.post('/attempt', auth, upgradeController.attempt);

module.exports = router;
