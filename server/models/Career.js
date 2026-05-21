const mongoose = require('mongoose');

const careerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, unique: true, trim: true },
    description: { type: String, required: true },
    industry: { type: String, required: true },
    requiredSkills: [{ skill: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill' }, importance: { type: Number, min: 1, max: 5 } }],
    averageSalary: { min: Number, max: Number, currency: { type: String, default: 'USD' } },
    growthRate: { type: Number, default: 0 },
    demandLevel: { type: String, enum: ['low', 'medium', 'high', 'very-high'], default: 'medium' },
    workType: { type: String, enum: ['remote', 'hybrid', 'on-site', 'flexible'], default: 'hybrid' },
    educationLevel: { type: String, enum: ['high-school', 'associate', 'bachelor', 'master', 'phd', 'none'], default: 'bachelor' },
    pathwaySteps: [{ step: Number, title: String, description: String, duration: String }],
    tags: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Career', careerSchema);
