/**
 * tradex-GG
 * @author willSolareviczz
 * @github https://github.com/willSolareviczz/tradex-GG
 * @section backend
 */
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const usersController = require('../controllers/usersController');

router.get('/me', auth, usersController.getMe);
router.get('/profile/:id', usersController.getProfile);

module.exports = router;
