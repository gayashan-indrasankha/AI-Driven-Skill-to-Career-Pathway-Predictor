const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const User = require('../models/User');

const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return false;
  }
  return true;
};

// ─────────────────────────────────────────────────────────────────
// @POST /api/users  ← Create a new user (public, used by onboarding)
// ─────────────────────────────────────────────────────────────────
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Min 6 characters'),
  ],
  async (req, res) => {
    if (!handleValidation(req, res)) return;
    try {
      const existing = await User.findOne({ email: req.body.email });
      if (existing) return res.status(409).json({ success: false, error: 'Email already in use' });
      const user = await User.create(req.body);
      res.status(201).json({ success: true, data: user });
    } catch (err) {
      if (err.code === 11000) return res.status(409).json({ success: false, error: 'Duplicate field value' });
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// ─────────────────────────────────────────────────────────────────
// @GET /api/users/me  ← Get logged-in user profile
// ─────────────────────────────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('assessments');
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// @PUT /api/users/me  ← Update profile
// ─────────────────────────────────────────────────────────────────
router.put(
  '/me',
  protect,
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('gpa').optional().isFloat({ min: 0, max: 4.0 }).withMessage('GPA must be 0.0–4.0'),
    body('interests').optional().isArray().withMessage('Interests must be an array'),
  ],
  async (req, res) => {
    if (!handleValidation(req, res)) return;
    const allowed = ['name', 'avatar', 'phone', 'location', 'bio', 'educationLevel',
                     'institution', 'fieldOfStudy', 'graduationYear', 'gpa', 'grades',
                     'interests', 'preferredIndustries', 'workStyle', 'yearsOfExperience',
                     'githubUrl', 'portfolioUrl', 'linkedinUrl'];
    const updates = {};
    allowed.forEach(field => { if (req.body[field] !== undefined) updates[field] = req.body[field]; });
    try {
      const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true });
      res.json({ success: true, data: user });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// ─────────────────────────────────────────────────────────────────
// @PUT /api/users/me/grades  ← Add or replace grade records
// ─────────────────────────────────────────────────────────────────
router.put(
  '/me/grades',
  protect,
  [body('grades').isArray({ min: 1 }).withMessage('Grades must be a non-empty array')],
  async (req, res) => {
    if (!handleValidation(req, res)) return;
    try {
      const user = await User.findByIdAndUpdate(
        req.user.id,
        { grades: req.body.grades },
        { new: true, runValidators: true }
      );
      res.json({ success: true, data: { grades: user.grades, gpa: user.gpa } });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// ─────────────────────────────────────────────────────────────────
// @PUT /api/users/me/interests  ← Update extracted interests
// ─────────────────────────────────────────────────────────────────
router.put(
  '/me/interests',
  protect,
  [body('interests').isArray({ min: 1 }).withMessage('Interests must be a non-empty array')],
  async (req, res) => {
    if (!handleValidation(req, res)) return;
    try {
      const user = await User.findByIdAndUpdate(
        req.user.id,
        { interests: req.body.interests },
        { new: true }
      );
      res.json({ success: true, data: { interests: user.interests } });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// ─────────────────────────────────────────────────────────────────
// @DELETE /api/users/me  ← Soft-delete account
// ─────────────────────────────────────────────────────────────────
router.delete('/me', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { isActive: false });
    res.json({ success: true, message: 'Account deactivated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
