const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const Groq = require('groq-sdk');
const User = require('../models/User');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Preferred model for high-quality roadmap generation
const AI_MODEL = 'llama-3.3-70b-versatile';

/**
 * @route   GET /api/ai/ping
 * @desc    Test connectivity to the AI router
 * @access  Public
 */
router.get('/ping', (req, res) => {
    res.json({ message: 'AI Router is Active and Reachable! 🚀' });
});

/**
 * @route   POST /api/ai/generate
 * @desc    Generate a full AI Roadmap with proper tree hierarchy
 * @access  Private (Admins or Subadmins only for now to prevent spam)
 */
router.post('/generate', protect, async (req, res) => {
    try {
        const { topic } = req.body;
        
        if (!topic) {
            return res.status(400).json({ message: 'Please provide a topic for the roadmap' });
        }

        // 🛡️ Credit Check
        const user = await User.findById(req.user._id);
        
        // Safety: ensure field exists
        if (user.aiCredits === undefined) user.aiCredits = 10;

        if (user.aiCredits <= 0 && user.role !== 'admin') {
            return res.status(403).json({ 
                message: 'You have exhausted your AI Credits. Please contact support to upgrade.',
                outOfCredits: true
            });
        }

        console.log(`Generating AI Roadmap for: ${topic} (Remaining Credits: ${user.aiCredits})`);

        const prompt = `You are an expert curriculum designer. Build a professional, hierarchical learning roadmap for "${topic}".

CRITICAL STRUCTURE RULES:
1. Create exactly 10-14 nodes total.
2. The roadmap MUST have a clear TREE HIERARCHY — NOT a flat linear chain.
3. There should be 5-7 SPINE nodes forming the main vertical learning path (mark these with "isSpine": true).
4. Each spine node should have 1-2 BRANCH nodes that represent sub-topics or tools related to that stage (mark with "isSpine": false).
5. Spine nodes connect vertically: node_1 → node_2 → node_3 etc.
6. Branch nodes connect from their parent spine node sideways.

NODE CONTENT RULES:
- Each node must have a meaningful "label" (2-4 words, e.g. "State Management", "REST API Design").
- Each node must have a "description" of 2-3 sentences explaining what to learn and why.
- Each node must have a "codeSnippet" showing a small, real code example relevant to that skill (3-5 lines).
- Each node must have 2-3 "resources" with REAL URLs to official documentation, MDN, freeCodeCamp, W3Schools, YouTube tutorials, or GitHub repos. Do NOT use placeholder URLs.

Return ONLY a valid JSON object matching this exact schema:
{
  "title": "AI Roadmap: ${topic}",
  "description": "A comprehensive learning path for mastering ${topic}, from fundamentals through advanced concepts.",
  "category": "Custom",
  "nodes": [
    {
      "id": "node_1",
      "type": "proNode",
      "position": { "x": 0, "y": 0 },
      "data": {
        "label": "Fundamentals",
        "description": "Core building blocks you need before anything else.",
        "isSpine": true,
        "codeSnippet": "// example code here",
        "resources": [
          { "label": "Official Documentation", "url": "https://real-url.com", "type": "docs" },
          { "label": "Beginner Tutorial", "url": "https://real-url.com", "type": "video" }
        ]
      }
    },
    {
      "id": "node_1b",
      "type": "proNode",
      "position": { "x": 0, "y": 0 },
      "data": {
        "label": "Dev Environment Setup",
        "description": "Setting up your tools and IDE.",
        "isSpine": false,
        "codeSnippet": "// setup code",
        "resources": [{ "label": "Setup Guide", "url": "https://real-url.com", "type": "article" }]
      }
    }
  ],
  "edges": [
    { "id": "e_1_2", "source": "node_1", "target": "node_2", "type": "step", "className": "spine-edge" },
    { "id": "e_1_1b", "source": "node_1", "target": "node_1b", "type": "step", "className": "branch-edge" }
  ]
}

CONSTRAINT: "category" MUST be one of: ["Career", "Language", "Coding", "Design", "Custom"].
CONSTRAINT: resource "type" MUST be one of: ["video", "article", "docs", "tool", "code", "course", "book", "website", "other"].
CONSTRAINT: All node IDs must be unique strings starting with "node_".
CONSTRAINT: All edge IDs must be unique strings starting with "e_".

Return ONLY valid JSON. No markdown, no explanation.`;

        const completion = await groq.chat.completions.create({
            messages: [{ role: 'system', content: prompt }],
            model: AI_MODEL,
            temperature: 0.4,
            max_tokens: 4096,
            response_format: { type: "json_object" }
        });

        const jsonContent = completion.choices[0]?.message?.content;
        const generatedRoadmap = JSON.parse(jsonContent);

        // 📉 Decrement credits safely
        user.aiCredits = Math.max(0, (user.aiCredits || 10) - 1);
        await user.save();

        res.json({ ...generatedRoadmap, aiCredits: user.aiCredits });

    } catch (error) {
        console.error('AI Generation Error:', error);
        res.status(500).json({ message: 'Failed to generate roadmap', error: error.message });
    }
});

/**
 * @route   POST /api/ai/flood
 * @desc    Bulk generate descriptions, code, and resources for a skeleton roadmap
 * @access  Private (Admins only)
 */
router.post('/flood', protect, admin, async (req, res) => {
    try {
        const { title, nodes } = req.body;
        
        if (!nodes || nodes.length === 0) {
            return res.status(400).json({ message: 'No nodes provided to flood' });
        }

        console.log(`Smart-Flooding Roadmap Structure for: ${title}`);

        const existingNodeDetails = nodes.map((n, i) => 
          `  ${i+1}. "${n.data?.label || 'Unknown'}" - ${n.data?.description || 'No description yet'}`
        ).join('\n');

        const prompt = `You are an elite Senior Developer and Master Curriculum Architect. I have an existing roadmap for "${title}" that needs to be FULLY enriched.

EXISTING NODES IN THE ROADMAP:
${existingNodeDetails}

YOUR MISSION — MANDATORY REQUIREMENTS:
1. KEEP every existing node listed above. Do NOT remove or rename them.
2. ENRICH every single node with ALL of the following fields:
   - "description": A detailed 2-4 sentence explanation.
   - "codeSnippet": 3-8 lines of REAL, RUNNABLE code.
   - "resources": 2-3 REAL URLs.

Return ONLY a valid JSON object matching the standard roadmap format.
No markdown, no explanation.`;

        const completion = await groq.chat.completions.create({
            messages: [{ role: 'system', content: prompt }],
            model: AI_MODEL,
            temperature: 0.2,
            max_tokens: 6000,
            response_format: { type: "json_object" }
        });

        const jsonContent = completion.choices[0]?.message?.content;
        
        const startIdx = jsonContent.indexOf('{');
        const endIdx = jsonContent.lastIndexOf('}');
        const cleanJson = jsonContent.substring(startIdx, endIdx + 1);
        const fullRoadmap = JSON.parse(cleanJson);

        res.json(fullRoadmap);

    } catch (error) {
        console.error('Smart Flood Critical Error:', error);
        res.status(500).json({ message: 'AI architecting failed.', error: error.message });
    }
});

module.exports = router;
