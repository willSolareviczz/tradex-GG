/**
 * tradex-GG
 * @author willSolareviczz
 * @github https://github.com/willSolareviczz/tradex-GG
 * @section backend
 */
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const auth = require('../middleware/auth');
const casesController = require('../controllers/casesController');

// 30 aberturas por minuto por usuário autenticado (fallback: IP)
const openLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: (req) => req.userId ? `user:${req.userId}` : req.ip,
  message: { error: 'Muitas aberturas. Aguarde um momento.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/', casesController.listCases);
router.get('/verify/:id', casesController.verifyOpening);
router.get('/search', casesController.searchSkins);
router.get('/recent-drops', casesController.recentDrops);
router.post('/', auth, casesController.createCase);
router.get('/:id', casesController.getCaseDetail);
router.post('/:id/open', auth, openLimiter, casesController.openCase);
router.post('/:id/open-batch', auth, openLimiter, casesController.openBatch);

module.exports = router;
