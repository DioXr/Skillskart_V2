const mongoose = require('mongoose');

const UserProgressSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    roadmap: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Roadmap',
        required: true
    },
    completedNodes: [{
        type: String // nodeId (e.g., '1', 'html-basics')
    }]
}, { timestamps: true });

// Ensure a user only has one progress document per roadmap
UserProgressSchema.index({ user: 1, roadmap: 1 }, { unique: true });

module.exports = mongoose.model('UserProgress', UserProgressSchema);
