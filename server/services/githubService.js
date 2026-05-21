const https = require('https');

// ── Helper: promisified HTTPS GET with GitHub headers ─────────────
const fetchGitHub = (url) => {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'PathAI-Career-App',
        'Accept': 'application/vnd.github.v3+json',
        ...(process.env.GITHUB_TOKEN && {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
        }),
      },
    };

    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        if (res.statusCode === 404) return reject(new Error('GitHub user not found'));
        if (res.statusCode === 403) return reject(new Error('GitHub API rate limit exceeded. Add GITHUB_TOKEN to .env'));
        if (res.statusCode !== 200) return reject(new Error(`GitHub API error: ${res.statusCode}`));
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error('Invalid JSON from GitHub API'));
        }
      });
    }).on('error', reject);
  });
};

// ── Language → Career Domain Mapping ─────────────────────────────
const LANGUAGE_DOMAIN_MAP = {
  Python: ['AI/Machine Learning', 'Data Science', 'Backend Development'],
  JavaScript: ['Web Development', 'Frontend Development', 'Full Stack'],
  TypeScript: ['Web Development', 'Full Stack', 'Software Engineering'],
  'C++': ['Systems Programming', 'Game Development', 'Embedded Systems'],
  C: ['Systems Programming', 'Embedded Systems', 'Low-Level Engineering'],
  'C#': ['Game Development', 'Enterprise Software', '.NET Development'],
  Java: ['Backend Development', 'Android Development', 'Enterprise Software'],
  Kotlin: ['Android Development', 'Backend Development'],
  Swift: ['iOS Development', 'Mobile Development'],
  Go: ['Cloud Infrastructure', 'Backend Development', 'DevOps'],
  Rust: ['Systems Programming', 'WebAssembly', 'Performance Engineering'],
  PHP: ['Web Development', 'Backend Development'],
  Ruby: ['Web Development', 'Backend Development'],
  Dart: ['Mobile Development', 'Flutter Development'],
  R: ['Data Science', 'Statistical Analysis', 'Bioinformatics'],
  Scala: ['Data Engineering', 'Functional Programming', 'Big Data'],
  Shell: ['DevOps', 'Cloud Infrastructure', 'Automation'],
  HTML: ['Web Development', 'Frontend Development'],
  CSS: ['Web Development', 'Frontend Development', 'UI Design'],
  Vue: ['Frontend Development', 'Web Development'],
  Jupyter: ['Data Science', 'AI/Machine Learning', 'Research'],
};

// ── Technical Aptitude Score Algorithm ───────────────────────────
const computeTechnicalAptitudeScore = (profile, repos) => {
  let score = 0;
  const breakdown = {};

  // 1. Repository Volume (max 20 pts)
  const repoScore = Math.min(20, Math.floor(repos.length / 2));
  score += repoScore;
  breakdown.repositoryVolume = { score: repoScore, max: 20, detail: `${repos.length} public repos` };

  // 2. Language Diversity (max 20 pts)
  const uniqueLangs = new Set(repos.map(r => r.language).filter(Boolean));
  const langScore = Math.min(20, uniqueLangs.size * 3);
  score += langScore;
  breakdown.languageDiversity = { score: langScore, max: 20, detail: `${uniqueLangs.size} languages` };

  // 3. Recency & Activity (max 20 pts)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const recentRepos = repos.filter(r => r.updated_at && new Date(r.updated_at) > sixMonthsAgo);
  const recencyScore = Math.min(20, Math.floor((recentRepos.length / Math.max(1, repos.length)) * 20));
  score += recencyScore;
  breakdown.recentActivity = { score: recencyScore, max: 20, detail: `${recentRepos.length} repos updated recently` };

  // 4. Social Proof / Stars (max 15 pts)
  const totalStars = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
  const starsScore = Math.min(15, Math.floor(totalStars / 2));
  score += starsScore;
  breakdown.communityRecognition = { score: starsScore, max: 15, detail: `${totalStars} total stars` };

  // 5. Profile Completeness (max 10 pts)
  let profileScore = 0;
  if (profile.bio) profileScore += 3;
  if (profile.location) profileScore += 2;
  if (profile.blog) profileScore += 2;
  if (profile.company) profileScore += 1;
  if (profile.twitter_username) profileScore += 2;
  score += profileScore;
  breakdown.profileCompleteness = { score: profileScore, max: 10, detail: 'Bio, location, links' };

  // 6. Account Age (max 10 pts)
  const accountAgeYears = (Date.now() - new Date(profile.created_at)) / (1000 * 60 * 60 * 24 * 365);
  const ageScore = Math.min(10, Math.floor(accountAgeYears * 2));
  score += ageScore;
  breakdown.accountAge = { score: ageScore, max: 10, detail: `${accountAgeYears.toFixed(1)} years on GitHub` };

  // 7. Quality Indicators (max 5 pts): repos with description & non-fork
  const qualityRepos = repos.filter(r => r.description && !r.fork);
  const qualityScore = Math.min(5, Math.floor(qualityRepos.length / 2));
  score += qualityScore;
  breakdown.repoQuality = { score: qualityScore, max: 5, detail: `${qualityRepos.length} original repos with descriptions` };

  return { total: Math.min(100, score), breakdown };
};

// ── Main GitHub Analysis Function ─────────────────────────────────
const analyzeGitHubProfile = async (username) => {
  const cleanUsername = username.trim().replace(/^@/, '');

  // Fetch profile + repos in parallel
  const [profile, repos] = await Promise.all([
    fetchGitHub(`https://api.github.com/users/${cleanUsername}`),
    fetchGitHub(`https://api.github.com/users/${cleanUsername}/repos?per_page=100&sort=updated`),
  ]);

  // ── Language aggregation ────────────────────────────────────────
  const languageMap = {};
  for (const repo of repos) {
    if (repo.language) {
      languageMap[repo.language] = (languageMap[repo.language] || 0) + 1;
    }
  }

  const totalLangRepos = Object.values(languageMap).reduce((a, b) => a + b, 0);
  const topLanguages = Object.entries(languageMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([language, count]) => ({
      language,
      count,
      percentage: Math.round((count / Math.max(1, totalLangRepos)) * 100),
    }));

  // ── Primary tech interests from language mapping ────────────────
  const domainCounts = {};
  for (const { language } of topLanguages) {
    const domains = LANGUAGE_DOMAIN_MAP[language] || [];
    domains.forEach(domain => {
      domainCounts[domain] = (domainCounts[domain] || 0) + 1;
    });
  }
  const primaryInterests = Object.entries(domainCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([interest]) => interest);

  // ── Pinned / notable repos ──────────────────────────────────────
  const pinnedRepos = repos
    .filter(r => !r.fork)
    .sort((a, b) => (b.stargazers_count + b.forks_count) - (a.stargazers_count + a.forks_count))
    .slice(0, 4)
    .map(r => ({
      name: r.name,
      description: r.description || '',
      stars: r.stargazers_count || 0,
      forks: r.forks_count || 0,
      language: r.language || 'Unknown',
      url: r.html_url,
      updatedAt: r.updated_at,
    }));

  // ── Compute score ───────────────────────────────────────────────
  const aptitudeScore = computeTechnicalAptitudeScore(profile, repos);

  // ── Activity streak ─────────────────────────────────────────────
  const sortedByUpdate = [...repos]
    .filter(r => r.updated_at)
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  const lastActiveAt = sortedByUpdate[0]?.updated_at || null;

  return {
    // Raw GitHub profile summary
    profile: {
      username: profile.login,
      name: profile.name || profile.login,
      avatarUrl: profile.avatar_url,
      profileUrl: profile.html_url,
      bio: profile.bio || '',
      location: profile.location || '',
      company: profile.company || '',
      blog: profile.blog || '',
      publicRepos: profile.public_repos || 0,
      followers: profile.followers || 0,
      following: profile.following || 0,
      accountCreatedAt: profile.created_at,
      lastActiveAt,
    },
    // Language analysis
    topLanguages,
    // Career domain interests derived from code
    primaryInterests,
    // Score
    technicalAptitudeScore: aptitudeScore.total,
    scoreBreakdown: aptitudeScore.breakdown,
    // Notable repos
    pinnedRepos,
    // Total stars across all repos
    totalStars: repos.reduce((s, r) => s + (r.stargazers_count || 0), 0),
    totalForks: repos.reduce((s, r) => s + (r.forks_count || 0), 0),
  };
};

module.exports = { analyzeGitHubProfile };
