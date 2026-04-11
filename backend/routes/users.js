/**
 * User Routes — /api/users
 */

const express   = require('express');
const router    = express.Router();
const userCtrl  = require('../controllers/userController');
const { authMiddleware } = require('../middleware/auth');

// Public routes
router.post('/register', userCtrl.register); // POST /api/users/register
router.post('/login',    userCtrl.login);    // POST /api/users/login

// Protected routes
router.get('/profile',   authMiddleware, userCtrl.getProfile);   // GET  /api/users/profile
router.put('/profile',   authMiddleware, userCtrl.updateProfile); // PUT  /api/users/profile

module.exports = router;
