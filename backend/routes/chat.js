/**
 * tradex-GG
 * @section backend — Chat routes
 */
const express   = require('express');
const router    = express.Router();
const rateLimit = require('express-rate-limit');
const auth      = require('../middleware/auth');
const ctrl      = require('../controllers/chatController');

const chatLimiter = rateLimit({
  windowMs: 10 * 1000,
  max: 3,
  message: { error: 'Devagar! Aguarde antes de enviar outra mensagem.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/',  ctrl.getMessages);
router.post('/', chatLimiter, auth, ctrl.sendMessage);

module.exports = router;
