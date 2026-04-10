const express = require('express');
const router = express.Router();
const UserProgress = require('../models/UserProgress');
const User = require('../models/User');
const Roadmap = require('../models/Roadmap');
const CustomRoadmap = require('../models/CustomRoadmap');
const { protect } = require('../middleware/authMiddleware');

// 🛡️ STATIC ROUTES FIRST (To avoid parameter conflicts)

// @route   GET /api/progress/my/status
// @desc    Get an overview of all roadmaps the user has started
// @access  Private
router.get('/my/status', protect, async (req, res) => {
    try {
        // Find all progress entries for this user and populate the dynamic reference
        const progresses = await UserProgress.find({ user: req.user._id }).populate('roadmap');
        
        const overview = progresses.map(p => {
            if (!p.roadmap) return null;
            
            const totalNodes = p.roadmap.nodes ? p.roadmap.nodes.length : 0;
            const completedCount = p.completedNodes ? p.completedNodes.length : 0;
            const percentage = totalNodes > 0 ? Math.round((completedCount / totalNodes) * 100) : 0;

            return {
                _id: p.roadmap._id,
                title: p.roadmap.title,
                category: p.roadmap.category,
                description: p.roadmap.description,
                completedNodes: p.completedNodes,
                totalNodes,
                percentage,
                lastUpdated: p.updatedAt,
                isCustom: p.roadmapModel === 'CustomRoadmap'
            };
        }).filter(item => item !== null);

        res.set('Cache-Control', 'no-store'); 
        res.json(overview);
    } catch (error) {
        console.error('Dashboard Status Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST /api/progress/save
// @desc    Save/Update user progress
// @access  Private
router.post('/save', protect, async (req, res) => {
    try {
        const { roadmapId, completedNodes } = req.body;
        
        // 🛡️ Detect which model to use
        let roadmapModel = 'Roadmap';
        const isOfficial = await Roadmap.exists({ _id: roadmapId });
        if (!isOfficial) {
            const isCustom = await CustomRoadmap.exists({ _id: roadmapId });
            if (isCustom) {
                roadmapModel = 'CustomRoadmap';
            } else {
                return res.status(404).json({ message: 'Roadmap not found in any collection' });
            }
        }

        console.log(`Saving Progress for User ${req.user._id} on ${roadmapModel} ${roadmapId}`);

        let progress = await UserProgress.findOne({
            user: req.user._id,
            roadmap: roadmapId
        });

        if (progress) {
            progress.completedNodes = completedNodes;
            progress.roadmapModel = roadmapModel; // Keep sync
            await progress.save();
        } else {
            progress = await UserProgress.create({
                user: req.user._id,
                roadmap: roadmapId,
                roadmapModel,
                completedNodes
            });

            // For official roadmaps, we typically add to savedRoadmaps
            if (roadmapModel === 'Roadmap') {
                await User.findByIdAndUpdate(req.user._id, {
                    $addToSet: { savedRoadmaps: roadmapId }
                });
            }
        }

        res.json(progress.completedNodes);
    } catch (error) {
        console.error('Save Progress Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// 🛡️ PARAMETERIZED ROUTES LAST

// @route   GET /api/progress/:roadmapId
// @desc    Get user's progress for a specific roadmap
// @access  Private
router.get('/:roadmapId', protect, async (req, res) => {
    try {
        const progress = await UserProgress.findOne({
            user: req.user._id,
            roadmap: req.params.roadmapId
        });
        
        if (progress) {
            res.json(progress.completedNodes);
        } else {
            res.json([]);
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
