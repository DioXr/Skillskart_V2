const mongoose = require('mongoose');

// Reuse the same node/edge schema structure as the admin Roadmap model
const NodeSchema = new mongoose.Schema({
    id: { type: String, required: true },
    type: { type: String, default: 'proNode' },
    position: {
        x: { type: Number, required: true },
        y: { type: Number, required: true }
    },
    data: {
        label: { type: String, required: true },
        description: { type: String },
        codeSnippet: { type: String },
        resources: [{
            label: { type: String },
            url: { type: String },
            type: { type: String, enum: ['video', 'article', 'docs', 'tool', 'code', 'file', 'course', 'book', 'website', 'other'], default: 'article' }
        }],
        isSpine: { type: Boolean, default: false }
    }
}, { _id: false });

const EdgeSchema = new mongoose.Schema({
    id: { type: String, required: true },
    source: { type: String, required: true },
    target: { type: String, required: true },
    type: { type: String, default: 'smoothstep' },
    sourceHandle: { type: String },
    targetHandle: { type: String },
    className: { type: String },
    style: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { _id: false });

const CustomRoadmapSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['Career', 'Language', 'Coding', 'Design', 'Custom'],
        default: 'Custom'
    },
    description: {
        type: String,
        default: ''
    },
    nodes: [NodeSchema],
    edges: [EdgeSchema],
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isPublic: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Index for fast lookup by owner
CustomRoadmapSchema.index({ owner: 1 });

module.exports = mongoose.model('CustomRoadmap', CustomRoadmapSchema);
