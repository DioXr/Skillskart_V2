const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { sanitizeBody, validateAIGenerate } = require('../middleware/validators');
const Groq = require('groq-sdk');
const User = require('../models/User');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Model tiers (Primary is 70B, Fallback is 8B)
const MODELS = {
    best:    'llama-3.3-70b-versatile',
    speed:   'llama-3.1-8b-instant',
    context: 'llama-3.1-8b-instant',
};

/**
 * 🛡️ SMART FALLBACK HELPER
 * Tries the preferred model first. If it hits TPD (Daily) or TPM (Minute) limits,
 * it automatically retries with a fallback model to prevent 500 crashes.
 */
async function callAIWithFallback(params) {
    const { model, messages, temperature, max_tokens, response_format } = params;
    
    try {
        console.log(`[AI] Attempting ${model}...`);
        return await groq.chat.completions.create({
            model, messages, temperature, max_tokens, response_format
        });
    } catch (error) {
        const isRateLimit = error.status === 429 || error.status === 413 || error.message.includes('rate_limit');
        
        if (isRateLimit && model !== MODELS.context) {
            console.warn(`[AI Fallback] ${model} failed (Limit Reached). Retrying with Fallback Model...`);
            return await groq.chat.completions.create({
                model: MODELS.context,
                messages, temperature, max_tokens, response_format
            });
        }
        
        if (isRateLimit && model === MODELS.context) {
            console.warn(`[AI Fallback] Fallback Model also failed. Last resort: 8B Instant...`);
            return await groq.chat.completions.create({
                model: MODELS.speed,
                messages, temperature, max_tokens, response_format
            });
        }
        
        throw error; // Not a rate limit error, throw it up
    }
}

/**
 * @route   GET /api/ai/ping
 * @access  Public
 */
router.get('/ping', (req, res) => {
    res.json({ message: 'AI Router is Active and Reachable! 🚀' });
});

/**
 * Build the roadmap.sh-style generation prompt based on tier
 */
function buildGenerationPrompt(topic, tier = 'free') {
    const nodeCount = tier === 'free' ? '18-22' : tier === 'pro' ? '28-35' : '32-40';
    
    return `You are an elite curriculum architect. Generate a comprehensive, roadmap.sh-style learning roadmap for: "${topic}"

CRITICAL: Produce EXACTLY ${nodeCount} nodes. Structure it like roadmap.sh — NOT a flat list.

═══════════════════════════════════════════
NODE TYPES (use all of them):
═══════════════════════════════════════════

1. "topicNode"   — Main learning areas (like roadmap.sh yellow boxes). Largest nodes.
                   Properties: label, description, difficulty, estimatedHours, phase, resources, codeSnippet
                   
2. "subtopicNode"— Specific tools/technologies/concepts under a topic (like roadmap.sh peach/light boxes).
                   Properties: label, description, resources, codeSnippet
                   
3. "checkpointNode" — Milestone nodes (like roadmap.sh dark boxes: "Checkpoint — Build X").
                   Properties: label, projectSuggestion, description

═══════════════════════════════════════════
PHASE STRUCTURE (assign each topicNode a phase):
═══════════════════════════════════════════

Phase 1 "foundation"  — Prerequisites & basics (first 20% of nodes)
Phase 2 "core"        — Core skills and main technologies (middle 50%)
Phase 3 "advanced"    — Advanced patterns, architecture (next 20%)
Phase 4 "mastery"     — Expert level, real-world production skills (last 10%)

═══════════════════════════════════════════
EDGE RULES:
═══════════════════════════════════════════

- Spine edges (main vertical path): source → target (topicNode to topicNode)
  className: "spine-edge"
  
- Branch edges (topic to its subtopics): source → target (topicNode to subtopicNode)  
  className: "branch-edge"

- Checkpoint edges: The checkpoint connects AFTER completing a phase group
  className: "checkpoint-edge"

Each topicNode MUST have 2-4 subtopicNode children connected to it.
Place a checkpointNode after every major phase (3-4 checkpoints total).

═══════════════════════════════════════════
CONTENT REQUIREMENTS (MANDATORY):
═══════════════════════════════════════════

For EACH topicNode:
- label: 2-4 words (e.g., "State Management", "REST API Design")
- description: 2-3 sentences explaining what to learn and why it matters
- difficulty: one of ["beginner", "intermediate", "advanced"]
- estimatedHours: realistic integer (e.g., 20, 40, 60)
- phase: one of ["foundation", "core", "advanced", "mastery"]
- codeSnippet: 3-8 lines of REAL, RUNNABLE code relevant to the topic
- resources: 2-3 REAL, WORKING URLs (MDN, official docs, freeCodeCamp, YouTube, GitHub)

For EACH subtopicNode:
- label: 1-3 words (specific tool/tech/concept name)
- description: 1-2 sentences
- resources: 1-2 REAL URLs
- codeSnippet: optional, 2-5 lines

For EACH checkpointNode:
- label: "Build [specific project name]" (e.g., "Build a Todo App", "Build a REST API")
- description: What the user should be able to do at this checkpoint
- projectSuggestion: A specific, actionable project idea (1 sentence)

═══════════════════════════════════════════
EXAMPLE STRUCTURE for "JavaScript":
═══════════════════════════════════════════

spine: Variables & Types → Functions → DOM → Async JS → ES6+ → Modules
branches off "Variables & Types": [let/const/var, Data Types, Type Coercion]
branches off "Functions": [Arrow Functions, Closures, Higher-Order Functions]
checkpoint after DOM: "Build a Static Interactive Page"
branches off "Async JS": [Promises, async/await, Fetch API]
checkpoint after Modules: "Build a Complete JS App"

FOLLOW THIS EXACT JSON SCHEMA:
{
  "title": "Complete ${topic} Roadmap",
  "description": "A comprehensive, structured learning path to master ${topic} from fundamentals to advanced production-ready skills.",
  "category": "Coding",
  "nodes": [
    {
      "id": "node_1",
      "type": "topicNode",
      "position": { "x": 0, "y": 0 },
      "data": {
        "label": "Getting Started",
        "description": "Setup dev environment and understand core concepts.",
        "difficulty": "beginner",
        "estimatedHours": 10,
        "phase": "foundation",
        "nodeType": "topic",
        "isSpine": true,
        "codeSnippet": "// example\\nconsole.log('Hello World');",
        "resources": [
          { "label": "Official Docs", "url": "https://developer.mozilla.org", "type": "docs" },
          { "label": "Getting Started Tutorial", "url": "https://www.freecodecamp.org", "type": "course" }
        ]
      }
    },
    {
      "id": "node_1a",
      "type": "subtopicNode",
      "position": { "x": 0, "y": 0 },
      "data": {
        "label": "VS Code Setup",
        "description": "Configure your IDE for maximum productivity.",
        "nodeType": "subtopic",
        "isSpine": false,
        "resources": [{ "label": "VS Code Guide", "url": "https://code.visualstudio.com/docs", "type": "docs" }]
      }
    },
    {
      "id": "checkpoint_1",
      "type": "checkpointNode",
      "position": { "x": 0, "y": 0 },
      "data": {
        "label": "Build Your First App",
        "description": "At this point you should be able to build a simple working application.",
        "projectSuggestion": "Build a simple calculator app with HTML, CSS, and JavaScript.",
        "nodeType": "checkpoint",
        "isSpine": true
      }
    }
  ],
  "edges": [
    { "id": "e_1_2", "source": "node_1", "target": "node_2", "type": "smoothstep", "className": "spine-edge" },
    { "id": "e_1_1a", "source": "node_1", "target": "node_1a", "type": "smoothstep", "className": "branch-edge" },
    { "id": "e_1_cp1", "source": "node_1", "target": "checkpoint_1", "type": "smoothstep", "className": "checkpoint-edge" }
  ]
}

CONSTRAINTS:
- "category" MUST be one of: ["Career", "Language", "Coding", "Design", "Custom"]
- resource "type" MUST be one of: ["video", "article", "docs", "tool", "code", "course", "book", "website", "other"]
- All IDs must be unique — use patterns like: node_1, node_1a, node_1b, node_2, node_2a, checkpoint_1, etc.
- Edge IDs must start with "e_"
- ALL node types used: topicNode, subtopicNode, checkpointNode
- REAL URLs only — verified links to actual documentation and courses

Return ONLY valid JSON. No markdown fences, no explanation, no comments.`;
}

/**
 * @route   POST /api/ai/generate
 * @desc    Generate a roadmap.sh-style AI Roadmap with multi-type nodes
 * @access  Private
 */
router.post('/generate', protect, sanitizeBody, validateAIGenerate, async (req, res) => {
    try {
        const { topic } = req.body;

        const user = await User.findById(req.user._id);
        if (user.aiCredits === undefined) user.aiCredits = 5;

        if (user.aiCredits <= 0 && user.role !== 'admin') {
            return res.status(403).json({
                message: 'You have run out of AI Credits.',
                outOfCredits: true
            });
        }

        const plan = user.subscription?.plan || 'free';
        const tier = user.role === 'admin' ? 'admin' : plan;
        
        // 🚀 SMART MODEL SELECTION
        const preferredModel = (tier === 'pro' || tier === 'admin') ? MODELS.best : MODELS.speed;

        console.log(`[AI Generate] Topic: "${topic}" | User: ${user.email} | Tier: ${tier} | Preferred: ${preferredModel}`);

        const prompt = buildGenerationPrompt(topic, tier);

        const completion = await callAIWithFallback({
            messages: [
                { role: 'system', content: 'You are an expert curriculum architect. You ONLY output valid JSON.' },
                { role: 'user', content: prompt }
            ],
            model: preferredModel,
            temperature: 0.35,
            max_tokens: tier === 'free' ? 4000 : 7000,
            response_format: { type: 'json_object' }
        });

        const jsonContent = completion.choices[0]?.message?.content;

        let generatedRoadmap;
        try {
            generatedRoadmap = JSON.parse(jsonContent);
        } catch (parseErr) {
            const match = jsonContent.match(/\{[\s\S]*\}/);
            if (match) {
                generatedRoadmap = JSON.parse(match[0]);
            } else {
                throw new Error('AI returned malformed JSON');
            }
        }

        if (!generatedRoadmap.nodes || !Array.isArray(generatedRoadmap.nodes)) {
            throw new Error('AI response missing nodes array');
        }

        const generateIdMap = new Map();
        
        generatedRoadmap.nodes = generatedRoadmap.nodes.map((n, i) => {
            const originalId = n.id ? String(n.id) : `node_auto_${i}`;
            const safeId = `node_g_${i}_${Math.random().toString(36).substring(2, 7)}_${Date.now()}`;
            generateIdMap.set(originalId, safeId);

            return {
                ...n,
                id: safeId,
                type: n.type || 'topicNode',
            };
        });

        const nodeIds = new Set(generatedRoadmap.nodes.map(n => n.id));
        
        generatedRoadmap.edges = (generatedRoadmap.edges || [])
            .map((e, i) => {
                const newSource = generateIdMap.get(String(e.source)) || e.source;
                const newTarget = generateIdMap.get(String(e.target)) || e.target;
                
                return {
                    ...e,
                    id: `e_g_${i}_${Date.now()}`,
                    source: String(newSource),
                    target: String(newTarget),
                };
            })
            .filter(e => nodeIds.has(e.source) && nodeIds.has(e.target));

        if (user.role !== 'admin') {
            user.aiCredits = Math.max(0, (user.aiCredits || 5) - 1);
            await user.save();
        }

        res.json({
            ...generatedRoadmap,
            aiCredits: user.aiCredits,
            nodesGenerated: generatedRoadmap.nodes.length,
        });

    } catch (error) {
        console.error('[AI Generate] Error:', error.message);
        res.status(500).json({ message: 'Failed to generate roadmap.', error: error.message });
    }
});

/**
 * @route   POST /api/ai/flood
 * @desc    Bulk enrich a skeleton roadmap with AI content
 * @access  Private (Admins only)
 */
router.post('/flood', protect, admin, async (req, res) => {
    try {
        const { title, nodes } = req.body;

        if (!nodes || nodes.length === 0) {
            return res.status(400).json({ message: 'No nodes provided to flood' });
        }

        console.log(`[AI Flood] Attempting Best Model: "${title}"`);

        const nodeDetails = nodes.map((n, i) =>
            `  ${i + 1}. [${n.type || 'topic'}] "${n.data?.label || 'Unknown'}" — ${n.data?.description || 'No description'}`
        ).join('\n');

const prompt = `You are an elite Senior Developer and Curriculum Architect evaluating an existing roadmap for "${title}".

EXISTING NODES:
${nodeDetails}

YOUR MISSION:
1. KEEP every existing node exactly as it is (do not change their IDs).
2. ENRICH existing nodes with descriptions, realistic codeSnippets, and 2-3 REAL URLs.
3. EXPAND the roadmap dynamically. If the roadmap looks bare or lacks depth, you MUST add 5 to 10 new, relevant milestones (type: "subtopicNode" or "checkpointNode") and connect them properly to the existing nodes. 

IMPORTANT JSON DATA SCHEMA:
Return ONLY a valid JSON object in this exact format:
{
  "nodes": [
    {
      "id": "original_id_OR_new_unique_id",
      "type": "proNode",
      "data": {
        "label": "Node Title",
        "description": "2-4 sentences of real actionable guidance...",
        "codeSnippet": "runnable code here...",
        "resources": [ { "label": "Docs", "url": "https://...", "type": "article" } ]
      }
    }
  ],
  "edges": [
     { "id": "edge_new_1", "source": "existing_node_id", "target": "new_node_id", "className": "spine-edge" }
  ]
}

No markdown, no explanation, just JSON.`;

        const completion = await callAIWithFallback({
            messages: [
                { role: 'system', content: 'You output only valid JSON. No markdown, no explanation.' },
                { role: 'user', content: prompt }
            ],
            model: MODELS.best,
            temperature: 0.2,
            max_tokens: 5000,
            response_format: { type: 'json_object' }
        });

        const jsonContent = completion.choices[0]?.message?.content;
        
        let fullRoadmap;
        try {
            fullRoadmap = JSON.parse(jsonContent);
        } catch (parseErr) {
            const match = jsonContent.match(/\{[\s\S]*\}/);
            if (match) {
                fullRoadmap = JSON.parse(match[0]);
            } else {
                throw new Error('AI returned malformed JSON');
            }
        }

        if (!fullRoadmap.nodes || !Array.isArray(fullRoadmap.nodes)) {
            throw new Error('AI response missing nodes array');
        }

        // 🛡️ UNIVERSAL ID PROTECTOR: Map every incoming ID to a unique local ID
        const nodeIdMap = new Map();
        
        fullRoadmap.nodes = fullRoadmap.nodes.map((n, i) => {
            const originalId = n.id ? String(n.id) : `node_auto_${i}`;
            const safeId = `node_f_${i}_${Math.random().toString(36).substring(2, 7)}`;
            
            // Map the original AI ID to our new Safe ID
            // If multiple nodes have the same ID, the map will store the latest one (ambiguity fallback)
            nodeIdMap.set(originalId, safeId);

            return {
                ...n,
                id: safeId,
                type: n.type || 'proNode',
                data: {
                    ...(n.data || {}),
                    label: n.data?.label || "Untitled",
                    status: n.data?.status || 'locked'
                }
            };
        });

        // 🚢 EDGE RE-ANCHORING: Ensure edges point to the NEW Safe IDs
        const nodeIds = new Set(fullRoadmap.nodes.map(n => n.id));

        fullRoadmap.edges = (fullRoadmap.edges || [])
            .map((e, i) => {
                const newSource = nodeIdMap.get(String(e.source)) || e.source;
                const newTarget = nodeIdMap.get(String(e.target)) || e.target;
                
                return {
                    ...e,
                    id: `e_f_${i}_${Date.now()}`,
                    source: String(newSource),
                    target: String(newTarget),
                    sourceHandle: 's-bottom',
                    targetHandle: 't-top',
                };
            })
            .filter(e => {
                // Remove edges that don't point to valid nodes
                return nodeIds.has(e.source) && nodeIds.has(e.target);
            });

        res.json(fullRoadmap);

    } catch (error) {
        console.error('[AI Flood] CRITICAL ERROR:', error);
        res.status(500).json({ 
            message: 'AI enrichment failed.', 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

/**
 * @route   POST /api/ai/suggest-resources
 * @desc    Get AI-suggested resources for a specific topic node
 * @access  Private (Pro+)
 */
router.post('/suggest-resources', protect, async (req, res) => {
    try {
        const { nodeLabel, roadmapTitle } = req.body;

        if (!nodeLabel) {
            return res.status(400).json({ message: 'Node label is required.' });
        }

        const completion = await callAIWithFallback({
            messages: [{
                role: 'user',
                content: `List the best 5 learning resources for "${nodeLabel}" in the context of learning "${roadmapTitle || 'programming'}".
Return ONLY a JSON array: {"resources": [{"label":"...","url":"...","type":"...","description":"..."}]}`
            }],
            model: MODELS.speed,
            temperature: 0.3,
            max_tokens: 1000,
            response_format: { type: 'json_object' }
        });

        const content = completion.choices[0]?.message?.content;
        const parsed = JSON.parse(content);
        const resources = parsed.resources || parsed.items || parsed || [];

        res.json({ resources: Array.isArray(resources) ? resources : [] });
    } catch (error) {
        console.error('[AI Suggest Resources] Error:', error.message);
        res.status(500).json({ message: 'Failed to suggest resources.' });
    }
});

module.exports = router;
