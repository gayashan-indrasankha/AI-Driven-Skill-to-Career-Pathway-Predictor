const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Career = require('../models/Career');

// @POST /api/simulation/run – simulate career pathway
router.post('/run', protect, async (req, res) => {
  try {
    const { careerId, currentSkills, timelineMonths } = req.body;
    const career = await Career.findById(careerId).populate('requiredSkills.skill');
    if (!career) return res.status(404).json({ error: 'Career not found' });

    const requiredSkillNames = career.requiredSkills.map((rs) => rs.skill?.name);
    const gapSkills = requiredSkillNames.filter((s) => !currentSkills.includes(s));
    const matchedSkills = requiredSkillNames.filter((s) => currentSkills.includes(s));
    const matchScore = Math.round((matchedSkills.length / requiredSkillNames.length) * 100);

    const monthsToReady = Math.max(3, gapSkills.length * 2);
    const projectedSalary = career.averageSalary?.min
      ? Math.round(career.averageSalary.min + (matchScore / 100) * (career.averageSalary.max - career.averageSalary.min))
      : null;

    res.json({
      career: { title: career.title, industry: career.industry, growthRate: career.growthRate },
      matchScore,
      gapSkills,
      matchedSkills,
      monthsToReady,
      projectedSalary,
      currency: career.averageSalary?.currency || 'USD',
      pathway: career.pathwaySteps,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
