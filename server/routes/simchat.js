const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { generateScenario, evaluateAnswer } = require('../services/geminiService');
const Assessment = require('../models/Assessment');
const CareerPath = require('../models/CareerPath');

const sessions = new Map();

const optionalAuth = (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    } catch {
      req.user = null;
    }
  }
  next();
};

const sessionKey = (req) => req.user?.id || req.ip || 'demo-session';

const findCareerContext = async (career) => {
  if (!career) return null;
  const normalized = career.trim();
  return CareerPath.findOne({
    $or: [
      { title: new RegExp(normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
      { slug: normalized.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') },
    ],
  }).lean();
};

router.post('/start', optionalAuth, async (req, res) => {
  const { career } = req.body;
  if (!career) return res.status(400).json({ success: false, error: 'Career name is required' });

  try {
    const careerPath = await findCareerContext(career);
    const scenario = await generateScenario(careerPath?.title || career, careerPath?.marketSignal || {});

    sessions.set(sessionKey(req), {
      career: careerPath?.title || career,
      careerPathId: careerPath?._id,
      scenario,
      history: [],
      cumulativeScore: 0,
      rounds: 0,
      startedAt: new Date(),
    });

    res.json({
      success: true,
      data: {
        situation: scenario.situation,
        challenge: scenario.challenge,
        context: scenario.context,
        difficulty: scenario.difficulty,
        career: careerPath?.title || career,
        marketSignal: careerPath?.marketSignal,
        sessionStarted: true,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/answer', optionalAuth, async (req, res) => {
  const { answer } = req.body;
  if (!answer?.trim()) return res.status(400).json({ success: false, error: 'Answer is required' });

  const session = sessions.get(sessionKey(req));
  if (!session) return res.status(400).json({ success: false, error: 'No active session. Start a simulation first.' });

  try {
    const evaluation = await evaluateAnswer(session.career, session.scenario, answer.trim());

    session.history.push({ answer: answer.trim(), evaluation, timestamp: new Date() });
    session.cumulativeScore = Math.round(
      (session.cumulativeScore * session.rounds + evaluation.score) / (session.rounds + 1)
    );
    session.rounds += 1;

    let savedToProfile = false;
    if (req.user?.id) {
      const assessment = await Assessment.findOne({ user: req.user.id }).sort({ createdAt: -1 });
      if (assessment) {
        assessment.githubData = {
          ...(assessment.githubData?.toObject?.() || assessment.githubData || {}),
          contributionScore: Math.round((assessment.githubData?.contributionScore || 50) * 0.6 + session.cumulativeScore * 0.4),
        };
        await assessment.save();
        savedToProfile = true;
      }
    }

    res.json({
      success: true,
      data: {
        ...evaluation,
        sessionScore: session.cumulativeScore,
        rounds: session.rounds,
        savedToProfile,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/next', optionalAuth, async (req, res) => {
  const session = sessions.get(sessionKey(req));
  if (!session) return res.status(400).json({ success: false, error: 'No active session' });

  try {
    const careerPath = session.careerPathId ? await CareerPath.findById(session.careerPathId).lean() : null;
    const scenario = await generateScenario(session.career, careerPath?.marketSignal || {});
    session.scenario = scenario;

    res.json({
      success: true,
      data: {
        situation: scenario.situation,
        challenge: scenario.challenge,
        context: scenario.context,
        difficulty: scenario.difficulty,
        sessionScore: session.cumulativeScore,
        rounds: session.rounds,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/history', optionalAuth, (req, res) => {
  const session = sessions.get(sessionKey(req));
  if (!session) return res.json({ success: true, data: null });
  res.json({
    success: true,
    data: {
      career: session.career,
      rounds: session.rounds,
      cumulativeScore: session.cumulativeScore,
      history: session.history,
    },
  });
});

module.exports = router;
