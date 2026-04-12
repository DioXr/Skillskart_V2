const User = require('../models/User');
const Subscription = require('../models/Subscription');
const crypto = require('crypto');

const PLAN_PRICES = {
    pro:  { monthly: 39900, annual: 319900 },  // ₹399/mo, ₹3199/yr
    team: { monthly: 99900, annual: 799900 },  // ₹999/mo, ₹7999/yr
};

const PLAN_CREDITS = {
    free: 5,
    pro:  50,
    team: 999999, // Effectively unlimited
};

// Lazy-load Razorpay to avoid crash if key isn't set
let razorpayInstance = null;
const getRazorpay = () => {
    if (!razorpayInstance) {
        const Razorpay = require('razorpay');
        razorpayInstance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
    }
    return razorpayInstance;
};

// ─── Create Order ──────────────────────────────────────────────────────────
const createOrder = async (req, res) => {
    try {
        const { plan, billingCycle = 'monthly' } = req.body;

        if (!plan || !PLAN_PRICES[plan]) {
            return res.status(400).json({ message: 'Invalid plan. Choose "pro" or "team".' });
        }

        const amount = PLAN_PRICES[plan][billingCycle];
        if (!amount) {
            return res.status(400).json({ message: 'Invalid billing cycle.' });
        }

        // ── BEECEPTOR MOCK MODE ──
        if (process.env.USE_MOCK_PAYMENT === 'true') {
            const orderId = `order_mock_${Date.now()}`;
            if (process.env.BEECEPTOR_URL) {
                // Ping Beeceptor so the user sees the request logs
                try {
                    const axios = require('axios');
                    await axios.post(process.env.BEECEPTOR_URL, { action: 'create_order', amount, plan });
                } catch(e) {} // ignore local network errors
            }
            return res.json({
                orderId, amount, currency: 'INR', plan, billingCycle, keyId: 'mock_key', isMock: true
            });
        }

        const razorpay = getRazorpay();
        const order = await razorpay.orders.create({
            amount,
            currency: 'INR',
            receipt: `skillskart_${req.user._id}_${Date.now()}`,
            notes: {
                userId: String(req.user._id),
                plan,
                billingCycle,
                userEmail: req.user.email,
            }
        });

        res.json({
            orderId:   order.id,
            amount:    order.amount,
            currency:  order.currency,
            plan,
            billingCycle,
            keyId: process.env.RAZORPAY_KEY_ID,
            isMock: false
        });
    } catch (error) {
        console.error('[Payment] Create Order Error:', error);
        res.status(500).json({ message: 'Failed to create payment order.' });
    }
};

// ─── Verify Payment ────────────────────────────────────────────────────────
const verifyPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            plan,
            billingCycle = 'monthly',
        } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ message: 'Missing payment verification data.' });
        }

        // Verify HMAC signature IF NOT MOCK
        if (process.env.USE_MOCK_PAYMENT !== 'true') {
            const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
            hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
            const expectedSignature = hmac.digest('hex');

            if (expectedSignature !== razorpay_signature) {
                return res.status(400).json({ message: 'Payment verification failed. Invalid signature.' });
            }
        } else {
            // Ping Beeceptor for verification log
            if (process.env.BEECEPTOR_URL) {
                try {
                    const axios = require('axios');
                    await axios.post(process.env.BEECEPTOR_URL, { action: 'verify_payment', plan });
                } catch(e) {}
            }
        }

        // Activate subscription
        const periodEnd = new Date();
        if (billingCycle === 'annual') {
            periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        } else {
            periodEnd.setMonth(periodEnd.getMonth() + 1);
        }

        const creditsToAdd = PLAN_CREDITS[plan] || PLAN_CREDITS.free;

        // Update user
        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                'subscription.plan': plan,
                'subscription.status': 'active',
                'subscription.currentPeriodEnd': periodEnd,
                'subscription.cancelAtPeriodEnd': false,
                aiCredits: creditsToAdd,
                monthlyCreditsUsed: 0,
                creditsResetDate: periodEnd,
            },
            { new: true }
        );

        // Record subscription history
        await Subscription.create({
            user: req.user._id,
            plan,
            status: 'active',
            amount: PLAN_PRICES[plan][billingCycle],
            currency: 'INR',
            billingCycle,
            razorpayOrderId:   razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
            periodStart: new Date(),
            periodEnd,
        });

        console.log(`[Payment] Subscription activated for ${user.email} — Plan: ${plan}`);

        res.json({
            message: `Successfully upgraded to ${plan.charAt(0).toUpperCase() + plan.slice(1)}!`,
            subscription: user.subscription,
            aiCredits: user.aiCredits,
        });
    } catch (error) {
        console.error('[Payment] Verify Payment Error:', error);
        res.status(500).json({ message: 'Payment verification failed.' });
    }
};

// ─── Get Subscription Status ───────────────────────────────────────────────
const getSubscriptionStatus = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('subscription aiCredits monthlyCreditsUsed creditsResetDate customRoadmapCount');
        const plan = user.subscription?.plan || 'free';
        const limits = User.getPlanLimits(plan);

        res.json({
            plan,
            status: user.subscription?.status || 'active',
            currentPeriodEnd: user.subscription?.currentPeriodEnd,
            cancelAtPeriodEnd: user.subscription?.cancelAtPeriodEnd || false,
            aiCredits: user.aiCredits,
            monthlyCreditsUsed: user.monthlyCreditsUsed || 0,
            creditsResetDate: user.creditsResetDate,
            customRoadmapCount: user.customRoadmapCount || 0,
            limits,
        });
    } catch (error) {
        console.error('[Payment] Get Status Error:', error);
        res.status(500).json({ message: 'Failed to fetch subscription status.' });
    }
};

// ─── Cancel Subscription ───────────────────────────────────────────────────
const cancelSubscription = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user.subscription || user.subscription.plan === 'free') {
            return res.status(400).json({ message: 'No active subscription to cancel.' });
        }

        // Set to cancel at end of period (don't cut access immediately)
        user.subscription.cancelAtPeriodEnd = true;
        await user.save();

        await Subscription.findOneAndUpdate(
            { user: req.user._id, status: 'active' },
            { cancelledAt: new Date(), status: 'cancelled' }
        );

        res.json({
            message: `Your ${user.subscription.plan} plan will remain active until ${user.subscription.currentPeriodEnd?.toLocaleDateString()}.`,
            cancelAtPeriodEnd: true,
            currentPeriodEnd: user.subscription.currentPeriodEnd,
        });
    } catch (error) {
        console.error('[Payment] Cancel Error:', error);
        res.status(500).json({ message: 'Failed to cancel subscription.' });
    }
};

// @desc    Admin refunds a subscription and demotes user
// @route   POST /api/payment/refund/:userId
// @access  Private/Admin
const refundSubscription = async (req, res) => {
    try {
        const userId = req.params.userId;
        const targetUser = await User.findById(userId);

        if (!targetUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (targetUser.subscription.plan === 'free') {
            return res.status(400).json({ message: 'User is already on the free plan' });
        }

        // Mock refund via Beeceptor
        if (process.env.USE_MOCK_PAYMENT === 'true' && process.env.BEECEPTOR_URL) {
            try {
                const axios = require('axios');
                await axios.post(process.env.BEECEPTOR_URL, { action: 'issue_refund', targetUserId: userId, plan: targetUser.subscription.plan });
                console.log(`[REFUND] Mock refund executed for User ${userId}`);
            } catch(e) {
                console.warn('[REFUND] Failed to ping Beeceptor');
            }
        } 

        targetUser.subscription.plan = 'free';
        targetUser.subscription.status = 'cancelled';
        targetUser.aiCredits = 5;
        
        await targetUser.save();

        res.json({ message: 'Refund successfully processed.', user: targetUser });
    } catch (error) {
        console.error('Refund Error:', error);
        res.status(500).json({ message: 'Failed to process refund', error: error.message });
    }
};

// @desc    User requests self-refund
// @route   POST /api/payment/my/refund
// @access  Private
const userSelfRefund = async (req, res) => {
    try {
        const targetUser = await User.findById(req.user._id);

        if (!targetUser || targetUser.subscription.plan === 'free') {
            return res.status(400).json({ message: 'You do not have an active premium subscription to refund.' });
        }

        // Mock refund via Beeceptor
        if (process.env.USE_MOCK_PAYMENT === 'true' && process.env.BEECEPTOR_URL) {
            try {
                const axios = require('axios');
                await axios.post(process.env.BEECEPTOR_URL, { action: 'user_self_refund', userId: targetUser._id, plan: targetUser.subscription.plan });
            } catch(e) {}
        } 

        targetUser.subscription.plan = 'free';
        targetUser.subscription.status = 'cancelled';
        targetUser.aiCredits = 5;
        
        await targetUser.save();

        res.json({ message: 'Self-Refund successfully processed.', user: targetUser });
    } catch (error) {
        console.error('Self-Refund Error:', error);
        res.status(500).json({ message: 'Failed to process refund', error: error.message });
    }
};

module.exports = {
    createOrder,
    verifyPayment,
    getSubscriptionStatus,
    cancelSubscription,
    refundSubscription,
    userSelfRefund
};
