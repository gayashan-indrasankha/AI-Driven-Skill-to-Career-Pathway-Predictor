const mongoose = require('mongoose');

// ── Required Degree sub-schema ────────────────────────────────────
const degreeSchema = new mongoose.Schema({
  level: {
    type: String,
    enum: ['none', 'high-school', 'associate', 'bachelor', 'master', 'phd', 'bootcamp', 'self-taught'],
    required: true,
  },
  field: { type: String, default: '' },        // e.g. "Computer Science", "Business"
  isRequired: { type: Boolean, default: true },
  alternatives: [{ type: String }],            // alternative fields accepted
}, { _id: false });

// ── Certification sub-schema ──────────────────────────────────────
const certificationSchema = new mongoose.Schema({
  name: { type: String, required: true },      // e.g. "AWS Certified Solutions Architect"
  issuer: { type: String, default: '' },       // e.g. "Amazon Web Services"
  url: { type: String, default: '' },
  isRequired: { type: Boolean, default: false },
  difficultyLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'] },
  estimatedPrepTime: { type: String, default: '' }, // e.g. "3–6 months"
  cost: { type: Number, default: 0 },              // approximate USD cost
}, { _id: false });

// ── Salary sub-schema ─────────────────────────────────────────────
const salarySchema = new mongoose.Schema({
  entryLevel: { min: Number, max: Number },
  midLevel: { min: Number, max: Number },
  seniorLevel: { min: Number, max: Number },
  currency: { type: String, default: 'USD' },
  region: { type: String, default: 'Global' },     // e.g. "USA", "Europe", "India"
  lastUpdated: { type: Date, default: Date.now },
}, { _id: false });

// ── Career Role sub-schema ────────────────────────────────────────
const roleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  level: { type: String, enum: ['entry', 'junior', 'mid', 'senior', 'lead', 'principal', 'executive'] },
  description: { type: String, default: '' },
  commonEmployers: [{ type: String }],
}, { _id: false });

// ── Skill requirement sub-schema ──────────────────────────────────
const skillRequirementSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, enum: ['technical', 'soft', 'domain', 'tool', 'language', 'framework'] },
  importance: { type: Number, min: 1, max: 5 },    // 5 = critical, 1 = nice-to-have
  proficiencyRequired: { type: Number, min: 1, max: 5 },
}, { _id: false });

// ── Main CareerPath schema ────────────────────────────────────────
const careerPathSchema = new mongoose.Schema(
  {
    // ── Identity ──────────────────────────────────────────────────
    title: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true },
    industry: { type: String, required: true, trim: true },
    subIndustry: { type: String, default: '' },
    tags: [{ type: String }],

    // ── Roles ─────────────────────────────────────────────────────
    roles: [roleSchema],                             // career progression roles
    entryRoleTitle: { type: String, default: '' },   // first role someone would hold
    seniorRoleTitle: { type: String, default: '' },  // top role in this path

    // ── Education Requirements ────────────────────────────────────
    requiredDegrees: [degreeSchema],
    degreeMandatory: { type: Boolean, default: false }, // can be entered without degree?

    // ── Certifications ────────────────────────────────────────────
    certifications: [certificationSchema],

    // ── Skills ────────────────────────────────────────────────────
    requiredSkills: [skillRequirementSchema],
    niceToHaveSkills: [{ type: String }],

    // ── Salary Potential ──────────────────────────────────────────
    salaryPotential: salarySchema,

    // ── Market Data ───────────────────────────────────────────────
    demandLevel: { type: String, enum: ['low', 'medium', 'high', 'very-high'], default: 'medium' },
    growthRate: { type: Number, default: 0 },         // annual % growth
    jobOpenings: { type: Number, default: 0 },        // approximate global openings
    futureOutlook: { type: String, enum: ['declining', 'stable', 'growing', 'booming'], default: 'growing' },
    automationRisk: { type: Number, min: 0, max: 100, default: 20 }, // % risk of automation

    // ── Work Environment ──────────────────────────────────────────
    workType: { type: String, enum: ['remote', 'hybrid', 'on-site', 'flexible'], default: 'hybrid' },
    teamEnvironment: { type: String, enum: ['solo', 'small-team', 'large-team', 'varies'], default: 'varies' },

    // ── Pathway Steps ─────────────────────────────────────────────
    pathwaySteps: [
      {
        step: { type: Number, required: true },
        title: { type: String, required: true },
        description: { type: String },
        durationMonths: { type: Number },
        milestones: [{ type: String }],
        resources: [{ title: String, url: String, type: String }],
      },
    ],

    // ── Related Paths ─────────────────────────────────────────────
    relatedPaths: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CareerPath' }],

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ── Auto-generate slug from title ─────────────────────────────────
careerPathSchema.pre('save', function () {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
});


// ── Indexes ───────────────────────────────────────────────────────
careerPathSchema.index({ title: 'text', description: 'text', tags: 'text' });
careerPathSchema.index({ industry: 1, demandLevel: 1 });


module.exports = mongoose.model('CareerPath', careerPathSchema);
