const mongoose = require('mongoose');

// ── Personality Trait sub-schema (Big Five / MBTI-style) ─────────
const personalityTraitSchema = new mongoose.Schema({
  trait: {
    type: String,
    enum: ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism',
           'analytical', 'creative', 'leadership', 'empathy', 'detail-oriented', 'risk-tolerance'],
    required: true,
  },
  score: { type: Number, min: 0, max: 100, required: true },   // 0–100 percentile
  label: { type: String, default: '' },                         // e.g. "High", "Moderate"
}, { _id: false });

// ── GitHub / Portfolio data sub-schema ──────────────────────────
const githubDataSchema = new mongoose.Schema({
  username: { type: String, default: '' },
  profileUrl: { type: String, default: '' },
  publicRepos: { type: Number, default: 0 },
  followers: { type: Number, default: 0 },
  topLanguages: [{ language: String, percentage: Number }],    // e.g. [{language:'Python',percentage:65}]
  pinnedRepos: [
    {
      name: String,
      description: String,
      stars: Number,
      language: String,
      url: String,
    },
  ],
  contributionScore: { type: Number, default: 0 },             // derived activity score
  fetchedAt: { type: Date },
}, { _id: false });

const portfolioDataSchema = new mongoose.Schema({
  url: { type: String, default: '' },
  projectCount: { type: Number, default: 0 },
  technologies: [{ type: String }],                            // tech stack mentioned
  hasLiveProjects: { type: Boolean, default: false },
  summary: { type: String, default: '' },                      // AI-extracted summary
}, { _id: false });

// ── Quiz Result sub-schema ───────────────────────────────────────
const quizAnswerSchema = new mongoose.Schema({
  questionId: { type: String, required: true },
  questionText: { type: String },
  selectedOption: { type: String },
  score: { type: Number, default: 0 },                         // points scored on this question
  category: { type: String },                                  // e.g. "logical", "creative", "technical"
}, { _id: false });

// ── Skill self-rating sub-schema ─────────────────────────────────
const skillRatingSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, enum: ['technical', 'soft', 'domain', 'tool', 'language', 'framework'] },
  proficiency: { type: Number, min: 1, max: 5, required: true }, // 1=Beginner 5=Expert
  yearsUsed: { type: Number, default: 0 },
}, { _id: false });

// ── Main Assessment schema ────────────────────────────────────────
const assessmentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    // ── Personality ───────────────────────────────────────────────
    personalityTraits: [personalityTraitSchema],
    dominantPersonalityType: { type: String, default: '' },     // e.g. "INTJ", "Analytical-Creative"

    // ── External Profile Data ─────────────────────────────────────
    githubData: githubDataSchema,
    portfolioData: portfolioDataSchema,

    // ── Quiz ──────────────────────────────────────────────────────
    quizResults: {
      answers: [quizAnswerSchema],
      totalScore: { type: Number, default: 0 },
      maxPossibleScore: { type: Number, default: 0 },
      percentile: { type: Number, default: 0 },
      categoryBreakdown: [
        {
          category: String,
          score: Number,
          maxScore: Number,
          percentage: Number,
        },
      ],
      timeTakenSeconds: { type: Number, default: 0 },
      completedAt: { type: Date },
    },

    // ── Skills & Interests ────────────────────────────────────────
    skillRatings: [skillRatingSchema],
    extractedInterests: [{ type: String }],                     // AI-inferred from all inputs
    careerGoals: [{ type: String }],
    workPreferences: {
      style: { type: String, enum: ['remote', 'hybrid', 'on-site', 'flexible', ''] },
      teamSize: { type: String, enum: ['solo', 'small', 'medium', 'large', 'any', ''] },
      industry: [{ type: String }],
      salaryExpectation: { min: Number, max: Number, currency: { type: String, default: 'USD' } },
    },

    // ── AI Predictions ────────────────────────────────────────────
    predictedCareers: [
      {
        careerPath: { type: mongoose.Schema.Types.ObjectId, ref: 'CareerPath' },
        matchScore: { type: Number, min: 0, max: 100 },
        confidenceLevel: { type: String, enum: ['low', 'medium', 'high', 'very-high'] },
        gapSkills: [{ type: String }],
        strengths: [{ type: String }],
        estimatedTimeToReady: { type: String },                 // e.g. "6–12 months"
      },
    ],

    // ── Status ────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ['draft', 'in-progress', 'completed', 'analyzed'],
      default: 'draft',
    },
    version: { type: Number, default: 1 },                      // track assessment iterations
  },
  { timestamps: true }
);

assessmentSchema.index({ user: 1, createdAt: -1 });
assessmentSchema.index({ status: 1 });

module.exports = mongoose.model('Assessment', assessmentSchema);
