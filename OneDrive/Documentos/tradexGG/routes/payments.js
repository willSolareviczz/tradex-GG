const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const paymentsController = require('../controllers/paymentsController');

router.post('/pix', auth, paymentsController.createPix);
router.post('/webhook', paymentsController.webhook);
router.get('/status/:paymentId', auth, paymentsController.checkStatus);
router.get('/history', auth, paymentsController.history);

module.exports = router;
