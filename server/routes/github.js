const express = require('express');
const router = express.Router();
const { param, query, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const { analyzeGitHubProfile } = require('../services/githubService');
const Assessment = require('../models/Assessment');
const User = require('../models/User');

// ── In-memory cache: username → { data, cachedAt } ───────────────
const cache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

const getCached = (username) => {
  const entry = cache.get(username.toLowerCase());
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
    cache.delete(username.toLowerCase());
    return null;
  }
  return entry.data;
};

const setCache = (username, data) => {
  cache.set(username.toLowerCase(), { data, cachedAt: Date.now() });
};

// ─────────────────────────────────────────────────────────────────
// @GET /api/github/analyze/:username
// Public endpoint — analyze a GitHub profile without saving
// ─────────────────────────────────────────────────────────────────
router.get(
  '/analyze/:username',
  [
    param('username')
      .trim()
      .notEmpty().withMessage('GitHub username is required')
      .isLength({ max: 39 }).withMessage('Invalid GitHub username length')
      .matches(/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/).withMessage('Invalid GitHub username format'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { username } = req.params;

    // Return cached result if fresh
    const cached = getCached(username);
    if (cached) {
      return res.json({ success: true, cached: true, data: cached });
    }

    try {
      const analysis = await analyzeGitHubProfile(username);
      setCache(username, analysis);
      res.json({ success: true, cached: false, data: analysis });
    } catch (err) {
      const status = err.message.includes('not found') ? 404
        : err.message.includes('rate limit') ? 429
        : 500;
      res.status(status).json({ success: false, error: err.message });
    }
  }
);

// ─────────────────────────────────────────────────────────────────
// @POST /api/github/extract-and-save
// Protected — analyze GitHub and save result to Assessment + User
// ─────────────────────────────────────────────────────────────────
router.post('/extract-and-save', protect, async (req, res) => {
  const { username } = req.body;
  if (!username || typeof username !== 'string') {
    return res.status(400).json({ success: false, error: 'GitHub username is required' });
  }

  try {
    // Use cache if available
    let analysis = getCached(username);
    if (!analysis) {
      analysis = await analyzeGitHubProfile(username);
      setCache(username, analysis);
    }

    // ── Build githubData object matching Assessment schema ────────
    const githubData = {
      username: analysis.profile.username,
      profileUrl: analysis.profile.profileUrl,
      publicRepos: analysis.profile.publicRepos,
      followers: analysis.profile.followers,
      topLanguages: analysis.topLanguages.map(l => ({
        language: l.language,
        percentage: l.percentage,
      })),
      pinnedRepos: analysis.pinnedRepos,
      contributionScore: analysis.technicalAptitudeScore,
      fetchedAt: new Date(),
    };

    // ── Find or create latest draft assessment ────────────────────
    let assessment = await Assessment.findOne({
      user: req.user.id,
      status: { $in: ['draft', 'in-progress'] },
    }).sort({ createdAt: -1 });

    if (!assessment) {
      assessment = new Assessment({
        user: req.user.id,
        status: 'in-progress',
      });
    }

    // ── Save GitHub data ──────────────────────────────────────────
    assessment.githubData = githubData;

    // ── Merge extracted interests (deduplicated) ──────────────────
    const existingInterests = assessment.extractedInterests || [];
    const merged = [...new Set([...existingInterests, ...analysis.primaryInterests])];
    assessment.extractedInterests = merged;

    await assessment.save();

    // ── Update User profile with GitHub URL + interests ───────────
    await User.findByIdAndUpdate(req.user.id, {
      githubUrl: analysis.profile.profileUrl,
      $addToSet: { assessments: assessment._id },
      // Merge interests without duplicates
      interests: merged,
    });

    res.json({
      success: true,
      message: 'GitHub profile analyzed and saved to your assessment',
      data: {
        technicalAptitudeScore: analysis.technicalAptitudeScore,
        scoreBreakdown: analysis.scoreBreakdown,
        topLanguages: analysis.topLanguages,
        primaryInterests: analysis.primaryInterests,
        profile: analysis.profile,
        pinnedRepos: analysis.pinnedRepos,
        assessmentId: assessment._id,
      },
    });
  } catch (err) {
    const status = err.message.includes('not found') ? 404
      : err.message.includes('rate limit') ? 429
      : 500;
    res.status(status).json({ success: false, error: err.message });
  }
});

module.exports = router;
