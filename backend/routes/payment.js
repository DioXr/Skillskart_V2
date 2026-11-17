const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { createOrder, verifyPayment, getSubscriptionStatus, cancelSubscription } = require('../controllers/paymentController');

// @route   POST /api/payment/create-order
// @desc    Create a Razorpay payment order
// @access  Private
router.post('/create-order', protect, createOrder);

// @route   POST /api/payment/verify
// @desc    Verify payment and activate subscription
// @access  Private
router.post('/verify', protect, verifyPayment);

// @route   GET /api/payment/subscription
// @desc    Get current subscription status and limits
// @access  Private
router.get('/subscription', protect, getSubscriptionStatus);

// @route   POST /api/payment/cancel
// @desc    Cancel subscription at period end
// @access  Private
router.post('/cancel', protect, cancelSubscription);

// @route   POST /api/payment/my/refund
// @desc    User cancels plan and initiates self-refund
// @access  Private
router.post('/my/refund', protect, require('../controllers/paymentController').userSelfRefund);

// @route   POST /api/payment/refund/:userId
// @desc    Admin refunds a user subscription
// @access  Private/Admin
router.post('/refund/:userId', protect, require('../middleware/authMiddleware').admin, require('../controllers/paymentController').refundSubscription);

module.exports = router;
