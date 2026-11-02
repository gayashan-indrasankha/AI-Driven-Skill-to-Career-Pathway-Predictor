// API integration tests against a real MongoDB (a separate test database that is
// dropped afterwards). Gemini is disabled so AI routes use their deterministic fallbacks,
// and no test calls GitHub.
//
//   MONGO_URI_TEST=mongodb://127.0.0.1:27017/career_pathway_test npm test
process.env.NODE_ENV = 'test';
process.env.GEMINI_API_KEY = '';            // set before dotenv runs, so .env can't override it
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const MONGO_URI_TEST = process.env.MONGO_URI_TEST || 'mongodb://127.0.0.1:27017/career_pathway_test';
if (!/test/i.test(MONGO_URI_TEST)) {
  throw new Error('MONGO_URI_TEST must point at a database whose name contains "test" — it is dropped after the run');
}

const app = require('../index');
const CareerPath = require('../models/CareerPath');
const Assessment = require('../models/Assessment');
const ChatSession = require('../models/ChatSession');
const careerData = require('../data/sriLankaCareerMarketData');

let server;
let base;

const api = async (method, path, body, token) => {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json().catch(() => null) };
};

let userCount = 0;
const registerUser = async () => {
  userCount += 1;
  const email = `user${Date.now()}_${userCount}@example.com`;
  const res = await api('POST', '/api/auth/register', { name: 'Test User', email, password: 'secret12' });
  assert.equal(res.status, 201);
  return { email, token: res.body.token, id: res.body.user._id };
};

const dataAnalystAssessment = {
  skillRatings: [
    { name: 'Python', proficiency: 4, category: 'technical' },
    { name: 'SQL', proficiency: 4, category: 'technical' },
    { name: 'Data Analysis', proficiency: 4, category: 'domain' },
    { name: 'Statistics', proficiency: 3, category: 'domain' },
    { name: 'Communication', proficiency: 4, category: 'soft' },
  ],
  extractedInterests: ['Data', 'dashboard'],
  careerGoals: 'I want to become a data analyst building dashboards',
  workPreferences: { style: 'hybrid', industry: ['Data'] },
};

before(async () => {
  await mongoose.connect(MONGO_URI_TEST, { serverSelectionTimeoutMS: 3000 });
  await mongoose.connection.dropDatabase();
  await CareerPath.insertMany(careerData.map(career => ({
    ...career,
    slug: career.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
  })));
  await CareerPath.syncIndexes(); // text index for ?search=
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  server?.close();
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});

test('register, login, and profile', async () => {
  const { email, token } = await registerUser();

  const dup = await api('POST', '/api/auth/register', { name: 'x', email, password: 'secret12' });
  assert.equal(dup.status, 409);

  const login = await api('POST', '/api/auth/login', { email, password: 'secret12' });
  assert.equal(login.status, 200);
  assert.equal(login.body.user.password, undefined, 'password hash must never be returned');

  assert.equal((await api('POST', '/api/auth/login', { email, password: 'wrong-pass' })).status, 401);
  assert.equal((await api('GET', '/api/users/me', null, token)).body.data.email, email);
  assert.equal((await api('GET', '/api/users/me')).status, 401);
});

test('deactivated account loses access immediately, even with an unexpired token', async () => {
  const { email, token } = await registerUser();
  assert.equal((await api('DELETE', '/api/users/me', null, token)).status, 200);
  assert.equal((await api('GET', '/api/users/me', null, token)).status, 401);
  assert.equal((await api('POST', '/api/auth/login', { email, password: 'secret12' })).status, 403);
});

test('assessment ranks matching careers and ignores client-supplied computed fields', async () => {
  const { token } = await registerUser();
  const res = await api('POST', '/api/assessment', {
    ...dataAnalystAssessment,
    status: 'draft',
    predictedCareers: [{ matchScore: 100 }],
    githubData: { username: 'faked', topLanguages: [{ language: 'Python', percentage: 100 }] },
    githubUsername: 'not a valid username!',
  }, token);

  assert.equal(res.status, 201);
  const { data } = res.body;
  assert.equal(data.status, 'analyzed');
  assert.equal(data.predictedCareers.length, 5);
  assert.match(data.predictedCareers[0].careerPath.title, /Data Analyst/);
  assert.ok(data.predictedCareers[0].matchScore < 100);
  assert.equal(data.githubData, undefined, 'githubData must come from GitHub, not the client');

  const predicted = await api('GET', '/api/careers/predicted', null, token);
  assert.equal(predicted.body.data.length, 5);
});

test('latest assessment prefers the analyzed one over a newer draft', async () => {
  const { token, id } = await registerUser();
  await api('POST', '/api/assessment', dataAnalystAssessment, token);
  await Assessment.create({ user: id, status: 'in-progress' }); // e.g. a later GitHub re-scan

  const latest = await api('GET', '/api/assessment/my/latest', null, token);
  assert.equal(latest.body.data.status, 'analyzed');
  assert.equal(latest.body.data.predictedCareers.length, 5);
});

test('latest assessment falls back to a draft when nothing is analyzed yet', async () => {
  const { token, id } = await registerUser();
  await Assessment.create({ user: id, status: 'in-progress' });
  const latest = await api('GET', '/api/assessment/my/latest', null, token);
  assert.equal(latest.body.data.status, 'in-progress');
});

test('career listing, search, and lookup', async () => {
  const list = await api('GET', '/api/careers?limit=20');
  assert.equal(list.body.data.length, careerData.length);

  const search = await api('GET', '/api/careers?search=cloud');
  assert.ok(search.body.data.some(career => /Cloud/.test(career.title)));

  const bySlug = await api('GET', `/api/careers/${list.body.data[0].slug}`);
  assert.equal(bySlug.body.data.title, list.body.data[0].title);
});

test('admin-only routes reject normal users', async () => {
  const { token } = await registerUser();
  const res = await api('POST', '/api/careers', { title: 'x', description: 'y', industry: 'z' }, token);
  assert.equal(res.status, 403);
});

test('career simulator validates input and projects readiness', async () => {
  const { token } = await registerUser();
  await api('POST', '/api/assessment', dataAnalystAssessment, token);
  const career = await CareerPath.findOne({ title: /Data Analyst/ });

  const run = await api('POST', '/api/simulation/run', { careerId: career._id, timelineMonths: 12 }, token);
  assert.equal(run.status, 200);
  assert.ok(run.body.data.readinessScore > 0 && run.body.data.readinessScore <= 100);
  assert.ok(run.body.data.projectedSalaryLkrMonthly > 0);

  assert.equal((await api('POST', '/api/simulation/run', { careerId: 'nope' })).status, 400);
  assert.equal((await api('POST', '/api/simulation/run', {})).status, 400);
});

test('scenario simulator keeps anonymous sessions separate and stores scores apart from GitHub data', async () => {
  // Two anonymous visitors (same IP in tests) get independent sessions
  const a = await api('POST', '/api/simchat/start', { career: 'Data Analyst' });
  const b = await api('POST', '/api/simchat/start', { career: 'Cybersecurity Analyst' });
  assert.ok(a.body.data.sessionId && b.body.data.sessionId);
  assert.notEqual(a.body.data.sessionId, b.body.data.sessionId);

  const answer = 'I would clean the data, measure attendance trends, build a dashboard, pilot it, and track LKR cost.';
  const ansA = await api('POST', '/api/simchat/answer', { answer, sessionId: a.body.data.sessionId });
  assert.equal(ansA.status, 200);
  assert.equal(ansA.body.data.rounds, 1);

  const histB = await api('GET', `/api/simchat/history?sessionId=${b.body.data.sessionId}`);
  assert.equal(histB.body.data.rounds, 0, 'visitor B must not see visitor A\'s answers');
  assert.equal((await api('POST', '/api/simchat/answer', { answer })).status, 400, 'no session id → no session');

  // Signed-in user: score is saved to simulationResults, GitHub score untouched
  const { token, id } = await registerUser();
  await api('POST', '/api/assessment', dataAnalystAssessment, token);
  await api('POST', '/api/simchat/start', { career: 'Data Analyst' }, token);
  const ans = await api('POST', '/api/simchat/answer', { answer }, token);
  assert.equal(ans.body.data.savedToProfile, true);

  const saved = await Assessment.findOne({ user: id, status: 'analyzed' }).lean();
  assert.equal(saved.simulationResults.averageScore, ans.body.data.sessionScore);
  assert.equal(saved.githubData, undefined);
});

test('PathGuide chat history is stored in MongoDB and can be cleared', async () => {
  const { token, id } = await registerUser();
  const first = await api('POST', '/api/nexus/chat', { message: 'roadmap to become a data analyst' }, token);
  assert.equal(first.status, 200);
  assert.equal(first.body.data.mode, 'local-fallback');
  await api('POST', '/api/nexus/chat', { message: 'what certification should I get first?' }, token);

  const stored = await ChatSession.findOne({ key: `nexus:${id}` }).lean();
  assert.equal(stored.data.history.length, 4);

  await api('DELETE', '/api/nexus/chat', null, token);
  assert.equal(await ChatSession.countDocuments({ key: `nexus:${id}` }), 0);

  const tooLong = await api('POST', '/api/nexus/chat', { message: 'x'.repeat(2500) }, token);
  assert.equal(tooLong.status, 400);
});

test('guest chat limit is enforced on the server', async () => {
  const statuses = [];
  for (let i = 0; i < 11; i++) {
    statuses.push((await api('POST', '/api/nexus/chat/guest', { message: 'hi', history: [] })).status);
  }
  assert.deepEqual(statuses.slice(0, 10), Array(10).fill(200));
  assert.equal(statuses[10], 429);
});
