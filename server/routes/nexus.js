const express = require('express');
const router = express.Router();
const https = require('https');
const { protect } = require('../middleware/auth');
const Assessment = require('../models/Assessment');

const AI_NAME = 'PathGuide AI';

// ── Gemini REST call ──────────────────────────────────────────────
const callGemini = (contents) => {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return reject(new Error('GEMINI_API_KEY not set in .env'));

    const body = JSON.stringify({
      contents,
      systemInstruction: {
        parts: [{
          text: `You are "${AI_NAME}", a practical career and commercialization advisor inside the PATHAI Career Intelligence platform.

TONE: Professional, encouraging, concise, and commercially practical.
PERSONALITY: You help students turn measurable skills into Sri Lankan career and project opportunities.

RULES:
1. Focus ONLY on career, technology, skills, and learning paths. Politely decline medical, legal, or unrelated advice.
2. Use Sri Lankan context and LKR salary/cost estimates. Do not use USD.
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
      path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
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
    req.setTimeout(12000, () => req.destroy(new Error('AI request timed out')));
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
const localCareerCards = [
  {
    keywords: ['ml', 'machine learning', 'ai', 'model', 'computer vision', 'prediction'],
    title: 'AI / Machine Learning Solutions Engineer',
    salary: 'LKR 120,000-450,000 per month',
    skills: ['Python data cleaning', 'Statistics and model evaluation', 'Deployment of a simple API or dashboard'],
    roadmap: ['Clean one Sri Lankan dataset and publish charts', 'Train a baseline model and explain accuracy limits', 'Deploy a small demo with a measurable business metric'],
    project: 'Crop disease risk predictor or tea leaf quality grading demo with before/after value in LKR.',
    certifications: ['Machine Learning Specialization', 'Python for Everybody', 'MLOps Zoomcamp'],
  },
  {
    keywords: ['data', 'analyst', 'analytics', 'bi', 'dashboard', 'sql', 'excel', 'power bi'],
    title: 'Data Analyst / Business Intelligence Specialist',
    salary: 'LKR 90,000-300,000 per month',
    skills: ['SQL joins and summaries', 'Excel or Power BI dashboards', 'Business storytelling with charts'],
    roadmap: ['Analyze one real CSV', 'Build a KPI dashboard', 'Interview a stakeholder and document one decision improved'],
    project: 'School dropout risk dashboard or SME sales and stock visibility dashboard.',
    certifications: ['Google Data Analytics Certificate', 'Microsoft Power BI learning path', 'SQLBolt'],
  },
  {
    keywords: ['cloud', 'devops', 'docker', 'deployment', 'aws', 'azure', 'hosting'],
    title: 'Cloud and Platform Engineer',
    salary: 'LKR 140,000-500,000 per month',
    skills: ['Linux and networking basics', 'Docker packaging', 'Low-cost cloud deployment and monitoring'],
    roadmap: ['Deploy a Linux server', 'Dockerize one app', 'Add uptime, logs, backups, and LKR cost controls'],
    project: 'Low-cost cloud hosting plan for student startups or SMEs with monthly LKR budget comparison.',
    certifications: ['AWS Cloud Practitioner', 'Docker Curriculum', 'Linux Journey'],
  },
  {
    keywords: ['cyber', 'security', 'phishing', 'risk', 'networking', 'audit'],
    title: 'Cybersecurity Analyst',
    salary: 'LKR 100,000-380,000 per month',
    skills: ['Networking and Linux fundamentals', 'Risk scoring', 'Incident and audit reporting'],
    roadmap: ['Build a safe home lab', 'Run a school or SME checklist', 'Prepare a risk matrix and action plan'],
    project: 'SME phishing risk scanner with a simple LKR-priced support proposal.',
    certifications: ['Google Cybersecurity Certificate', 'TryHackMe Pre Security', 'OWASP Top 10'],
  },
  {
    keywords: ['iot', 'arduino', 'sensor', 'electronics', 'embedded', 'agriculture'],
    title: 'IoT and Embedded Systems Developer',
    salary: 'LKR 90,000-320,000 per month',
    skills: ['Sensor wiring and calibration', 'Arduino or ESP32 firmware', 'Field testing and bill of materials'],
    roadmap: ['Build 3 sensor circuits', 'Send readings to a dashboard', 'Test reliability and calculate unit cost in LKR'],
    project: 'Low-cost smart irrigation controller with sensor readings, enclosure plan, and pilot quote.',
    certifications: ['Arduino Project Hub', 'ESP32 tutorials', 'MQTT Essentials'],
  },
  {
    keywords: ['ux', 'design', 'research', 'figma', 'user', 'public service'],
    title: 'UX Researcher / Product Designer',
    salary: 'LKR 80,000-280,000 per month',
    skills: ['User interviews', 'Task-based usability testing', 'Prototype improvement from evidence'],
    roadmap: ['Interview 5 users', 'Build a clickable prototype', 'Measure task success before and after changes'],
    project: 'Multilingual scholarship finder or campus service flow tested with real students.',
    certifications: ['Google UX Design Certificate', 'Figma Learn', 'NN/g UX articles'],
  },
];

const normalise = (value = '') => value.toString().toLowerCase();
const bulletList = (items = []) => items.map(item => `- ${item}`).join('\n');

const pickCareerCard = (message = '') => {
  const text = normalise(message);
  return localCareerCards.find(card => card.keywords.some(keyword => text.includes(keyword))) || localCareerCards[0];
};

const buildAssessmentSummaryReply = (assessmentContext) => {
  if (!assessmentContext) {
    return `**${AI_NAME} assessment guidance**\n\nI can personalize this better after you complete the Assessment. For now, use this practical path:\n\n1. Finish the Skill Check with at least 4 evidence-based answers.\n2. Pick a Problem-Market Fit area with real users or data.\n3. Open Results and focus on the top 3 gap skills.\n4. Build one portfolio project that proves customer value in LKR.\n\nBring evidence to the competition: screenshots, dataset sample, user feedback, cost estimate, and a 3-minute pitch.`;
  }

  const careers = assessmentContext.predictedCareers?.length
    ? assessmentContext.predictedCareers.map(career => `${career.title || 'Career'} (${career.matchScore || 0}% match)`).join(', ')
    : 'No predicted careers yet';

  return `**${AI_NAME} assessment summary**\n\nYour strongest current signals:\n${bulletList(assessmentContext.topSkills?.length ? assessmentContext.topSkills : ['Complete the practical skill check to generate measured skills'])}\n\nBest career matches:\n- ${careers}\n\nPractical next steps:\n1. Pick the highest-match career and list its top 3 gap skills.\n2. Build one small project that proves those skills with real users, data, or a working demo.\n3. Add LKR cost/value evidence so it works for a Science-to-Business pitch.\n4. Re-run the assessment after adding project proof.`;
};

const buildLocalReply = (message, assessmentContext) => {
  const text = normalise(message);
  if (text.includes('assessment') || text.includes('result') || text.includes('profile')) {
    return buildAssessmentSummaryReply(assessmentContext);
  }

  const card = pickCareerCard(message);
  const personalLine = assessmentContext?.topSkills?.length
    ? `\n\nBased on your assessment, your strongest useful skills are: ${assessmentContext.topSkills.slice(0, 3).join(', ')}.`
    : '';

  if (text.includes('certification') || text.includes('certificate')) {
    return `**${AI_NAME} certification advice for ${card.title}**\n\nStart with:\n${bulletList(card.certifications)}\n\nUse certifications as proof, but do not stop there. For the competition, pair one certificate with a working project: ${card.project}\n\nExpected market value: ${card.salary}.`;
  }

  if (text.includes('roadmap') || text.includes('learn') || text.includes('become') || text.includes('transition')) {
    return `**${AI_NAME} roadmap: ${card.title}**\n\n1. Foundation: ${card.roadmap[0]}\n2. Portfolio: ${card.roadmap[1]}\n3. Commercial proof: ${card.roadmap[2]}\n\nTop skills to build:\n${bulletList(card.skills)}\n\nCompetition-ready project idea:\n- ${card.project}\n\nSri Lanka salary signal: ${card.salary}.${personalLine}`;
  }

  return `**${AI_NAME} practical answer: ${card.title}**\n\nTop skills employers and judges will care about:\n${bulletList(card.skills)}\n\nLKR salary signal:\n- ${card.salary}\n\nGrowth outlook:\n- Strong demand when you can show a working demo, real data, user validation, and measurable value.\n\nBest project for your pitch:\n- ${card.project}\n\nNext action this week:\n1. Collect one real dataset, user interview set, or field reading sample.\n2. Build the smallest working demo.\n3. Calculate the cost, saving, or revenue value in LKR.${personalLine}`;
};

const getReply = async ({ contents, message, assessmentContext }) => {
  try {
    return { reply: await callGemini(contents), mode: 'gemini' };
  } catch (err) {
    return { reply: buildLocalReply(message, assessmentContext), mode: 'local-fallback' };
  }
};

const chatSessions = new Map();
const MAX_HISTORY = 20;

// ─────────────────────────────────────────────────────────────────
// @POST /api/nexus/chat
// Send a message to PathGuide AI
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

    const { reply, mode } = await getReply({
      contents,
      message: message.trim(),
      assessmentContext,
    });

    // Update history
    history = [
      ...history,
      { role: 'user', content: message.trim() },
      { role: 'assistant', content: reply },
    ].slice(-MAX_HISTORY);
    chatSessions.set(req.user.id, history);

    res.json({ success: true, data: { reply, historyLength: history.length, mode } });
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
    const { reply, mode } = await getReply({
      contents,
      message: message.trim(),
      assessmentContext: null,
    });
    res.json({ success: true, data: { reply, mode } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
