/**
 * tradex-GG
 * @author willSolareviczz
 * @github https://github.com/willSolareviczz/tradex-GG
 * @section backend
 */
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const c = require('../controllers/adminController');

// Todas as rotas exigem autenticacao + role admin
router.use(auth, admin);

// Dashboard
router.get('/stats', c.getStats);

// Price management
router.post('/update-prices', c.triggerPriceUpdate);
router.get('/price-status', c.getPriceStatus);
router.get('/pricempire-status', c.getPricempireStatus);
router.post('/recalculate-cases', c.recalculateCasePrices);

// Cases CRUD
router.get('/cases', c.listAllCases);
router.post('/cases', c.createCase);
router.put('/cases/:id', c.updateCase);
router.delete('/cases/:id', c.deleteCase);

// Skins CRUD
router.get('/skins', c.listAllSkins);
router.post('/skins', c.createSkin);
router.put('/skins/:id', c.updateSkin);
router.delete('/skins/:id', c.deleteSkin);

// Case-Skins (vinculos com peso/chance)
router.get('/cases/:caseId/skins', c.getCaseSkins);
router.post('/cases/:caseId/skins', c.addSkinToCase);
router.put('/case-skins/:linkId', c.updateCaseSkinWeight);
router.delete('/case-skins/:linkId', c.removeSkinFromCase);

module.exports = router;
