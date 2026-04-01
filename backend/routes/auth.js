const express = require('express');
const { registerUser, loginUser, getUserProfile, getUsers, updateUserRole } = require('../controllers/authController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

// @route   POST /api/auth/register
router.post('/register', registerUser);

// @route   POST /api/auth/login
router.post('/login', loginUser);

// @route   GET /api/auth/profile
router.get('/profile', protect, getUserProfile);

// Staff Management Routes
router.get('/users', protect, authorizeRoles('admin'), getUsers);
router.patch('/users/:id/role', protect, authorizeRoles('admin'), updateUserRole);

module.exports = router;
