const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { generateScenario, evaluateAnswer } = require('../services/geminiService');
const { getSession, saveSession } = require('../services/sessionStore');
const { optionalAuth } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimit');
const Assessment = require('../models/Assessment');
const CareerPath = require('../models/CareerPath');

const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 1 day
const MAX_CAREER_LENGTH = 120;
const MAX_ANSWER_LENGTH = 4000;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Signed-in users have one simulation per account. Anonymous users get a random session id
// from /start and send it back, so visitors sharing an IP (school/office Wi-Fi) stay separate.
const sessionKeyFor = (req, sessionId) => {
  if (req.user?.id) return `simchat:user:${req.user.id}`;
  if (typeof sessionId === 'string' && UUID_PATTERN.test(sessionId)) return `simchat:anon:${sessionId}`;
  return null;
};

const loadSession = async (req, sessionId) => {
  const key = sessionKeyFor(req, sessionId);
  return key ? { key, session: await getSession(key) } : { key: null, session: null };
};

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

router.post('/start', optionalAuth, aiLimiter, async (req, res) => {
  const { career } = req.body;
  if (typeof career !== 'string' || !career.trim()) {
    return res.status(400).json({ success: false, error: 'Career name is required' });
  }
  if (career.length > MAX_CAREER_LENGTH) {
    return res.status(400).json({ success: false, error: 'Career name is too long' });
  }

  try {
    const careerPath = await findCareerContext(career);
    const scenario = await generateScenario(careerPath?.title || career, careerPath?.marketSignal || {});

    const sessionId = req.user?.id ? null : crypto.randomUUID();
    await saveSession(sessionKeyFor(req, sessionId), {
      career: careerPath?.title || career,
      careerPathId: careerPath?._id?.toString() || null,
      scenario,
      history: [],
      cumulativeScore: 0,
      rounds: 0,
      startedAt: new Date(),
    }, SESSION_TTL_MS);

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
        sessionId,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/answer', optionalAuth, aiLimiter, async (req, res) => {
  const { answer, sessionId } = req.body;
  if (typeof answer !== 'string' || !answer.trim()) {
    return res.status(400).json({ success: false, error: 'Answer is required' });
  }
  if (answer.length > MAX_ANSWER_LENGTH) {
    return res.status(400).json({ success: false, error: `Answer must be under ${MAX_ANSWER_LENGTH} characters` });
  }

  try {
    const { key, session } = await loadSession(req, sessionId);
    if (!session) return res.status(400).json({ success: false, error: 'No active session. Start a simulation first.' });

    const evaluation = await evaluateAnswer(session.career, session.scenario, answer.trim());

    session.history.push({ answer: answer.trim(), evaluation, timestamp: new Date() });
    session.cumulativeScore = Math.round(
      (session.cumulativeScore * session.rounds + evaluation.score) / (session.rounds + 1)
    );
    session.rounds += 1;
    await saveSession(key, session, SESSION_TTL_MS);

    // Recorded in its own field so it never alters the GitHub aptitude score
    let savedToProfile = false;
    if (req.user?.id) {
      const result = await Assessment.findOneAndUpdate(
        { user: req.user.id, status: 'analyzed' },
        {
          simulationResults: {
            career: session.career,
            averageScore: session.cumulativeScore,
            rounds: session.rounds,
            updatedAt: new Date(),
          },
        },
        { sort: { createdAt: -1 } }
      );
      savedToProfile = !!result;
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

router.post('/next', optionalAuth, aiLimiter, async (req, res) => {
  try {
    const { key, session } = await loadSession(req, req.body?.sessionId);
    if (!session) return res.status(400).json({ success: false, error: 'No active session' });

    const careerPath = session.careerPathId ? await CareerPath.findById(session.careerPathId).lean() : null;
    const scenario = await generateScenario(session.career, careerPath?.marketSignal || {});
    session.scenario = scenario;
    await saveSession(key, session, SESSION_TTL_MS);

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

router.get('/history', optionalAuth, async (req, res) => {
  try {
    const { session } = await loadSession(req, req.query.sessionId);
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
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
