const express = require('express');
const router = express.Router();
const { param, query, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const {
  getGitHubAnalysis,
  isValidGitHubUsername,
  toAssessmentGithubData,
  GITHUB_USERNAME_PATTERN,
} = require('../services/githubService');
const Assessment = require('../models/Assessment');
const User = require('../models/User');

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
      .matches(GITHUB_USERNAME_PATTERN).withMessage('Invalid GitHub username format'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { username } = req.params;

    try {
      const { analysis, cached } = await getGitHubAnalysis(username);
      res.json({ success: true, cached, data: analysis });
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
  // Same rules as the public analyze route; the username is interpolated into GitHub API URLs
  if (!isValidGitHubUsername(username)) {
    return res.status(400).json({ success: false, error: 'Invalid GitHub username format' });
  }

  try {
    const { analysis } = await getGitHubAnalysis(username);
    const githubData = toAssessmentGithubData(analysis);

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
