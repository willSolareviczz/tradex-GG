const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const inventoryController = require('../controllers/inventoryController');

router.get('/', auth, inventoryController.getInventory);
router.post('/:id/sell', auth, inventoryController.sellSkin);

module.exports = router;
