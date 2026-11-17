const express = require('express');
const router = express.Router();
const Roadmap = require('../models/Roadmap');
const { protect, admin } = require('../middleware/authMiddleware');

// @route   GET /api/roadmaps
// @desc    Get all roadmaps summary (for explore page)
// @access  Public
router.get('/', async (req, res) => {
    try {
        const roadmaps = await Roadmap.find({}).select('-nodes -edges');
        res.json(roadmaps);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/roadmaps/:id
// @desc    Get single roadmap details
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const roadmap = await Roadmap.findById(req.params.id);
        if (roadmap) {
            res.json(roadmap);
        } else {
            res.status(404).json({ message: 'Roadmap not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST /api/roadmaps
// @desc    Create a new roadmap
// @access  Private/Admin
router.post('/', protect, admin, async (req, res) => {
    try {
        const { title, category, description, nodes, edges } = req.body;
        
        const roadmap = new Roadmap({
            title,
            category,
            description,
            nodes,
            edges,
            createdBy: req.user._id
        });

        const createdRoadmap = await roadmap.save();
        res.status(201).json(createdRoadmap);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   PUT /api/roadmaps/:id
// @desc    Update a roadmap
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
    try {
        const { title, category, description, nodes, edges } = req.body;
        const roadmap = await Roadmap.findById(req.params.id);

        if (roadmap) {
            roadmap.title = title || roadmap.title;
            // Provide a fallback category for old seeded roadmaps missing this validation field
            roadmap.category = category || roadmap.category || 'Custom';
            roadmap.description = description || roadmap.description;
            roadmap.nodes = nodes || roadmap.nodes;
            roadmap.edges = edges || roadmap.edges;

            // 🛠️ MIGRATION: If this was a seeded roadmap without a creator, assign current admin
            if (!roadmap.createdBy) {
                roadmap.createdBy = req.user._id;
            }

            try {
                const updatedRoadmap = await roadmap.save();
                res.json(updatedRoadmap);
            } catch (saveError) {
                console.error('Mongoose Save Error:', saveError.message);
                res.status(400).json({ 
                    message: 'Validation failed. Check if all nodes have labels and valid types.',
                    details: saveError.message 
                });
            }
        } else {
            res.status(404).json({ message: 'Roadmap not found' });
        }
    } catch (error) {
        console.error('Server Update Error:', error.message);
        res.status(500).json({ message: 'Server error during update', error: error.message });
    }
});

// @route   DELETE /api/roadmaps/:id
// @desc    Delete a roadmap
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const deletedRoadmap = await Roadmap.findByIdAndDelete(req.params.id);

        if (deletedRoadmap) {
            res.json({ message: 'Roadmap removed' });
        } else {
            res.status(404).json({ message: 'Roadmap not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
