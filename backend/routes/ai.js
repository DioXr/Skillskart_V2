const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * @route   POST /api/ai/generate
 * @desc    Simulate AI Roadmap Generation
 * @access  Private (Admins or Subadmins only for now to prevent spam)
 */
router.post('/generate', protect, admin, async (req, res) => {
    try {
        const { topic } = req.body;
        
        if (!topic) {
            return res.status(400).json({ message: 'Please provide a topic for the roadmap' });
        }

        console.log(`Generating AI Roadmap for: ${topic}`);

        // 🧠 REAL GROQ AI LOGIC
        const prompt = `You are an expert curriculum designer and career path planner. Construct a highly structured, step-by-step roadmap for mastering "${topic}".
You MUST return ONLY a raw JSON object string.
The JSON object must precisely match this format:
{
  "title": "AI Roadmap: ${topic}",
  "description": "Professional summary of the path.",
  "category": "Custom",
  "nodes": [
    {
      "id": "node_1",
      "type": "proNode",
      "position": { "x": 250, "y": 0 },
      "data": {
        "label": "Fundamentals",
        "description": "Core concepts",
        "resources": [{"label": "Official Docs", "url": "https://example.com", "type": "article"}]
      }
    }
  ],
  "edges": [
    { "id": "e1-2", "source": "node_1", "target": "node_2", "animated": true }
  ]
}
CONSTRAINT 1: "category" MUST be exactly one of: ["Career", "Language", "Coding", "Design", "Custom"].
CONSTRAINT 2: inside "resources", "type" MUST be exactly one of: ["video", "article", "docs", "tool", "code", "file", "course", "book", "website", "other"].
Make sure to generate 6-10 distinct nodes, placing them logically (stagger their X positions between 100, 250, and 400, and sequentially increase their Y positions by 150 downwards). Connect all nodes sequentially with edges.
Return ONLY valid JSON.`;

        const completion = await groq.chat.completions.create({
            messages: [{ role: 'system', content: prompt }],
            model: 'llama-3.1-8b-instant',
            temperature: 0.5,
            response_format: { type: "json_object" }
        });

        const jsonContent = completion.choices[0]?.message?.content;
        const generatedRoadmap = JSON.parse(jsonContent);

        res.json(generatedRoadmap);

    } catch (error) {
        console.error('AI Generation Error:', error);
        res.status(500).json({ message: 'Failed to generate roadmap', error: error.message });
    }
});

module.exports = router;
