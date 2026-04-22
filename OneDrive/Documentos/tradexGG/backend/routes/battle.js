/**
 * tradex-GG
 * @author willSolareviczz
 * @github https://github.com/willSolareviczz/tradex-GG
 * @section backend
 */
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/battleController');

router.get('/list', ctrl.list);
router.get('/history', ctrl.history);
router.get('/:id', ctrl.getOne);
router.post('/create', auth, ctrl.create);
router.post('/:id/join', auth, ctrl.join);

module.exports = router;
