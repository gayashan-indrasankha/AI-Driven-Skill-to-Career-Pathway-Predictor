import { useState } from 'react'
import {
  FiGithub, FiStar, FiGitBranch, FiUsers, FiCode,
  FiExternalLink, FiCheck, FiAlertCircle,
  FiZap, FiTrendingUp, FiBookmark,
} from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'

const LANGUAGE_COLORS = {
  JavaScript: '#f7df1e', TypeScript: '#3178c6', Python: '#3572a5',
  Java: '#b07219', 'C++': '#f34b7d', C: '#555555', 'C#': '#178600',
  Go: '#00add8', Rust: '#dea584', Swift: '#f05138', Kotlin: '#a97bff',
  PHP: '#4f5d95', Ruby: '#701516', Dart: '#00b4ab', R: '#198ce7',
  Shell: '#89e051', HTML: '#e34c26', CSS: '#563d7c', Vue: '#41b883',
  Scala: '#c22d40', default: '#8b949e',
}

const getLangColor = (lang) => LANGUAGE_COLORS[lang] || LANGUAGE_COLORS.default

// ── Score ring SVG ────────────────────────────────────────────────
const ScoreRing = ({ score }) => {
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = score >= 75 ? '#00ff88' : score >= 50 ? '#00d4ff' : score >= 30 ? '#7c3aed' : '#ff006e'

  return (
    <div style={{ position: 'relative', width: '140px', height: '140px', flexShrink: 0 }}>
      <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="70" cy="70" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
        <circle
          cx="70" cy="70" r={radius} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.2s ease, stroke 0.5s ease', filter: `drop-shadow(0 0 8px ${color}80)` }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span className="font-display" style={{ fontSize: '2rem', fontWeight: 900, color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: '0.6rem', color: '#475569', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '2px' }}>Aptitude</span>
      </div>
    </div>
  )
}

// ── Breakdown bar ─────────────────────────────────────────────────
const BreakdownBar = ({ label, score, max, detail }) => (
  <div style={{ marginBottom: '0.875rem' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
      <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{label}</span>
      <span style={{ fontSize: '0.75rem', color: '#475569', fontFamily: 'var(--font-mono)' }}>{score}/{max}</span>
    </div>
    <div style={{ height: '5px', background: 'rgba(0,212,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
      <div style={{
        height: '100%', borderRadius: '3px', transition: 'width 1s ease',
        width: `${(score / max) * 100}%`,
        background: score === max ? 'linear-gradient(90deg,#00ff88,#00cc6a)'
          : score >= max * 0.6 ? 'linear-gradient(90deg,#00d4ff,#0099cc)'
          : 'linear-gradient(90deg,#7c3aed,#a855f7)',
      }} />
    </div>
    <div style={{ fontSize: '0.68rem', color: '#334155', marginTop: '0.2rem' }}>{detail}</div>
  </div>
)

const BREAKDOWN_LABELS = {
  repositoryVolume: 'Repository Volume',
  languageDiversity: 'Language Diversity',
  recentActivity: 'Recent Activity',
  communityRecognition: 'Stars & Recognition',
  profileCompleteness: 'Profile Completeness',
  accountAge: 'Account Age',
  repoQuality: 'Repository Quality',
}

// ── Main component ────────────────────────────────────────────────
const GitHubExtractor = ({ onSaved }) => {
  const [input, setInput] = useState('')
  const [resolvedUsername, setResolvedUsername] = useState('')
  const [phase, setPhase] = useState('idle') // idle | loading | result | saving | saved | error
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const { token } = useAuth()

  // ── Parse GitHub URL or username ──────────────────────────────
  const parseUsername = (raw) => {
    const trimmed = raw.trim()
    // Full URL: https://github.com/username or github.com/username (strip trailing slash/path)
    const urlMatch = trimmed.match(
      /(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9][a-zA-Z0-9-]{0,37}[a-zA-Z0-9]?)\/?/i
    )
    if (urlMatch) return urlMatch[1]
    // @username
    if (trimmed.startsWith('@')) return trimmed.slice(1)
    return trimmed
  }

  // ── Analyze ───────────────────────────────────────────────────
  const handleAnalyze = async (e) => {
    e.preventDefault()
    if (!input.trim()) return

    const username = parseUsername(input)
    if (!username) {
      setError('Could not parse a valid GitHub username from your input.')
      setPhase('error')
      return
    }

    setResolvedUsername(username)
    setPhase('loading')
    setError('')
    setData(null)

    try {
      const res = await fetch(`/api/github/analyze/${encodeURIComponent(username)}`)
      const json = await res.json()
      if (!json.success) {
        throw new Error(json.errors?.[0]?.msg || json.error || 'Analysis failed')
      }
      setData(json.data)
      setPhase('result')
    } catch (err) {
      setError(err.message)
      setPhase('error')
    }
  }

  // ── Save to Assessment ────────────────────────────────────────
  const handleSave = async () => {
    setPhase('saving')
    try {
      const res = await fetch('/api/github/extract-and-save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ username: resolvedUsername }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Save failed')
      setPhase('saved')
      if (onSaved) onSaved(json.data)
    } catch (err) {
      setError(err.message)
      setPhase('error')
    }
  }

  const reset = () => {
    setPhase('idle')
    setData(null)
    setError('')
    setInput('')
    setResolvedUsername('')
  }

  return (
    <div style={{ width: '100%' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Header ────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <FiGithub size={22} color="#a855f7" />
        </div>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.15rem' }}>Passive Skill Extraction</h3>
          <p style={{ fontSize: '0.78rem', color: '#475569', lineHeight: 1.4 }}>
            Connect your GitHub to auto-detect skills, languages &amp; technical aptitude
          </p>
        </div>
      </div>

      {/* ── Input Form ────────────────────────────────────────── */}
      {(phase === 'idle' || phase === 'error') && (
        <form onSubmit={handleAnalyze}>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <FiGithub size={16} color="#475569" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                id="github-username-input"
                type="text"
                className="input-futuristic"
                placeholder="Username or https://github.com/your-username"
                value={input}
                onChange={e => setInput(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            <button type="submit" className="btn-primary" disabled={!input.trim()} style={{ whiteSpace: 'nowrap', opacity: !input.trim() ? 0.5 : 1 }}>
              <FiZap size={15} /> Analyze
            </button>
          </div>

          {phase === 'error' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: 'rgba(255,0,110,0.08)', border: '1px solid rgba(255,0,110,0.2)', borderRadius: '8px', marginBottom: '0.5rem' }}>
              <FiAlertCircle size={16} color="#ff006e" />
              <span style={{ fontSize: '0.825rem', color: '#ff006e' }}>{error}</span>
            </div>
          )}

          <p style={{ fontSize: '0.7rem', color: '#334155', marginTop: '0.5rem' }}>
            Uses GitHub public API · No authentication required · Results cached 10 min
          </p>
        </form>
      )}

      {/* ── Loading ───────────────────────────────────────────── */}
      {phase === 'loading' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2.5rem', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', border: '3px solid rgba(124,58,237,0.2)', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
              Fetching <span style={{ color: '#a855f7' }}>@{resolvedUsername}</span> from GitHub...
            </p>
            <p style={{ color: '#334155', fontSize: '0.75rem', marginTop: '0.25rem' }}>Analyzing repos, languages &amp; activity</p>
          </div>
        </div>
      )}

      {/* ── Results ───────────────────────────────────────────── */}
      {(phase === 'result' || phase === 'saving' || phase === 'saved') && data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Profile summary row */}
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'center', flex: 1, minWidth: '220px' }}>
              <img
                src={data.profile.avatarUrl}
                alt={data.profile.username}
                style={{ width: '56px', height: '56px', borderRadius: '50%', border: '2px solid rgba(124,58,237,0.4)', objectFit: 'cover' }}
              />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: '#e2e8f0' }}>{data.profile.name}</span>
                  <a href={data.profile.profileUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#475569', textDecoration: 'none' }}>
                    <FiExternalLink size={13} />
                  </a>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#7c3aed' }}>@{data.profile.username}</div>
                {data.profile.bio && (
                  <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: '0.2rem', maxWidth: '200px' }}>
                    {data.profile.bio.slice(0, 60)}{data.profile.bio.length > 60 ? '…' : ''}
                  </div>
                )}
              </div>
            </div>

            {/* Quick stats */}
            <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap' }}>
              {[
                { icon: FiCode, label: 'Repos', value: data.profile.publicRepos },
                { icon: FiUsers, label: 'Followers', value: data.profile.followers },
                { icon: FiStar, label: 'Stars', value: data.totalStars },
                { icon: FiGitBranch, label: 'Forks', value: data.totalForks },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} style={{ textAlign: 'center', minWidth: '52px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', marginBottom: '0.15rem' }}>
                    <Icon size={12} color="#475569" />
                    <span style={{ fontSize: '0.68rem', color: '#475569' }}>{label}</span>
                  </div>
                  <div className="font-display" style={{ fontSize: '1.1rem', fontWeight: 700, color: '#00d4ff' }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Score + Languages row */}
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <ScoreRing score={data.technicalAptitudeScore} />
              <span style={{ fontSize: '0.68rem', color: '#334155', textAlign: 'center', maxWidth: '120px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Technical Aptitude Score
              </span>
            </div>

            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#00d4ff', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Top Languages</div>
              {data.topLanguages.slice(0, 6).map(({ language, percentage }) => (
                <div key={language} style={{ marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: getLangColor(language), boxShadow: `0 0 6px ${getLangColor(language)}80` }} />
                      <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{language}</span>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#475569', fontFamily: 'var(--font-mono)' }}>{percentage}%</span>
                  </div>
                  <div style={{ height: '4px', background: 'rgba(255,255,255,0.04)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${percentage}%`, background: getLangColor(language), borderRadius: '2px', opacity: 0.85, transition: 'width 0.8s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Score Breakdown */}
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#7c3aed', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.875rem' }}>Score Breakdown</div>
            {Object.entries(data.scoreBreakdown).map(([key, { score, max, detail }]) => (
              <BreakdownBar key={key} label={BREAKDOWN_LABELS[key] || key} score={score} max={max} detail={detail} />
            ))}
          </div>

          {/* Primary Interests */}
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#00ff88', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <FiTrendingUp size={12} /> Detected Career Interests
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {data.primaryInterests.map(interest => (
                <span key={interest} className="badge badge-green" style={{ fontSize: '0.7rem' }}>{interest}</span>
              ))}
              {data.primaryInterests.length === 0 && (
                <span style={{ fontSize: '0.78rem', color: '#475569' }}>No interests detected — add more repos with diverse languages</span>
              )}
            </div>
          </div>

          {/* Pinned / Notable Repos */}
          {data.pinnedRepos.length > 0 && (
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Notable Repositories</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.625rem' }}>
                {data.pinnedRepos.map(repo => (
                  <a key={repo.name} href={repo.url} target="_blank" rel="noopener noreferrer" style={{
                    textDecoration: 'none', padding: '0.875rem',
                    background: 'rgba(6,13,24,0.6)', border: '1px solid rgba(0,212,255,0.08)',
                    borderRadius: '10px', display: 'block', transition: 'all 0.2s ease',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,212,255,0.25)'; e.currentTarget.style.background = 'rgba(0,212,255,0.04)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,212,255,0.08)'; e.currentTarget.style.background = 'rgba(6,13,24,0.6)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
                      <FiBookmark size={11} color="#00d4ff" />
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#00d4ff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{repo.name}</span>
                    </div>
                    {repo.description && (
                      <p style={{ fontSize: '0.68rem', color: '#475569', lineHeight: 1.4, marginBottom: '0.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {repo.description}
                      </p>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      {repo.language && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: getLangColor(repo.language) }} />
                          <span style={{ fontSize: '0.65rem', color: '#475569' }}>{repo.language}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <FiStar size={10} color="#475569" />
                        <span style={{ fontSize: '0.65rem', color: '#475569' }}>{repo.stars}</span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(0,212,255,0.08)' }}>
            <button onClick={reset} className="btn-secondary" style={{ fontSize: '0.825rem', padding: '0.6rem 1.25rem' }}>
              Try Another
            </button>
            {phase === 'saved' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.25)', borderRadius: '8px' }}>
                <FiCheck size={15} color="#00ff88" />
                <span style={{ fontSize: '0.825rem', color: '#00ff88', fontWeight: 600 }}>Saved to Assessment ✓</span>
              </div>
            ) : (
              <button
                onClick={handleSave}
                className="btn-primary"
                disabled={phase === 'saving'}
                style={{ fontSize: '0.825rem', padding: '0.6rem 1.5rem', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', opacity: phase === 'saving' ? 0.7 : 1 }}
              >
                {phase === 'saving'
                  ? <><div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Saving...</>
                  : <><FiCheck size={14} /> Save to Assessment</>
                }
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default GitHubExtractor
