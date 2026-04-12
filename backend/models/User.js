const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        minlength: [2, 'Name must be at least 2 characters'],
        maxlength: [50, 'Name cannot exceed 50 characters'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Please enter a valid email address'],
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters'],
    },
    savedRoadmaps: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Roadmap'
    }],
    role: {
        type: String,
        enum: ['user', 'subadmin', 'admin'],
        required: true,
        default: 'user'
    },

    // ─── AI Credits ───────────────────────────────────────────────────
    aiCredits: {
        type: Number,
        default: 5  // Free tier: 5 generations
    },
    monthlyCreditsUsed: {
        type: Number,
        default: 0
    },
    creditsResetDate: {
        type: Date,
        default: () => {
            const date = new Date();
            date.setMonth(date.getMonth() + 1);
            return date;
        }
    },

    // ─── Subscription ─────────────────────────────────────────────────
    subscription: {
        plan: {
            type: String,
            enum: ['free', 'pro', 'team'],
            default: 'free'
        },
        status: {
            type: String,
            enum: ['active', 'cancelled', 'expired', 'trial', 'past_due'],
            default: 'active'
        },
        razorpaySubscriptionId: { type: String },
        razorpayCustomerId:     { type: String },
        currentPeriodEnd:       { type: Date },
        cancelAtPeriodEnd:      { type: Boolean, default: false },
        trialEndsAt:            { type: Date },
    },

    customRoadmapCount: {
        type: Number,
        default: 0
    },

}, { timestamps: true });

// ─── Statics: Plan limits ──────────────────────────────────────────────────
UserSchema.statics.getPlanLimits = function(plan) {
    const limits = {
        free: {
            monthlyAiCredits: 5,
            maxCustomRoadmaps: 3,
            maxNodesPerGeneration: 22,
            aiSmartFlood: false,
            exportRoadmap: false,
        },
        pro: {
            monthlyAiCredits: 50,
            maxCustomRoadmaps: Infinity,
            maxNodesPerGeneration: 35,
            aiSmartFlood: true,
            exportRoadmap: true,
        },
        team: {
            monthlyAiCredits: Infinity,
            maxCustomRoadmaps: Infinity,
            maxNodesPerGeneration: 50,
            aiSmartFlood: true,
            exportRoadmap: true,
        },
    };
    return limits[plan] || limits.free;
};

// ─── Virtual: isPro ────────────────────────────────────────────────────────
UserSchema.virtual('isPro').get(function() {
    return this.subscription?.plan === 'pro' || this.subscription?.plan === 'team';
});

// ─── Password hashing ──────────────────────────────────────────────────────
UserSchema.pre('save', async function() {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
