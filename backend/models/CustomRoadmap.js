const mongoose = require('mongoose');

const NodeSchema = new mongoose.Schema({
    id: { type: String, required: true },
    type: {
        type: String,
        default: 'topicNode',
        enum: ['default', 'proNode', 'topicNode', 'subtopicNode', 'checkpointNode']
    },
    position: {
        x: { type: Number, required: true },
        y: { type: Number, required: true }
    },
    data: {
        label:       { type: String, required: true },
        description: { type: String },
        nodeType:    { type: String, enum: ['topic', 'subtopic', 'checkpoint', 'milestone'], default: 'topic' },
        difficulty:  { type: String, enum: ['beginner', 'intermediate', 'advanced'] },
        estimatedHours: { type: Number },
        phase:       { type: String, enum: ['foundation', 'core', 'advanced', 'mastery'] },
        isSpine:     { type: Boolean, default: false },
        codeSnippet: { type: String },
        projectSuggestion: { type: String },
        resources: [{
            label: { type: String },
            url:   { type: String },
            type:  {
                type: String,
                enum: ['video', 'article', 'docs', 'tool', 'code', 'file', 'course', 'book', 'website', 'other'],
                default: 'article'
            }
        }]
    }
}, { _id: false });

const EdgeSchema = new mongoose.Schema({
    id:           { type: String, required: true },
    source:       { type: String, required: true },
    target:       { type: String, required: true },
    type:         { type: String, default: 'smoothstep' },
    sourceHandle: { type: String },
    targetHandle: { type: String },
    className:    { type: String },
    style:        { type: mongoose.Schema.Types.Mixed, default: {} }
}, { _id: false });

const CustomRoadmapSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        minlength: [3, 'Title must be at least 3 characters'],
        maxlength: [100, 'Title cannot exceed 100 characters'],
        trim: true,
    },
    category: {
        type: String,
        enum: ['Career', 'Language', 'Coding', 'Design', 'Custom'],
        default: 'Custom'
    },
    description: {
        type: String,
        default: '',
        maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    nodes:    [NodeSchema],
    edges:    [EdgeSchema],
    owner:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isPublic: { type: Boolean, default: false },
    isAiGenerated: { type: Boolean, default: false },
}, { timestamps: true });

CustomRoadmapSchema.index({ owner: 1 });

module.exports = mongoose.model('CustomRoadmap', CustomRoadmapSchema);
