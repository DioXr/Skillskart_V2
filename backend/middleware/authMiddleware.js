const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
            
            const foundUser = await User.findById(decoded.id).select('-password');
            if (!foundUser) {
                return res.status(401).json({ message: 'User not found, not authorized' });
            }
            
            req.user = foundUser;
            next();
        } catch (error) {
            console.error('Jwt Verify Error:', error.message);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `User role ${req.user.role} is not authorized to access this resource`
            });
        }
        next();
    };
};

const admin = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'subadmin')) {
        next();
    } else {
        res.status(401).json({ message: 'Not authorized as an admin or subadmin' });
    }
};

module.exports = { protect, admin, authorizeRoles };
