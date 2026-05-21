const https = require('https');

const callGemini = (prompt) => {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return reject(new Error('GEMINI_API_KEY not set in .env'));

    const body = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.8, maxOutputTokens: 512 },
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
          if (res.statusCode === 429) return reject(new Error('AI rate limited. Please wait a moment and try again.'));
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

// ── Generate a scenario for a given career ────────────────────────
const generateScenario = async (career) => {
  const prompt = `You are a career coach running a realistic job simulation for the role: "${career}".

Generate a SHORT, engaging work scenario that tests practical problem-solving. Format your response as JSON exactly like this:
{
  "situation": "2-3 sentence description of a realistic workplace problem",
  "challenge": "The specific question or task the candidate must address",
  "context": ["hint1 about relevant concepts", "hint2 about tools/approaches"],
  "difficulty": "junior|mid|senior"
}

Make it specific to ${career}. Be concise and practical. Only return the JSON, no other text.`;

  const raw = await callGemini(prompt);
  // Extract JSON even if model adds markdown
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Could not parse scenario from Gemini');
  return JSON.parse(match[0]);
};

// ── Evaluate user answer and score it ────────────────────────────
const evaluateAnswer = async (career, scenario, userAnswer) => {
  const prompt = `You are evaluating a candidate's response in a "${career}" job simulation.

SCENARIO: ${scenario.situation}
CHALLENGE: ${scenario.challenge}
CANDIDATE'S ANSWER: "${userAnswer}"

Evaluate the answer and respond ONLY with this JSON:
{
  "score": <integer 0-100>,
  "grade": "Excellent|Good|Fair|Needs Improvement",
  "feedback": "2-3 sentence specific feedback on their answer",
  "strengths": ["strength1", "strength2"],
  "improvements": ["improvement1"],
  "idealApproach": "1-2 sentence description of the ideal solution"
}

Be fair, specific, and constructive. Score based on: technical accuracy, problem-solving approach, and practical thinking. Only return JSON.`;

  const raw = await callGemini(prompt);
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Could not parse evaluation from Gemini');
  return JSON.parse(match[0]);
};

module.exports = { generateScenario, evaluateAnswer };
