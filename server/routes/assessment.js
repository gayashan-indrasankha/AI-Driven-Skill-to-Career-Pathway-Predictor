const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
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

const normalise = (value = '') => value.toString().trim().toLowerCase();
const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));

const monthsRange = (missingSkills, averageGap) => {
  const base = missingSkills * 5 + Math.max(0, averageGap) * 3;
  const min = Math.max(2, Math.round(base * 0.65));
  const max = Math.max(4, Math.round(base * 1.15));
  return `${min}-${max} months`;
};

const getPreference = (assessment, key) => {
  const prefs = assessment.workPreferences || {};
  if (key === 'style') return normalise(prefs.style || assessment.workPreference || '');
  if (key === 'industry') return (prefs.industry || []).map(normalise);
  return '';
};

const computeCareerMatches = async (assessment) => {
  const careers = await CareerPath.find({ isActive: true }).lean();
  const userSkills = new Map((assessment.skillRatings || []).map(skill => [normalise(skill.name), skill]));
  const userInterests = (assessment.extractedInterests || []).map(normalise);
  const careerGoals = Array.isArray(assessment.careerGoals)
    ? assessment.careerGoals.join(' ')
    : assessment.careerGoals || '';
  const goalText = normalise(careerGoals);
  const preferredWorkType = getPreference(assessment, 'style');
  const preferredIndustries = getPreference(assessment, 'industry');

  return careers
    .map(career => {
      const required = career.requiredSkills || [];
      const totalWeight = required.reduce((sum, skill) => sum + (skill.importance || 3), 0) || 1;
      let earnedWeight = 0;
      let averageGap = 0;

      const matched = [];
      const gaps = [];

      required.forEach(requiredSkill => {
        const userSkill = userSkills.get(normalise(requiredSkill.name));
        const requiredLevel = requiredSkill.proficiencyRequired || 3;
        const importance = requiredSkill.importance || 3;

        if (!userSkill) {
          gaps.push(requiredSkill.name);
          averageGap += requiredLevel;
          return;
        }

        const proficiency = userSkill.proficiency || 1;
        const fit = clamp(proficiency / requiredLevel, 0, 1);
        earnedWeight += importance * fit;
        matched.push(requiredSkill.name);

        if (proficiency < requiredLevel) {
          const gap = requiredLevel - proficiency;
          gaps.push(`${requiredSkill.name} (raise to level ${requiredLevel})`);
          averageGap += gap;
        }
      });

      averageGap = gaps.length ? averageGap / gaps.length : 0;

      const skillScore = (earnedWeight / totalWeight) * 58;
      const interestHits = (career.tags || []).filter(tag => {
        const normalizedTag = normalise(tag);
        return userInterests.some(interest => normalizedTag.includes(interest) || interest.includes(normalizedTag));
      }).length;
      const interestScore = clamp(interestHits * 4, 0, 16);
      const marketScore = ((career.marketSignal?.sriLankaDemandScore || 50) / 100) * 16;
      const workScore = preferredWorkType && preferredWorkType === normalise(career.workType) ? 5 : 0;
      const industryScore = preferredIndustries.some(industry => normalise(career.industry).includes(industry)) ? 3 : 0;
      const goalScore = (career.tags || []).some(tag => goalText.includes(normalise(tag))) ? 5 : 0;
      const matchScore = Math.round(clamp(skillScore + interestScore + marketScore + workScore + industryScore + goalScore));

      const confidenceLevel =
        matchScore >= 80 ? 'very-high' :
        matchScore >= 60 ? 'high' :
        matchScore >= 40 ? 'medium' : 'low';

      return {
        careerPath: career._id,
        matchScore,
        confidenceLevel,
        gapSkills: gaps,
        strengths: matched,
        estimatedTimeToReady: monthsRange(gaps.length, averageGap),
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5);
};

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
        careerGoals: Array.isArray(req.body.careerGoals)
          ? req.body.careerGoals
          : req.body.careerGoals ? [req.body.careerGoals] : [],
        workPreferences: req.body.workPreferences || {
          style: req.body.workPreference || '',
          industry: req.body.preferredIndustries || [],
        },
        user: req.user.id,
        status: 'completed',
      };

      const assessment = new Assessment(payload);
      assessment.predictedCareers = await computeCareerMatches(assessment);
      assessment.status = 'analyzed';
      await assessment.save();

      await User.findByIdAndUpdate(req.user.id, {
        $addToSet: { assessments: assessment._id },
        ...(payload.extractedInterests && { interests: payload.extractedInterests }),
      });

      const populated = await Assessment.findById(assessment._id)
        .populate('predictedCareers.careerPath', 'title industry salaryPotential demandLevel growthRate marketSignal learningResources prototypeIdeas requiredDegrees certifications pathwaySteps futureOutlook automationRisk roles');

      res.status(201).json({ success: true, data: populated });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

router.get('/my', protect, async (req, res) => {
  try {
    const assessments = await Assessment.find({ user: req.user.id })
      .populate('predictedCareers.careerPath', 'title industry salaryPotential demandLevel growthRate marketSignal')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: assessments.length, data: assessments });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

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

router.get('/:id', protect, [param('id').isMongoId()], async (req, res) => {
  if (!handleValidation(req, res)) return;
  try {
    const assessment = await Assessment.findOne({ _id: req.params.id, user: req.user.id })
      .populate('predictedCareers.careerPath');
    if (!assessment) return res.status(404).json({ success: false, error: 'Assessment not found' });
    res.json({ success: true, data: assessment });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.patch('/:id', protect, [param('id').isMongoId()], async (req, res) => {
  if (!handleValidation(req, res)) return;
  try {
    const assessment = await Assessment.findOne({ _id: req.params.id, user: req.user.id });
    if (!assessment) return res.status(404).json({ success: false, error: 'Assessment not found' });
    if (assessment.status === 'analyzed') {
      return res.status(400).json({ success: false, error: 'Cannot modify a completed assessment' });
    }

    Object.assign(assessment, req.body);
    await assessment.save();
    res.json({ success: true, data: assessment });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/:id/reanalyze', protect, [param('id').isMongoId()], async (req, res) => {
  if (!handleValidation(req, res)) return;
  try {
    const assessment = await Assessment.findOne({ _id: req.params.id, user: req.user.id });
    if (!assessment) return res.status(404).json({ success: false, error: 'Assessment not found' });

    assessment.predictedCareers = await computeCareerMatches(assessment);
    assessment.status = 'analyzed';
    assessment.version += 1;
    await assessment.save();

    const populated = await Assessment.findById(assessment._id)
      .populate('predictedCareers.careerPath', 'title industry salaryPotential demandLevel growthRate marketSignal learningResources prototypeIdeas');
    res.json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
