const express = require('express');
const router = express.Router();
const CustomRoadmap = require('../models/CustomRoadmap');
const { protect } = require('../middleware/authMiddleware');
const { sanitizeBody, validateRoadmap } = require('../middleware/validators');

// @route   GET /api/custom-roadmaps
// @desc    Get all custom roadmaps owned by the logged-in user
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const roadmaps = await CustomRoadmap.find({ owner: req.user._id }).sort({ updatedAt: -1 });
        res.json(roadmaps);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/custom-roadmaps/:id
// @desc    Get a specific custom roadmap (owner-only, or public)
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const roadmap = await CustomRoadmap.findById(req.params.id);
        if (!roadmap) {
            return res.status(404).json({ message: 'Roadmap not found' });
        }

        // Allow access if owner or if public
        if (roadmap.owner.toString() !== req.user._id.toString() && !roadmap.isPublic) {
            return res.status(403).json({ message: 'Not authorized to view this roadmap' });
        }

        res.json(roadmap);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST /api/custom-roadmaps
// @desc    Create a new custom roadmap
// @access  Private
router.post('/', protect, sanitizeBody, validateRoadmap, async (req, res) => {
    try {
        const { title, category, description, nodes, edges, isPublic } = req.body;
        
        if (!title) {
            return res.status(400).json({ message: 'Title is required' });
        }

        const roadmap = await CustomRoadmap.create({
            title,
            category: category || 'Custom',
            description: description || '',
            nodes: nodes || [],
            edges: edges || [],
            owner: req.user._id,
            isPublic: isPublic || false
        });

        res.status(201).json(roadmap);
    } catch (error) {
        console.error('Create Custom Roadmap Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   PUT /api/custom-roadmaps/:id
// @desc    Update a custom roadmap (owner-only)
// @access  Private
router.put('/:id', protect, sanitizeBody, async (req, res) => {
    try {
        const roadmap = await CustomRoadmap.findById(req.params.id);
        if (!roadmap) {
            return res.status(404).json({ message: 'Roadmap not found' });
        }

        if (roadmap.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to edit this roadmap' });
        }

        const { title, category, description, nodes, edges, isPublic } = req.body;
        
        roadmap.title = title || roadmap.title;
        roadmap.category = category || roadmap.category;
        roadmap.description = description !== undefined ? description : roadmap.description;
        roadmap.nodes = nodes !== undefined ? nodes : roadmap.nodes;
        roadmap.edges = edges !== undefined ? edges : roadmap.edges;
        roadmap.isPublic = isPublic !== undefined ? isPublic : roadmap.isPublic;

        const updated = await roadmap.save();
        res.json(updated);
    } catch (error) {
        console.error('Update Custom Roadmap Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   DELETE /api/custom-roadmaps/:id
// @desc    Delete a custom roadmap (owner-only)
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const roadmap = await CustomRoadmap.findById(req.params.id);
        if (!roadmap) {
            return res.status(404).json({ message: 'Roadmap not found' });
        }

        if (roadmap.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this roadmap' });
        }

        await CustomRoadmap.findByIdAndDelete(req.params.id);
        res.json({ message: 'Roadmap deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
