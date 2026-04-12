/**
 * Centralized Validation Middleware for SkillKart
 * Provides input validation and sanitization for all routes.
 */

// --- Helpers ---

const sanitize = (str) => {
    if (typeof str !== 'string') return str;
    return str
        .trim()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
};

const isValidEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
};

const getPasswordStrength = (password) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (score <= 2) return 'weak';
    if (score <= 4) return 'medium';
    return 'strong';
};

// --- Middleware ---

/**
 * Sanitize all string fields in req.body
 */
const sanitizeBody = (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
        const sanitizeRecursive = (obj) => {
            for (const key in obj) {
                if (typeof obj[key] === 'string') {
                    obj[key] = sanitize(obj[key]);
                } else if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                    sanitizeRecursive(obj[key]);
                }
            }
        };
        sanitizeRecursive(req.body);
    }
    next();
};

/**
 * Validate registration inputs
 */
const validateRegistration = (req, res, next) => {
    const { name, email, password } = req.body;
    const errors = {};

    // Name validation
    if (!name || typeof name !== 'string') {
        errors.name = 'Name is required.';
    } else if (name.trim().length < 2) {
        errors.name = 'Name must be at least 2 characters.';
    } else if (name.trim().length > 50) {
        errors.name = 'Name cannot exceed 50 characters.';
    } else if (!/^[a-zA-Z\s'-]+$/.test(name.trim())) {
        errors.name = 'Name can only contain letters, spaces, hyphens, and apostrophes.';
    }

    // Email validation
    if (!email || typeof email !== 'string') {
        errors.email = 'Email is required.';
    } else if (!isValidEmail(email.trim())) {
        errors.email = 'Please enter a valid email address.';
    }

    // Password validation
    if (!password || typeof password !== 'string') {
        errors.password = 'Password is required.';
    } else if (password.length < 8) {
        errors.password = 'Password must be at least 8 characters.';
    } else if (password.length > 128) {
        errors.password = 'Password cannot exceed 128 characters.';
    } else if (!/[A-Z]/.test(password)) {
        errors.password = 'Password must include at least one uppercase letter.';
    } else if (!/[0-9]/.test(password)) {
        errors.password = 'Password must include at least one number.';
    }

    if (Object.keys(errors).length > 0) {
        return res.status(400).json({ 
            message: 'Validation failed', 
            errors 
        });
    }

    next();
};

/**
 * Validate login inputs
 */
const validateLogin = (req, res, next) => {
    const { email, password } = req.body;
    const errors = {};

    if (!email || typeof email !== 'string' || !isValidEmail(email.trim())) {
        errors.email = 'Please enter a valid email address.';
    }

    if (!password || typeof password !== 'string' || password.length === 0) {
        errors.password = 'Password is required.';
    }

    if (Object.keys(errors).length > 0) {
        return res.status(400).json({
            message: 'Validation failed',
            errors
        });
    }

    next();
};

/**
 * Validate roadmap creation/update
 */
const validateRoadmap = (req, res, next) => {
    const { title, category, description } = req.body;
    const errors = {};

    if (!title || typeof title !== 'string' || title.trim().length < 3) {
        errors.title = 'Title must be at least 3 characters.';
    } else if (title.trim().length > 100) {
        errors.title = 'Title cannot exceed 100 characters.';
    }

    const validCategories = ['Career', 'Language', 'Coding', 'Design', 'Custom'];
    if (category && !validCategories.includes(category)) {
        errors.category = `Category must be one of: ${validCategories.join(', ')}`;
    }

    if (description && typeof description === 'string' && description.length > 500) {
        errors.description = 'Description cannot exceed 500 characters.';
    }

    if (Object.keys(errors).length > 0) {
        return res.status(400).json({
            message: 'Validation failed',
            errors
        });
    }

    next();
};

/**
 * Validate AI generation topic
 */
const validateAIGenerate = (req, res, next) => {
    const { topic } = req.body;
    const errors = {};

    if (!topic || typeof topic !== 'string') {
        errors.topic = 'Please provide a topic for the roadmap.';
    } else if (topic.trim().length < 3) {
        errors.topic = 'Topic must be at least 3 characters.';
    } else if (topic.trim().length > 100) {
        errors.topic = 'Topic cannot exceed 100 characters.';
    } else if (!/^[a-zA-Z0-9\s.,+#\-/()&]+$/.test(topic.trim())) {
        errors.topic = 'Topic contains invalid characters. Use only letters, numbers, and basic punctuation.';
    }

    if (Object.keys(errors).length > 0) {
        return res.status(400).json({
            message: 'Validation failed',
            errors
        });
    }

    next();
};

module.exports = {
    sanitizeBody,
    validateRegistration,
    validateLogin,
    validateRoadmap,
    validateAIGenerate,
    getPasswordStrength,
    isValidEmail
};
