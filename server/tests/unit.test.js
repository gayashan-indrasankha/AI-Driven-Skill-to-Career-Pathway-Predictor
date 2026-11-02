// Pure unit tests — no database or network needed.
process.env.NODE_ENV = 'test';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { hasTerm, buildLocalReply } = require('../routes/nexus');
const { rateLimit } = require('../middleware/rateLimit');
const { isValidGitHubUsername } = require('../services/githubService');

const firstLine = (text) => text.split('\n')[0];

test('chat keyword matching uses whole words', () => {
  assert.equal(hasTerm('i want to learn', 'wan'), false);
  assert.equal(hasTerm('jobs in sri lanka', 'lan'), false);
  assert.equal(hasTerm('set up a lan party', 'lan'), true);
  assert.equal(hasTerm('skills for html', 'ml'), false);
  assert.equal(hasTerm('ml engineer', 'ml'), true);
  assert.equal(hasTerm('arduino sensors', 'sensor'), true);         // plural allowed
  assert.equal(hasTerm('learn python', 'earn*'), false);
  assert.equal(hasTerm('earning potential', 'earn*'), true);         // stem
  assert.equal(hasTerm('c# developer jobs', 'c# developer'), true);  // symbols escaped
  assert.equal(hasTerm('.net developer', '.net developer'), true);
});

test('offline chat replies pick the right career card', () => {
  const cases = [
    ['I want to become a UX designer', 'UX / UI Designer'],
    ['Give me a roadmap to become a game developer in Sri Lanka', 'Game Developer'],
    ['What skills do I need for HTML?', 'Frontend Developer'],
    ['What skills do I need for ML engineering?', 'ML Engineering'],
    ['I want to learn networking and CCNA', 'Network Engineer'],
    ['Which Sri Lankan tech career has the best LKR potential?', 'Best Sri Lankan Tech Careers'],
    ['How can I turn my prototype into a business pitch?', 'Business Pitch'],
  ];
  for (const [message, expected] of cases) {
    const heading = firstLine(buildLocalReply(message, null));
    assert.ok(heading.includes(expected), `"${message}" → ${heading}`);
  }
});

test('offline chat falls back to generic guidance for unknown roles', () => {
  assert.match(firstLine(buildLocalReply('I want to be a marine biologist', null)), /Career Guidance/);
});

test('rate limiter blocks after max requests per key', () => {
  const limiter = rateLimit({ windowMs: 60_000, max: 2, message: 'slow down' });
  const run = (req) => {
    let status = 200;
    const res = { set() {}, status(code) { status = code; return this; }, json() { return this; } };
    let passed = false;
    limiter(req, res, () => { passed = true; });
    return passed ? 200 : status;
  };
  const alice = { ip: '1.1.1.1' };
  assert.deepEqual([run(alice), run(alice), run(alice)], [200, 200, 429]);
  assert.equal(run({ ip: '2.2.2.2' }), 200);                          // separate IP
  assert.equal(run({ ip: '1.1.1.1', user: { id: 'u1' } }), 200);      // signed-in users keyed by account
});

test('GitHub username validation', () => {
  assert.equal(isValidGitHubUsername('octocat'), true);
  assert.equal(isValidGitHubUsername('my-user-1'), true);
  assert.equal(isValidGitHubUsername('-bad'), false);
  assert.equal(isValidGitHubUsername('../etc'), false);
  assert.equal(isValidGitHubUsername('a'.repeat(40)), false);
  assert.equal(isValidGitHubUsername(42), false);
});
