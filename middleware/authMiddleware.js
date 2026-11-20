const jwt = require('jsonwebtoken');
const User = require('../models/User');

// verify jwt token from Authorization header or query parameter
const protect = async (req, res, next) => {
  let token;

  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (authHeader && typeof authHeader === 'string') {
    // Clean up any double "Bearer Bearer", leading/trailing whitespace
    const parts = authHeader.trim().split(/\s+/);
    if (parts.length >= 2 && parts[0].toLowerCase() === 'bearer') {
      // Handles both standard "Bearer <token>" and accidental "Bearer Bearer <token>"
      token = parts[parts.length - 1];
    } else {
      // Handles direct token without "Bearer" prefix
      token = parts[0];
    }
  } else if (req.query && req.query.token) {
    // Also allow ?token= query parameter for instant browser/Swagger testing
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({
      message: 'Not authorized, no token provided. Please log in at /api/auth/login and provide the token in the Authorize button.'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ message: 'User not found, unauthorized' });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      message: 'Not authorized, invalid token. Please log in at /api/auth/login to get a fresh token.'
    });
  }
};

// check role permission (e.g. authorize('admin'))
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Forbidden: Role '${req.user ? req.user.role : 'none'}' does not have access to this resource`
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
