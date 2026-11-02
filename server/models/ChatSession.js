const mongoose = require('mongoose');

// Conversation state for PathGuide AI chat and the scenario simulator, stored in MongoDB
// so it survives server restarts. MongoDB's TTL monitor deletes expired sessions.
const chatSessionSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },     // e.g. "nexus:<userId>", "simchat:anon:<uuid>"
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true, minimize: false }
);

chatSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('ChatSession', chatSessionSchema);
