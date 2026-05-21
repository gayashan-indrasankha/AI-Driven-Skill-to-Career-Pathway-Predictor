const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const Assessment = require('../models/Assessment');
const User = require('../models/User');
const CareerPath = require('../models/CareerPath');

const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return false;
  }
  return true;
};

// ── Simple scoring engine (rule-based, replace with ML later) ─────
const computeCareerMatches = async (assessment) => {
  const careers = await CareerPath.find({ isActive: true }).lean();
  const userSkillNames = assessment.skillRatings.map(s => s.name.toLowerCase());
  const userInterests = assessment.extractedInterests.map(i => i.toLowerCase());

  return careers
    .map(career => {
      const required = career.requiredSkills || [];
      const matched = required.filter(rs =>
        userSkillNames.includes(rs.name.toLowerCase())
      );
      const gaps = required
        .filter(rs => !userSkillNames.includes(rs.name.toLowerCase()))
        .map(rs => rs.name);

      // interest alignment bonus
      const interestBonus = career.tags
        ? career.tags.filter(t => userInterests.includes(t.toLowerCase())).length * 5
        : 0;

      const skillScore = required.length > 0
        ? Math.round((matched.length / required.length) * 80)
        : 50;

      const matchScore = Math.min(100, skillScore + interestBonus);
      const confidenceLevel =
        matchScore >= 80 ? 'very-high' :
        matchScore >= 60 ? 'high' :
        matchScore >= 40 ? 'medium' : 'low';

      return {
        careerPath: career._id,
        matchScore,
        confidenceLevel,
        gapSkills: gaps,
        strengths: matched.map(m => m.name),
        estimatedTimeToReady: `${Math.max(3, gaps.length * 2)}–${Math.max(6, gaps.length * 3)} months`,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5); // top 5 matches
};

// ─────────────────────────────────────────────────────────────────
// @POST /api/assessment  ← Submit a full assessment
// ─────────────────────────────────────────────────────────────────
router.post(
  '/',
  protect,
  [
    body('skillRatings').optional().isArray(),
    body('extractedInterests').optional().isArray(),
    body('personalityTraits').optional().isArray(),
  ],
  async (req, res) => {
    if (!handleValidation(req, res)) return;
    try {
      const payload = {
        ...req.body,
        user: req.user.id,
        status: 'completed',
      };

      // Compute AI career matches if careers exist in DB
      const assessment = new Assessment(payload);
      assessment.predictedCareers = await computeCareerMatches(assessment);
      assessment.status = 'analyzed';
      await assessment.save();

      // Link assessment to user
      await User.findByIdAndUpdate(req.user.id, {
        $addToSet: { assessments: assessment._id },
        ...(payload.extractedInterests && { interests: payload.extractedInterests }),
      });

      const populated = await Assessment.findById(assessment._id)
        .populate('predictedCareers.careerPath', 'title industry salaryPotential demandLevel');

      res.status(201).json({ success: true, data: populated });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// ─────────────────────────────────────────────────────────────────
// @GET /api/assessment/my  ← All assessments for current user
// ─────────────────────────────────────────────────────────────────
router.get('/my', protect, async (req, res) => {
  try {
    const assessments = await Assessment.find({ user: req.user.id })
      .populate('predictedCareers.careerPath', 'title industry salaryPotential demandLevel growthRate')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: assessments.length, data: assessments });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// @GET /api/assessment/my/latest  ← Most recent assessment
// ─────────────────────────────────────────────────────────────────
router.get('/my/latest', protect, async (req, res) => {
  try {
    const assessment = await Assessment.findOne({ user: req.user.id })
      .populate('predictedCareers.careerPath')
      .sort({ createdAt: -1 });
    if (!assessment) return res.status(404).json({ success: false, error: 'No assessment found' });
    res.json({ success: true, data: assessment });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// @GET /api/assessment/:id  ← Single assessment by ID
// ─────────────────────────────────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const assessment = await Assessment.findOne({ _id: req.params.id, user: req.user.id })
      .populate('predictedCareers.careerPath');
    if (!assessment) return res.status(404).json({ success: false, error: 'Assessment not found' });
    res.json({ success: true, data: assessment });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// @PATCH /api/assessment/:id  ← Update draft assessment
// ─────────────────────────────────────────────────────────────────
router.patch('/:id', protect, async (req, res) => {
  try {
    const assessment = await Assessment.findOne({ _id: req.params.id, user: req.user.id });
    if (!assessment) return res.status(404).json({ success: false, error: 'Assessment not found' });
    if (assessment.status === 'analyzed')
      return res.status(400).json({ success: false, error: 'Cannot modify a completed assessment' });

    Object.assign(assessment, req.body);
    await assessment.save();
    res.json({ success: true, data: assessment });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// @POST /api/assessment/:id/reanalyze  ← Re-run career matching
// ─────────────────────────────────────────────────────────────────
router.post('/:id/reanalyze', protect, async (req, res) => {
  try {
    const assessment = await Assessment.findOne({ _id: req.params.id, user: req.user.id });
    if (!assessment) return res.status(404).json({ success: false, error: 'Assessment not found' });

    assessment.predictedCareers = await computeCareerMatches(assessment);
    assessment.status = 'analyzed';
    assessment.version += 1;
    await assessment.save();

    const populated = await Assessment.findById(assessment._id)
      .populate('predictedCareers.careerPath', 'title industry salaryPotential demandLevel');
    res.json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
