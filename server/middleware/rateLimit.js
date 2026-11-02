// Minimal fixed-window rate limiter (in-memory, per process).
// Keyed by the authenticated user when known, otherwise by client IP — so it must run
// after `protect` / optionalAuth for the per-user key to apply.
const rateLimit = ({ windowMs, max, message }) => {
  const hits = new Map(); // key → { count, resetAt }

  return (req, res, next) => {
    const now = Date.now();
    const key = req.user?.id ? `user:${req.user.id}` : `ip:${req.ip}`;

    // Keep memory bounded: drop expired windows once the map grows
    if (hits.size > 10000) {
      for (const [k, entry] of hits) if (entry.resetAt <= now) hits.delete(k);
    }

    let entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }
    entry.count += 1;

    if (entry.count > max) {
      res.set('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
      return res.status(429).json({ success: false, error: message });
    }
    next();
  };
};

// Gemini calls cost money, so every AI endpoint gets a per-user/IP ceiling
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: 'Too many AI requests. Please wait a minute and try again.',
});

// Guests are counted on the server; the client-sent history length can't be trusted
const guestChatLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Guest limit reached. Please sign in for unlimited access.',
});

module.exports = { rateLimit, aiLimiter, guestChatLimiter };
