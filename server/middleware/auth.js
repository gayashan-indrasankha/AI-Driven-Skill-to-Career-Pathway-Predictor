const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized – no token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized – invalid token' });
  }
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

module.exports = { protect, requireAdmin };
