const jwt = require('jsonwebtoken');
const User = require('../models/User');

const readBearerToken = (req) => {
  const authHeader = req.headers.authorization;
  return authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
};

// Verifies the JWT and that the account still exists and is active, so a deactivated
// user's unexpired token stops working immediately.
const resolveUser = async (token) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id).select('isActive').lean();
  return user?.isActive ? decoded : null;
};

const protect = async (req, res, next) => {
  const token = readBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized – no token provided' });
  }
  try {
    const user = await resolveUser(token);
    if (!user) return res.status(401).json({ error: 'Unauthorized – account is deactivated or no longer exists' });
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Unauthorized – invalid token' });
    }
    next(err);
  }
};

// For routes that work for guests but personalise for signed-in users:
// a missing, invalid, or deactivated token just means "guest".
const optionalAuth = async (req, _res, next) => {
  const token = readBearerToken(req);
  if (!token) return next();
  try {
    req.user = await resolveUser(token);
  } catch {
    req.user = null;
  }
  next();
};

// Must run after `protect`. Role is read from the DB (not the token) so a
// demoted or deactivated admin loses access immediately.
const requireAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user?.id).select('role isActive');
    if (!user || !user.isActive || user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Forbidden – admin access required' });
    }
    next();
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { protect, optionalAuth, requireAdmin };
