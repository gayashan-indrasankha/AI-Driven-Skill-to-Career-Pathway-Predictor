const express = require('express');
const router = express.Router();
const https = require('https');
const { protect } = require('../middleware/auth');
const Assessment = require('../models/Assessment');

// ── Gemini REST call ──────────────────────────────────────────────
const callGemini = (contents) => {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return reject(new Error('GEMINI_API_KEY not set in .env'));

    const body = JSON.stringify({
      contents,
      systemInstruction: {
        parts: [{
          text: `You are "Nexus AI", a futuristic Career Consultant inside the 'AI-Driven Skill-to-Career Pathway Predictor' platform.

TONE: Professional, encouraging, and tech-savvy.
PERSONALITY: Think of yourself as a wise mentor who has analyzed thousands of career paths. You are direct, actionable, and inspiring.

RULES:
1. Focus ONLY on career, technology, skills, and learning paths. Politely decline medical, legal, or unrelated advice.
2. When explaining a career, always mention: top 3 in-demand skills, avg salary range, and growth outlook.
3. When suggesting learning paths, give ordered steps (e.g., "Step 1: Learn React → Step 2: Node.js → Step 3: MongoDB").
4. Use emojis occasionally but purposefully: 🚀 for opportunities, 💻 for technical skills, 🧠 for learning, 📈 for growth, ⚡ for quick wins.
5. Keep responses concise and scannable — use bullet points or numbered lists when helpful.
6. Reference the user's assessment data (if provided in context) to personalize advice.
7. Sign off longer responses with a motivational micro-note.`,
        }],
      },
      generationConfig: { temperature: 0.75, maxOutputTokens: 600 },
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', c => (data += c));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode === 429) return reject(new Error('AI is busy right now. Please wait a moment and try again.'));
          if (res.statusCode === 403) return reject(new Error('API key issue. Please check your GEMINI_API_KEY.'));
          if (json.error) return reject(new Error(json.error.message));
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!text) return reject(new Error('Empty response from Gemini'));
          resolve(text.trim());
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
};

// ── Build Gemini-format history from our chat history ─────────────
const buildContents = (history, userMessage, assessmentContext) => {
  const contents = [];

  // Inject assessment context as first AI turn if available
  if (assessmentContext) {
    contents.push({
      role: 'user',
      parts: [{ text: `[SYSTEM CONTEXT] Here is my profile data: ${JSON.stringify(assessmentContext)}` }],
    });
    contents.push({
      role: 'model',
      parts: [{ text: `Got it! I've loaded your profile. I can see your skills, interests, and predicted career paths. I'll personalize my advice accordingly. How can I help you today? 🚀` }],
    });
  }

  // Add conversation history
  for (const msg of history) {
    contents.push({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    });
  }

  // Add current message
  contents.push({ role: 'user', parts: [{ text: userMessage }] });
  return contents;
};

// ── Per-user chat history (in-memory, last 20 messages) ──────────
const chatSessions = new Map();
const MAX_HISTORY = 20;

// ─────────────────────────────────────────────────────────────────
// @POST /api/nexus/chat
// Send a message to Nexus AI
// ─────────────────────────────────────────────────────────────────
router.post('/chat', protect, async (req, res) => {
  const { message } = req.body;
  if (!message?.trim()) return res.status(400).json({ success: false, error: 'Message is required' });

  // Load history
  let history = chatSessions.get(req.user.id) || [];

  // Build assessment context (latest analyzed assessment)
  let assessmentContext = null;
  try {
    const assessment = await Assessment.findOne({ user: req.user.id, status: 'analyzed' })
      .sort({ createdAt: -1 })
      .populate('predictedCareers.careerPath', 'title industry salaryPotential')
      .lean();
    if (assessment) {
      assessmentContext = {
        topSkills: assessment.skillRatings?.slice(0, 5).map(s => `${s.name} (${s.proficiency}/5)`) || [],
        interests: assessment.extractedInterests?.slice(0, 5) || [],
        topLanguages: assessment.githubData?.topLanguages?.slice(0, 3).map(l => l.language) || [],
        predictedCareers: assessment.predictedCareers?.slice(0, 3).map(p => ({
          title: p.careerPath?.title,
          matchScore: p.matchScore,
          gapSkills: p.gapSkills?.slice(0, 3),
        })) || [],
        aptitudeScore: assessment.githubData?.contributionScore || null,
      };
    }
  } catch (_) { /* Non-critical — continue without context */ }

  try {
    const contents = buildContents(
      history.length > MAX_HISTORY ? history.slice(-MAX_HISTORY) : history,
      message.trim(),
      history.length === 0 ? assessmentContext : null, // inject context only on first message
    );

    const reply = await callGemini(contents);

    // Update history
    history = [
      ...history,
      { role: 'user', content: message.trim() },
      { role: 'assistant', content: reply },
    ].slice(-MAX_HISTORY);
    chatSessions.set(req.user.id, history);

    res.json({ success: true, data: { reply, historyLength: history.length } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// @DELETE /api/nexus/chat
// Clear conversation history
// ─────────────────────────────────────────────────────────────────
router.delete('/chat', protect, (req, res) => {
  chatSessions.delete(req.user.id);
  res.json({ success: true, message: 'Conversation cleared' });
});

// ─────────────────────────────────────────────────────────────────
// @POST /api/nexus/chat/guest  ← No auth, stateless, 5-message limit
// ─────────────────────────────────────────────────────────────────
router.post('/chat/guest', async (req, res) => {
  const { message, history = [] } = req.body;
  if (!message?.trim()) return res.status(400).json({ success: false, error: 'Message is required' });
  if (history.length > 10) return res.status(429).json({ success: false, error: 'Guest limit reached. Please sign in for unlimited access.' });

  try {
    const contents = buildContents(history, message.trim(), null);
    const reply = await callGemini(contents);
    res.json({ success: true, data: { reply } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
