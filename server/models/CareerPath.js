const mongoose = require('mongoose');

const degreeSchema = new mongoose.Schema({
  level: {
    type: String,
    enum: ['none', 'high-school', 'associate', 'bachelor', 'master', 'phd', 'bootcamp', 'self-taught'],
    required: true,
  },
  field: { type: String, default: '' },
  isRequired: { type: Boolean, default: true },
  alternatives: [{ type: String }],
}, { _id: false });

const certificationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  issuer: { type: String, default: '' },
  url: { type: String, default: '' },
  isRequired: { type: Boolean, default: false },
  difficultyLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'] },
  estimatedPrepTime: { type: String, default: '' },
  cost: { type: Number, default: 0 },
}, { _id: false });

const salarySchema = new mongoose.Schema({
  entryLevel: { min: Number, max: Number },
  midLevel: { min: Number, max: Number },
  seniorLevel: { min: Number, max: Number },
  currency: { type: String, default: 'LKR' },
  region: { type: String, default: 'Sri Lanka' },
  lastUpdated: { type: Date, default: Date.now },
}, { _id: false });

const roleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  level: { type: String, enum: ['entry', 'junior', 'mid', 'senior', 'lead', 'principal', 'executive'] },
  description: { type: String, default: '' },
  commonEmployers: [{ type: String }],
}, { _id: false });

const skillRequirementSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, enum: ['technical', 'soft', 'domain', 'tool', 'language', 'framework'] },
  importance: { type: Number, min: 1, max: 5 },
  proficiencyRequired: { type: Number, min: 1, max: 5 },
}, { _id: false });

const sourceSchema = new mongoose.Schema({
  label: { type: String, required: true },
  url: { type: String, default: '' },
}, { _id: false });

const marketSignalSchema = new mongoose.Schema({
  sriLankaDemandScore: { type: Number, min: 0, max: 100, default: 50 },
  globalDemandScore: { type: Number, min: 0, max: 100, default: 50 },
  employerTypes: [{ type: String }],
  localSalaryLkrMonthly: {
    entry: { min: Number, max: Number },
    mid: { min: Number, max: Number },
    senior: { min: Number, max: Number },
  },
  businessUseCases: [{ type: String }],
  commercialValue: { type: String, default: '' },
  evidenceSummary: { type: String, default: '' },
  dataSources: [sourceSchema],
}, { _id: false });

const learningResourceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  provider: { type: String, default: '' },
  url: { type: String, default: '' },
  costLkr: { type: Number, default: 0 },
  durationWeeks: { type: Number, default: 0 },
}, { _id: false });

const prototypeIdeaSchema = new mongoose.Schema({
  title: { type: String, required: true },
  scientificPrinciple: { type: String, default: '' },
  targetCustomer: { type: String, default: '' },
  buildCostLkr: { type: Number, default: 0 },
  revenueModel: { type: String, default: '' },
}, { _id: false });

const careerPathSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true },
    industry: { type: String, required: true, trim: true },
    subIndustry: { type: String, default: '' },
    tags: [{ type: String }],

    roles: [roleSchema],
    entryRoleTitle: { type: String, default: '' },
    seniorRoleTitle: { type: String, default: '' },

    requiredDegrees: [degreeSchema],
    degreeMandatory: { type: Boolean, default: false },
    certifications: [certificationSchema],

    requiredSkills: [skillRequirementSchema],
    niceToHaveSkills: [{ type: String }],
    salaryPotential: salarySchema,

    demandLevel: { type: String, enum: ['low', 'medium', 'high', 'very-high'], default: 'medium' },
    growthRate: { type: Number, default: 0 },
    jobOpenings: { type: Number, default: 0 },
    futureOutlook: { type: String, enum: ['declining', 'stable', 'growing', 'booming'], default: 'growing' },
    automationRisk: { type: Number, min: 0, max: 100, default: 20 },
    marketSignal: marketSignalSchema,
    learningResources: [learningResourceSchema],
    prototypeIdeas: [prototypeIdeaSchema],

    workType: { type: String, enum: ['remote', 'hybrid', 'on-site', 'flexible'], default: 'hybrid' },
    teamEnvironment: { type: String, enum: ['solo', 'small-team', 'large-team', 'varies'], default: 'varies' },

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

    relatedPaths: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CareerPath' }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

careerPathSchema.pre('save', function () {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
});

careerPathSchema.index({ title: 'text', description: 'text', tags: 'text' });
careerPathSchema.index({ industry: 1, demandLevel: 1 });
careerPathSchema.index({ 'marketSignal.sriLankaDemandScore': -1 });

module.exports = mongoose.model('CareerPath', careerPathSchema);
