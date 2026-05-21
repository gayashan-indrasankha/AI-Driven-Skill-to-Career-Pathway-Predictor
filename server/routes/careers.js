const express = require('express');
const router = express.Router();
const { query, body, param, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const CareerPath = require('../models/CareerPath');

const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return false;
  }
  return true;
};

// ─────────────────────────────────────────────────────────────────
// @GET /api/careers  ← Fetch + filter all career paths
// ─────────────────────────────────────────────────────────────────
router.get(
  '/',
  [
    query('industry').optional().isString(),
    query('demandLevel').optional().isIn(['low', 'medium', 'high', 'very-high']),
    query('workType').optional().isIn(['remote', 'hybrid', 'on-site', 'flexible']),
    query('futureOutlook').optional().isIn(['declining', 'stable', 'growing', 'booming']),
    query('search').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('page').optional().isInt({ min: 1 }),
  ],
  async (req, res) => {
    if (!handleValidation(req, res)) return;
    try {
      const { industry, demandLevel, workType, futureOutlook, search, limit = 20, page = 1 } = req.query;
      const filter = { isActive: true };

      if (industry) filter.industry = { $regex: industry, $options: 'i' };
      if (demandLevel) filter.demandLevel = demandLevel;
      if (workType) filter.workType = workType;
      if (futureOutlook) filter.futureOutlook = futureOutlook;
      if (search) filter.$text = { $search: search };

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const [careers, total] = await Promise.all([
        CareerPath.find(filter)
          .select('-pathwaySteps -relatedPaths')   // omit heavy fields in list view
          .sort({ growthRate: -1, demandLevel: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        CareerPath.countDocuments(filter),
      ]);

      res.json({
        success: true,
        count: careers.length,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        data: careers,
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// ─────────────────────────────────────────────────────────────────
// @GET /api/careers/predicted  ← Fetch predicted careers for user
// ─────────────────────────────────────────────────────────────────
router.get('/predicted', protect, async (req, res) => {
  try {
    const Assessment = require('../models/Assessment');
    const assessment = await Assessment.findOne({ user: req.user.id, status: 'analyzed' })
      .sort({ createdAt: -1 })
      .populate({
        path: 'predictedCareers.careerPath',
        select: 'title industry salaryPotential demandLevel growthRate workType certifications requiredDegrees pathwaySteps futureOutlook automationRisk',
      });

    if (!assessment) {
      return res.status(404).json({
        success: false,
        error: 'No analyzed assessment found. Please complete an assessment first.',
      });
    }

    res.json({
      success: true,
      assessmentId: assessment._id,
      analyzedAt: assessment.updatedAt,
      data: assessment.predictedCareers,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// @GET /api/careers/:idOrSlug  ← Single career path (full detail)
// ─────────────────────────────────────────────────────────────────
router.get('/:idOrSlug', async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    const isMongoId = /^[a-f\d]{24}$/i.test(idOrSlug);
    const career = await CareerPath.findOne(
      isMongoId ? { _id: idOrSlug } : { slug: idOrSlug }
    ).populate('relatedPaths', 'title industry slug demandLevel');

    if (!career) return res.status(404).json({ success: false, error: 'Career path not found' });
    res.json({ success: true, data: career });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// @POST /api/careers  ← Create a career path (admin)
// ─────────────────────────────────────────────────────────────────
router.post(
  '/',
  protect,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('industry').trim().notEmpty().withMessage('Industry is required'),
  ],
  async (req, res) => {
    if (!handleValidation(req, res)) return;
    try {
      const career = await CareerPath.create(req.body);
      res.status(201).json({ success: true, data: career });
    } catch (err) {
      if (err.code === 11000) return res.status(409).json({ success: false, error: 'Career path already exists' });
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// ─────────────────────────────────────────────────────────────────
// @PUT /api/careers/:id  ← Update a career path (admin)
// ─────────────────────────────────────────────────────────────────
router.put(
  '/:id',
  protect,
  [param('id').isMongoId().withMessage('Invalid career ID')],
  async (req, res) => {
    if (!handleValidation(req, res)) return;
    try {
      const career = await CareerPath.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!career) return res.status(404).json({ success: false, error: 'Career path not found' });
      res.json({ success: true, data: career });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// ─────────────────────────────────────────────────────────────────
// @DELETE /api/careers/:id  ← Soft-delete (admin)
// ─────────────────────────────────────────────────────────────────
router.delete('/:id', protect, async (req, res) => {
  try {
    const career = await CareerPath.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!career) return res.status(404).json({ success: false, error: 'Career path not found' });
    res.json({ success: true, message: 'Career path deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
