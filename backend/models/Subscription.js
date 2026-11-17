const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    plan: {
        type: String,
        enum: ['free', 'pro', 'team'],
        required: true,
    },
    status: {
        type: String,
        enum: ['active', 'cancelled', 'expired', 'refunded', 'past_due'],
        default: 'active',
    },
    amount: {
        type: Number,  // In paise (INR) or cents (USD)
        required: true,
    },
    currency: {
        type: String,
        default: 'INR',
    },
    billingCycle: {
        type: String,
        enum: ['monthly', 'annual'],
        default: 'monthly',
    },
    // Razorpay data
    razorpayOrderId:        { type: String },
    razorpayPaymentId:      { type: String },
    razorpaySubscriptionId: { type: String },
    razorpaySignature:      { type: String },
    // Billing period
    periodStart: { type: Date },
    periodEnd:   { type: Date },
    // Cancellation
    cancelledAt:   { type: Date },
    cancelReason:  { type: String },
    // Refund
    refundedAt:    { type: Date },
    refundAmount:  { type: Number },
}, { timestamps: true });

module.exports = mongoose.model('Subscription', SubscriptionSchema);
