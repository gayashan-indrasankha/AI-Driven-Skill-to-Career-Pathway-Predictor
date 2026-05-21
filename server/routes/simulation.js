const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const CareerPath = require('../models/CareerPath');
const Assessment = require('../models/Assessment');

const normalise = (value = '') => value.toString().trim().toLowerCase();
const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));

const optionalAuth = (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return next();

  try {
    req.user = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
  } catch {
    req.user = null;
  }
  next();
};

const buildSkillMap = (skills = []) => {
  const map = new Map();
  skills.forEach(skill => {
    if (typeof skill === 'string') {
      map.set(normalise(skill), { name: skill, proficiency: 3 });
      return;
    }
    if (skill?.name) {
      map.set(normalise(skill.name), {
        name: skill.name,
        proficiency: Number(skill.proficiency || skill.level || 3),
      });
    }
  });
  return map;
};

const getLatestAssessmentSkills = async (userId) => {
  if (!userId) return [];
  const assessment = await Assessment.findOne({ user: userId }).sort({ createdAt: -1 }).lean();
  if (!assessment) return [];

  const ratedSkills = assessment.skillRatings || [];
  const githubSkills = assessment.githubData?.topLanguages?.map(item => ({
    name: item.language,
    proficiency: clamp(Math.ceil((item.percentage || 20) / 20), 1, 5),
  })) || [];

  return [...ratedSkills, ...githubSkills];
};

const computeReadiness = (career, skillMap) => {
  const required = career.requiredSkills || [];
  const totalWeight = required.reduce((sum, skill) => sum + (skill.importance || 3), 0) || 1;
  let earnedWeight = 0;
  let missingEffort = 0;

  const matchedSkills = [];
  const gapSkills = [];

  required.forEach(requiredSkill => {
    const current = skillMap.get(normalise(requiredSkill.name));
    const requiredLevel = requiredSkill.proficiencyRequired || 3;
    const importance = requiredSkill.importance || 3;

    if (!current) {
      missingEffort += requiredLevel * importance;
      gapSkills.push({
        name: requiredSkill.name,
        currentLevel: 0,
        requiredLevel,
        importance,
        priority: importance >= 5 ? 'critical' : importance >= 4 ? 'high' : 'medium',
      });
      return;
    }

    const currentLevel = clamp(current.proficiency || 1, 1, 5);
    const fit = clamp(currentLevel / requiredLevel, 0, 1);
    earnedWeight += importance * fit;
    matchedSkills.push({
      name: requiredSkill.name,
      currentLevel,
      requiredLevel,
      fit: Math.round(fit * 100),
    });

    if (currentLevel < requiredLevel) {
      const levelGap = requiredLevel - currentLevel;
      missingEffort += levelGap * importance;
      gapSkills.push({
        name: requiredSkill.name,
        currentLevel,
        requiredLevel,
        importance,
        priority: importance >= 5 ? 'critical' : importance >= 4 ? 'high' : 'medium',
      });
    }
  });

  const skillScore = Math.round((earnedWeight / totalWeight) * 100);
  const marketScore = career.marketSignal?.sriLankaDemandScore || 50;
  const commercialScore = Math.round(
    ((career.prototypeIdeas?.length ? 35 : 20) +
      (career.marketSignal?.businessUseCases?.length || 0) * 8 +
      (career.marketSignal?.employerTypes?.length || 0) * 4)
  );
  const readinessScore = Math.round(clamp(skillScore * 0.58 + marketScore * 0.24 + clamp(commercialScore, 0, 100) * 0.18));

  return {
    skillScore,
    marketScore,
    commercialScore: clamp(commercialScore, 0, 100),
    readinessScore,
    matchedSkills,
    gapSkills,
    missingEffort,
  };
};

const projectSalary = (salaryPotential, readinessScore) => {
  const entry = salaryPotential?.entryLevel || { min: 90000, max: 180000 };
  const mid = salaryPotential?.midLevel || { min: 180000, max: 350000 };
  const senior = salaryPotential?.seniorLevel || { min: 350000, max: 700000 };

  if (readinessScore >= 82) {
    return Math.round(mid.min + (readinessScore - 82) / 18 * (mid.max - mid.min));
  }
  if (readinessScore >= 55) {
    return Math.round(entry.min + (readinessScore - 55) / 27 * (entry.max - entry.min));
  }
  return Math.round(entry.min * 0.75);
};

const buildTimeline = (career, readiness, timelineMonths) => {
  const steps = career.pathwaySteps?.length ? career.pathwaySteps : [
    { step: 1, title: 'Foundation', durationMonths: 2, description: 'Build the missing fundamentals and validate the career direction.' },
    { step: 2, title: 'Portfolio Prototype', durationMonths: 3, description: 'Create a practical demo using local data or a local customer problem.' },
    { step: 3, title: 'Pilot', durationMonths: 2, description: 'Test with a real user and measure business value.' },
    { step: 4, title: 'Commercial Launch', durationMonths: 3, description: 'Package pricing, support, and sales material.' },
  ];
  const baseTotal = steps.reduce((sum, step) => sum + (step.durationMonths || 1), 0) || 1;
  const scale = Math.max(0.5, (Number(timelineMonths) || baseTotal) / baseTotal);

  let elapsed = 0;
  return steps.map((step, index) => {
    const duration = Math.max(1, Math.round((step.durationMonths || 1) * scale));
    const startMonth = elapsed + 1;
    elapsed += duration;

    return {
      step: step.step || index + 1,
      title: step.title,
      description: step.description,
      durationMonths: duration,
      startMonth,
      endMonth: elapsed,
      status: readiness.readinessScore > 78 && index === 0 ? 'accelerated' : 'planned',
      milestones: step.milestones || [],
    };
  });
};

const buildCommercialProjection = (career) => {
  const prototype = career.prototypeIdeas?.[0] || {};
  const buildCostLkr = prototype.buildCostLkr || 40000;
  const learningCostLkr = [
    ...(career.learningResources || []).map(resource => resource.costLkr || 0),
    ...(career.certifications || []).map(cert => cert.cost || 0),
  ].reduce((sum, cost) => sum + cost, 0);
  const pilotRevenueLowLkr = Math.round(Math.max(25000, buildCostLkr * 0.35));
  const pilotRevenueHighLkr = Math.round(Math.max(75000, buildCostLkr * 1.1));
  const breakEvenMonths = Math.max(1, Math.ceil((buildCostLkr + learningCostLkr) / Math.max(pilotRevenueLowLkr, 1)));

  return {
    prototypeTitle: prototype.title || `${career.title} pilot product`,
    scientificPrinciple: prototype.scientificPrinciple || 'Evidence-based skill, market, and pathway modelling.',
    targetCustomer: prototype.targetCustomer || career.marketSignal?.employerTypes?.[0] || 'Sri Lankan SMEs and education providers',
    buildCostLkr,
    learningCostLkr,
    totalInvestmentLkr: buildCostLkr + learningCostLkr,
    pilotRevenueLowLkr,
    pilotRevenueHighLkr,
    breakEvenMonths,
    revenueModel: prototype.revenueModel || 'Setup fee plus monthly support subscription',
  };
};

router.post('/run', optionalAuth, async (req, res) => {
  try {
    const { careerId, currentSkills = [], timelineMonths = 12 } = req.body;
    if (!careerId) {
      return res.status(400).json({ success: false, error: 'careerId is required' });
    }

    const career = await CareerPath.findById(careerId).lean();
    if (!career) {
      return res.status(404).json({ success: false, error: 'Career path not found' });
    }

    const assessmentSkills = await getLatestAssessmentSkills(req.user?.id);
    const skillMap = buildSkillMap(currentSkills.length ? currentSkills : assessmentSkills);
    const readiness = computeReadiness(career, skillMap);
    const projectedSalaryLkrMonthly = projectSalary(career.salaryPotential, readiness.readinessScore);
    const monthsToReady = Math.max(2, Math.min(18, Math.ceil(readiness.missingEffort * 0.25)));
    const simulationTimeline = buildTimeline(career, readiness, Number(timelineMonths) || 12);
    const commercialProjection = buildCommercialProjection(career);

    res.json({
      success: true,
      data: {
        career: {
          id: career._id,
          title: career.title,
          industry: career.industry,
          growthRate: career.growthRate,
          demandLevel: career.demandLevel,
          marketSignal: career.marketSignal,
          salaryPotential: career.salaryPotential,
        },
        currency: 'LKR',
        readinessScore: readiness.readinessScore,
        skillScore: readiness.skillScore,
        marketScore: readiness.marketScore,
        commercialScore: readiness.commercialScore,
        matchedSkills: readiness.matchedSkills,
        gapSkills: readiness.gapSkills,
        monthsToReady,
        projectedSalaryLkrMonthly,
        salaryBandsLkrMonthly: {
          entry: career.salaryPotential?.entryLevel,
          mid: career.salaryPotential?.midLevel,
          senior: career.salaryPotential?.seniorLevel,
        },
        simulationTimeline,
        learningResources: career.learningResources || [],
        certifications: career.certifications || [],
        commercialProjection,
        businessUseCases: career.marketSignal?.businessUseCases || [],
        dataSources: career.marketSignal?.dataSources || [],
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
