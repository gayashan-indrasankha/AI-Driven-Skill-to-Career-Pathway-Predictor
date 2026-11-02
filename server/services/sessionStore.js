const ChatSession = require('../models/ChatSession');

// Small key/value store for chat state. Each write slides the expiry forward.
const getSession = async (key) => {
  const session = await ChatSession.findOne({ key, expiresAt: { $gt: new Date() } }).lean();
  return session ? session.data : null;
};

const saveSession = async (key, data, ttlMs) => {
  await ChatSession.updateOne(
    { key },
    { $set: { data, expiresAt: new Date(Date.now() + ttlMs) } },
    { upsert: true }
  );
};

const deleteSession = async (key) => {
  await ChatSession.deleteOne({ key });
};

module.exports = { getSession, saveSession, deleteSession };
