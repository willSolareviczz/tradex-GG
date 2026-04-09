const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const casesController = require('../controllers/casesController');

router.get('/', casesController.listCases);
router.get('/:id', casesController.getCaseDetail);
router.post('/:id/open', auth, casesController.openCase);

module.exports = router;
