/**
 * tradex-GG
 * @author willSolareviczz
 * @github https://github.com/willSolareviczz/tradex-GG
 * @section backend
 */
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const casesController = require('../controllers/casesController');

router.get('/', casesController.listCases);
router.get('/search', casesController.searchSkins);
router.get('/recent-drops', casesController.recentDrops);
router.post('/', auth, casesController.createCase);
router.get('/:id', casesController.getCaseDetail);
router.post('/:id/open', auth, casesController.openCase);
router.post('/:id/open-batch', auth, casesController.openBatch);

module.exports = router;
