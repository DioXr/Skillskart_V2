const mongoose = require('mongoose');

const NodeSchema = new mongoose.Schema({
    id: { type: String, required: true },
    type: { type: String, default: 'default' },
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
        status: { type: String, enum: ['locked', 'in-progress', 'completed'], default: 'locked' }
    }
}, { _id: false });

const EdgeSchema = new mongoose.Schema({
    id: { type: String, required: true },
    source: { type: String, required: true },
    target: { type: String, required: true },
    animated: { type: Boolean, default: false }
}, { _id: false });

const RoadmapSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['Career', 'Language', 'Coding', 'Design', 'Custom'],
        required: true
    },
    description: {
        type: String
    },
    nodes: [NodeSchema],
    edges: [EdgeSchema],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

module.exports = mongoose.model('Roadmap', RoadmapSchema);
