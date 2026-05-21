const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const gradeSchema = new mongoose.Schema({
  subject: { type: String, required: true, trim: true },
  grade: { type: String, required: true, trim: true },      // e.g. "A", "B+", "85%"
  gradePoint: { type: Number, min: 0, max: 4.0 },           // GPA scale
  level: { type: String, enum: ['high-school', 'undergraduate', 'postgraduate'], default: 'undergraduate' },
  year: { type: Number },
}, { _id: false });

const userSchema = new mongoose.Schema(
  {
    // ── Basic Info ───────────────────────────────────────────────
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 100 },
    email: { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true, match: [/^\S+@\S+\.\S+$/, 'Invalid email format'] },
    password: { type: String, required: [true, 'Password is required'], minlength: 6, select: false },
    avatar: { type: String, default: '' },
    phone: { type: String, default: '' },
    location: { type: String, default: '' },
    bio: { type: String, maxlength: 500, default: '' },
    dateOfBirth: { type: Date },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },

    // ── Education & Grades ───────────────────────────────────────
    educationLevel: {
      type: String,
      enum: ['high-school', 'associate', 'bachelor', 'master', 'phd', 'self-taught', 'other'],
      default: 'bachelor',
    },
    institution: { type: String, trim: true, default: '' },
    fieldOfStudy: { type: String, trim: true, default: '' },
    graduationYear: { type: Number },
    gpa: { type: Number, min: 0, max: 4.0 },
    grades: [gradeSchema],                                   // Per-subject grade records

    // ── Extracted Interests ──────────────────────────────────────
    interests: [{ type: String, trim: true }],               // AI-extracted or user-provided interests
    preferredIndustries: [{ type: String, trim: true }],
    workStyle: { type: String, enum: ['remote', 'hybrid', 'on-site', 'flexible', ''], default: '' },
    yearsOfExperience: { type: Number, default: 0, min: 0 },

    // ── Linked Profiles ──────────────────────────────────────────
    githubUrl: { type: String, default: '' },
    portfolioUrl: { type: String, default: '' },
    linkedinUrl: { type: String, default: '' },

    // ── Assessment History ───────────────────────────────────────
    assessments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Assessment' }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ── Password hashing ─────────────────────────────────────────────
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// ── Strip password from JSON output ──────────────────────────────
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// ── Indexes ───────────────────────────────────────────────────────
userSchema.index({ interests: 1 });

module.exports = mongoose.model('User', userSchema);
