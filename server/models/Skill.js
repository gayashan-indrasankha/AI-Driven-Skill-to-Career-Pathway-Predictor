const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    category: {
      type: String,
      enum: ['technical', 'soft', 'domain', 'tool', 'language', 'framework'],
      required: true,
    },
    description: { type: String, default: '' },
    demandScore: { type: Number, min: 0, max: 100, default: 50 },
    relatedCareers: [{ type: String }],
    tags: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Skill', skillSchema);
