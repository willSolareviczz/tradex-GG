/**
 * tradex-GG
 * @section backend — Notification routes
 */
const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const ctrl    = require('../controllers/notificationController');

router.get('/',            auth, ctrl.list);
router.post('/read-all',   auth, ctrl.markAllRead);
router.post('/:id/read',   auth, ctrl.markRead);

module.exports = router;
