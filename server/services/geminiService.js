const https = require('https');

const fallbackScenarios = {
  ai: {
    situation: 'A tea factory wants to reduce manual grading errors before export packaging. They can provide 500 labelled leaf images and want a low-cost proof of concept in two weeks.',
    challenge: 'Explain the model approach, data risks, success metric, and how you would prove commercial value in LKR.',
    context: ['Think about image classification, validation accuracy, and bias in lighting conditions.', 'A useful answer connects technical accuracy to reduced waste or faster inspection.'],
    difficulty: 'junior',
  },
  data: {
    situation: 'A school has attendance, exam, and fee-payment spreadsheets but no early warning system for student dropout risk. The principal wants a dashboard that teachers can act on each week.',
    challenge: 'Design the analysis and dashboard KPIs, and explain how the school can measure whether the solution is worth paying for.',
    context: ['Think about data cleaning, privacy, trend analysis, and false positives.', 'Commercial value can be reduced admin time or improved student retention.'],
    difficulty: 'junior',
  },
  cloud: {
    situation: 'A Sri Lankan SaaS startup has rising hosting costs and slow manual deployments. They want to keep monthly cloud spend predictable while improving release speed.',
    challenge: 'Propose a deployment and monitoring plan that reduces risk, controls LKR cost, and supports growth.',
    context: ['Think about containers, CI/CD, budget alerts, backups, and basic observability.', 'A strong answer balances reliability with cost.'],
    difficulty: 'mid',
  },
  cyber: {
    situation: 'A small finance company has seen phishing emails targeting staff. Management needs a practical security improvement plan without buying an expensive enterprise platform first.',
    challenge: 'Prioritize the first 30 days of controls, training, and measurement.',
    context: ['Think about email security, staff training, incident reporting, and risk scoring.', 'Tie each action to breach prevention or reduced response time.'],
    difficulty: 'junior',
  },
  iot: {
    situation: 'A vegetable farmer wants to reduce water usage but cannot afford an expensive imported irrigation system. You can build a prototype with soil moisture sensors and an ESP32.',
    challenge: 'Explain the sensing, control logic, field test, build cost, and revenue model.',
    context: ['Think about calibration, weather, power, enclosure, and maintenance.', 'Judges will expect scientific measurement and a customer price.'],
    difficulty: 'junior',
  },
  ux: {
    situation: 'Students abandon an online scholarship application because the form is confusing in Sinhala, Tamil, and English. An education NGO asks for a fast usability study.',
    challenge: 'Plan the research, prototype changes, and business metric that proves the redesign worked.',
    context: ['Think about cognitive load, accessibility, multilingual content, and completion rate.', 'Commercial value can be higher completed applications and less support time.'],
    difficulty: 'junior',
  },
};

const pickFallbackScenario = (career = '') => {
  const key = career.toLowerCase();
  if (key.includes('machine') || key.includes('ai')) return fallbackScenarios.ai;
  if (key.includes('data') || key.includes('business intelligence')) return fallbackScenarios.data;
  if (key.includes('cloud') || key.includes('platform') || key.includes('devops')) return fallbackScenarios.cloud;
  if (key.includes('cyber') || key.includes('security')) return fallbackScenarios.cyber;
  if (key.includes('iot') || key.includes('embedded')) return fallbackScenarios.iot;
  if (key.includes('ux') || key.includes('design')) return fallbackScenarios.ux;
  return fallbackScenarios.data;
};

const callGemini = (prompt) => {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return reject(new Error('GEMINI_API_KEY not set in .env'));

    const body = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.75, maxOutputTokens: 650 },
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
          if (res.statusCode === 429) return reject(new Error('AI rate limited. Please wait a moment and try again.'));
          if (json.error) return reject(new Error(json.error.message));
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!text) return reject(new Error('Empty response from Gemini'));
          resolve(text.trim());
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
};

const parseJson = (raw) => {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Could not parse JSON response');
  return JSON.parse(match[0]);
};

const generateScenario = async (career, context = {}) => {
  const prompt = `You are running a practical job-and-business simulation for Sri Lankan students.

Role: "${career}"
Local market context: ${context.evidenceSummary || 'Sri Lanka-focused ICT, science, and business value.'}
Likely customers/employers: ${(context.employerTypes || []).join(', ') || 'Sri Lankan SMEs, schools, exporters, and digital service teams'}
Business use cases: ${(context.businessUseCases || []).join(', ') || 'local productivity, cost reduction, and better decisions'}

Generate a short realistic workplace or prototype commercialization scenario. If money is mentioned, use LKR only.
Return JSON exactly:
{
  "situation": "2-3 sentence realistic Sri Lankan problem",
  "challenge": "The specific task the candidate must address",
  "context": ["hint1", "hint2"],
  "difficulty": "junior|mid|senior"
}`;

  try {
    return parseJson(await callGemini(prompt));
  } catch {
    return pickFallbackScenario(career);
  }
};

const evaluateAnswer = async (career, scenario, userAnswer) => {
  const prompt = `Evaluate this response for a Sri Lankan Science-to-Business career simulation.

Role: ${career}
Scenario: ${scenario.situation}
Challenge: ${scenario.challenge}
Candidate answer: "${userAnswer}"

Score based on scientific accuracy, practical implementation, customer value, LKR cost awareness, and risk handling.
Return JSON exactly:
{
  "score": <integer 0-100>,
  "grade": "Excellent|Good|Fair|Needs Improvement",
  "feedback": "2-3 sentence specific feedback",
  "strengths": ["strength1", "strength2"],
  "improvements": ["improvement1"],
  "idealApproach": "1-2 sentence ideal answer"
}`;

  try {
    return parseJson(await callGemini(prompt));
  } catch {
    const answer = userAnswer.toLowerCase();
    let score = 45;
    if (answer.length > 180) score += 12;
    if (/data|measure|metric|accuracy|test|pilot|prototype|customer|cost|lkr|revenue|risk/.test(answer)) score += 18;
    if (/timeline|deploy|dashboard|sensor|model|security|user|validate/.test(answer)) score += 12;
    if (/because|therefore|so that|reduce|increase|save/.test(answer)) score += 8;
    score = Math.min(92, score);

    return {
      score,
      grade: score >= 80 ? 'Excellent' : score >= 65 ? 'Good' : score >= 50 ? 'Fair' : 'Needs Improvement',
      feedback: 'Your answer was evaluated with the offline rubric because the AI service is unavailable. Strong responses connect the scientific method to implementation steps, customer value, LKR cost, and measurable impact.',
      strengths: ['Practical reasoning', answer.includes('cost') || answer.includes('lkr') ? 'Cost awareness' : 'Problem framing'],
      improvements: ['Add clearer success metrics, risks, and a pilot validation plan'],
      idealApproach: 'Define the scientific method, build a small prototype, test it with real users, measure impact, and price the solution in LKR based on customer value.',
    };
  }
};

module.exports = { generateScenario, evaluateAnswer };
