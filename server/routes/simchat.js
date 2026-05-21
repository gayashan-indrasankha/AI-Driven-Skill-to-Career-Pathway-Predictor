const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { generateScenario, evaluateAnswer } = require('../services/geminiService');
const Assessment = require('../models/Assessment');

// ── In-memory session store: userId → { career, scenario, history, cumulativeScore, rounds } ──
const sessions = new Map();

// ─────────────────────────────────────────────────────────────────
// @POST /api/simchat/start
// Start a simulation session for a given career
// ─────────────────────────────────────────────────────────────────
router.post('/start', protect, async (req, res) => {
  const { career } = req.body;
  if (!career) return res.status(400).json({ success: false, error: 'Career name is required' });

  try {
    const scenario = await generateScenario(career);

    const session = {
      career,
      scenario,
      history: [],
      cumulativeScore: 0,
      rounds: 0,
      startedAt: new Date(),
    };
    sessions.set(req.user.id, session);

    res.json({
      success: true,
      data: {
        situation: scenario.situation,
        challenge: scenario.challenge,
        context: scenario.context,
        difficulty: scenario.difficulty,
        career,
        sessionStarted: true,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// @POST /api/simchat/answer
// Submit user answer → get AI evaluation + score
// ─────────────────────────────────────────────────────────────────
router.post('/answer', protect, async (req, res) => {
  const { answer } = req.body;
  if (!answer?.trim()) return res.status(400).json({ success: false, error: 'Answer is required' });

  const session = sessions.get(req.user.id);
  if (!session) return res.status(400).json({ success: false, error: 'No active session. Call /start first.' });

  try {
    const evaluation = await evaluateAnswer(session.career, session.scenario, answer.trim());

    // Track cumulative score
    session.history.push({ answer: answer.trim(), evaluation, timestamp: new Date() });
    session.cumulativeScore = Math.round(
      (session.cumulativeScore * session.rounds + evaluation.score) / (session.rounds + 1)
    );
    session.rounds += 1;

    // Persist aptitude score to latest Assessment
    const assessment = await Assessment.findOne({ user: req.user.id }).sort({ createdAt: -1 });
    if (assessment) {
      // Add/update simulation aptitude in githubData contributionScore
      assessment.githubData = {
        ...(assessment.githubData?.toObject?.() || assessment.githubData || {}),
        contributionScore: Math.round((assessment.githubData?.contributionScore || 50) * 0.6 + session.cumulativeScore * 0.4),
      };
      await assessment.save();
    }

    res.json({
      success: true,
      data: {
        ...evaluation,
        sessionScore: session.cumulativeScore,
        rounds: session.rounds,
        savedToProfile: !!assessment,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// @POST /api/simchat/next
// Generate next scenario (continue the session)
// ─────────────────────────────────────────────────────────────────
router.post('/next', protect, async (req, res) => {
  const session = sessions.get(req.user.id);
  if (!session) return res.status(400).json({ success: false, error: 'No active session' });

  try {
    const scenario = await generateScenario(session.career);
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

// ─────────────────────────────────────────────────────────────────
// @GET /api/simchat/history
// Get current session history
// ─────────────────────────────────────────────────────────────────
router.get('/history', protect, (req, res) => {
  const session = sessions.get(req.user.id);
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
