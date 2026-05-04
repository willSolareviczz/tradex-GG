/**
 * tradex-GG
 * @section backend — Referral routes
 */
const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const ctrl    = require('../controllers/referralController');

router.get('/code',  auth, ctrl.getCode);
router.get('/stats', auth, ctrl.getStats);

module.exports = router;
