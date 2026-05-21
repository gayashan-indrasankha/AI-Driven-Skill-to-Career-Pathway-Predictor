import { useState, useEffect } from 'react'
import { HiTrendingUp, HiLightningBolt, HiAcademicCap, HiChartBar } from 'react-icons/hi'
import { MdOutlineWorkOutline, MdOutlineSchool } from 'react-icons/md'
import { FiRefreshCw, FiAlertCircle } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'

// ── Fallback demo data (shown when not authenticated) ─────────────
const DEMO = {
  stats: { matchScore: '--', skillsCount: 0, growthRate: '--', pathsFound: 0 },
  careers: [],
  skills: [],
  nextSteps: [
    { step: 'Complete the Assessment to get personalized results', icon: MdOutlineSchool, color: '#00d4ff' },
    { step: 'Connect your GitHub for automatic skill detection', icon: HiLightningBolt, color: '#7c3aed' },
    { step: 'Run Career Simulation to explore pathways', icon: HiTrendingUp, color: '#00ff88' },
  ],
}

const fmtShortLkr = (value = 0) => `LKR ${Math.round((value || 0) / 1000)}k`

const StatCard = ({ icon: Icon, label, value, sub, color, loading }) => (
  <div className="glass-card" style={{ padding: '1.5rem' }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
      <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: `${color}15`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={22} color={color} />
      </div>
    </div>
    {loading
      ? <div style={{ height: '2rem', width: '60%', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', marginBottom: '0.5rem' }} />
      : <div className="font-display" style={{ fontSize: '1.75rem', fontWeight: 800, color, marginBottom: '0.25rem' }}>{value}</div>
    }
    <div style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 500 }}>{label}</div>
    {sub && <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.25rem' }}>{sub}</div>}
  </div>
)

const Dashboard = () => {
  const [data, setData] = useState(DEMO)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { token, isAuth } = useAuth()

  const fetchDashboard = async () => {
    setLoading(true)
    setError('')
    if (!token) { setLoading(false); return }

    try {
      // Fetch careers from seeded DB + user assessment in parallel
      const [careersRes, assessmentRes] = await Promise.all([
        fetch('/api/careers?limit=3', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/assessment/my/latest', { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
      ])

      const careersJson = await careersRes.json()
      const assessmentJson = assessmentRes ? await assessmentRes.json().catch(() => null) : null

      // Build career matches from DB data
      const COLORS = ['#00d4ff', '#7c3aed', '#00ff88']
      const careers = (careersJson.success ? careersJson.data?.careers || careersJson.data || [] : [])
        .slice(0, 3)
        .map((c, i) => ({
          title: c.title,
          match: assessmentJson?.data?.predictedCareers?.[i]?.matchScore || Math.round(90 - i * 8),
          industry: c.industry,
          salary: `${fmtShortLkr(c.salaryPotential?.midLevel?.min)}-${fmtShortLkr(c.salaryPotential?.midLevel?.max)}`,
          growth: `+${c.growthRate}%`,
          color: COLORS[i],
        }))

      // Build skill profile from assessment or seeded skills
      const assessment = assessmentJson?.data
      const skillRatings = assessment?.skillRatings?.length
        ? assessment.skillRatings.slice(0, 6)
        : assessment?.githubData?.topLanguages?.slice(0, 6).map(l => ({ name: l.language, proficiency: Math.round(l.percentage / 20), category: 'Technical' }))
        || []

      const topMatch = careers[0]?.match || 0
      const skillsCount = skillRatings.length || assessment?.githubData?.topLanguages?.length || 0

      setData({
        stats: {
          matchScore: careers.length ? `${topMatch}%` : '--',
          skillsCount: skillsCount || '--',
          growthRate: careers[0]?.growth || '--',
          pathsFound: careers.length || '--',
        },
        careers,
        skills: skillRatings.map(s => ({ name: s.name, level: s.proficiency || 3, category: s.category || 'Technical' })),
        nextSteps: [
          { step: careers[0] ? `Pursue ${careers[0].title} - your top match` : 'Complete Assessment for personalized matches', icon: MdOutlineSchool, color: '#00d4ff' },
          { step: assessment?.gapSkills?.length ? `Bridge skill gaps: ${assessment.gapSkills.slice(0,2).join(', ')}` : 'Connect GitHub to detect your skills automatically', icon: HiLightningBolt, color: '#7c3aed' },
          { step: 'Run Career Simulation for your top matched path', icon: HiTrendingUp, color: '#00ff88' },
        ],
      })
    } catch (err) {
      setError('Could not load live data. Showing demo.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDashboard() }, [])

  return (
    <div className="section-pad" style={{ position: 'relative', zIndex: 1 }}>
      <div className="container-max">

        {/* Header */}
        <div style={{ marginBottom: '2.5rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div className="badge badge-green" style={{ display: 'inline-flex', marginBottom: '0.75rem' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00ff88' }} />
              {isAuth ? 'Live Dashboard' : 'Demo Mode'}
            </div>
            <h1 className="font-display" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 800, color: '#e2e8f0', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
              Career <span className="gradient-text-cyan">Intelligence</span> Hub
            </h1>
            <p style={{ color: '#64748b' }}>Your personalized AI-driven career pathway overview</p>
          </div>
          <button onClick={fetchDashboard} style={{ background: 'transparent', border: '1px solid rgba(0,212,255,0.2)', borderRadius: '10px', padding: '0.5rem 1rem', cursor: 'pointer', color: '#00d4ff', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', transition: 'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,212,255,0.06)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <FiRefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Refresh
          </button>
        </div>

        {!isAuth && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.25rem', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '12px', marginBottom: '2rem' }}>
            <FiAlertCircle size={18} color="#f59e0b" />
            <span style={{ fontSize: '0.875rem', color: '#f59e0b' }}>Sign in to see your personalized career data. <a href="/assessment" style={{ color: '#00d4ff', textDecoration: 'underline' }}>Take the assessment →</a></span>
          </div>
        )}

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1.25rem', background: 'rgba(255,0,110,0.06)', border: '1px solid rgba(255,0,110,0.2)', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.82rem', color: '#ff6b9d' }}>
            <FiAlertCircle size={15} /> {error}
          </div>
        )}

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
          <StatCard loading={loading} icon={HiChartBar} label="Career Match Score" value={data.stats.matchScore} sub="Top predicted match" color="#00d4ff" />
          <StatCard loading={loading} icon={HiLightningBolt} label="Skills Detected" value={data.stats.skillsCount} sub="From assessment & GitHub" color="#7c3aed" />
          <StatCard loading={loading} icon={HiTrendingUp} label="Growth Potential" value={data.stats.growthRate} sub="Top career projected growth" color="#00ff88" />
          <StatCard loading={loading} icon={MdOutlineWorkOutline} label="Career Paths Found" value={data.stats.pathsFound} sub="AI-matched pathways" color="#ff006e" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.5rem' }}>

          {/* Career Matches */}
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#94a3b8', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Top Career Matches</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {loading ? [1,2,3].map(i => (
                <div key={i} className="glass-card" style={{ padding: '1.5rem', height: '110px', background: 'rgba(6,13,24,0.4)' }}>
                  <div style={{ height: '1rem', width: '50%', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', marginBottom: '0.75rem' }} />
                  <div style={{ height: '4px', background: 'rgba(255,255,255,0.04)', borderRadius: '2px' }} />
                </div>
              )) : data.careers.length === 0 ? (
                <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
                  <p style={{ color: '#475569', fontSize: '0.875rem' }}>No career matches yet. <a href="/assessment" style={{ color: '#00d4ff' }}>Complete your assessment →</a></p>
                </div>
              ) : data.careers.map(({ title, match, industry, salary, growth, color }) => (
                <div key={title} className="glass-card" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.25rem' }}>{title}</h3>
                      <span style={{ fontSize: '0.75rem', color: '#475569' }}>{industry}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="font-display" style={{ fontSize: '1.4rem', fontWeight: 800, color }}>{match}%</div>
                      <div style={{ fontSize: '0.7rem', color: '#475569' }}>match</div>
                    </div>
                  </div>
                  <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden', marginBottom: '1rem' }}>
                    <div style={{ height: '100%', width: `${match}%`, background: `linear-gradient(90deg, ${color}, ${color}aa)`, borderRadius: '2px', transition: 'width 1s ease' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#00ff88' }}>{growth} growth</span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{salary}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Skill Profile */}
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#94a3b8', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Skill Profile</h2>
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                {loading ? [1,2,3,4].map(i => (
                  <div key={i} style={{ marginBottom: '0.875rem' }}>
                    <div style={{ height: '0.75rem', width: '40%', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', marginBottom: '0.4rem' }} />
                    <div style={{ height: '5px', background: 'rgba(255,255,255,0.04)', borderRadius: '3px' }} />
                  </div>
                )) : data.skills.length === 0 ? (
                  <p style={{ color: '#475569', fontSize: '0.8rem', textAlign: 'center' }}>Connect GitHub or complete assessment to populate skills.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    {data.skills.map(({ name, level }) => (
                      <div key={name}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                          <span style={{ fontSize: '0.825rem', color: '#94a3b8' }}>{name}</span>
                          <span style={{ fontSize: '0.75rem', color: '#475569', fontFamily: 'var(--font-mono)' }}>{level}/5</span>
                        </div>
                        <div style={{ height: '5px', background: 'rgba(0,212,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${(level / 5) * 100}%`, background: level >= 4 ? 'linear-gradient(90deg,#00d4ff,#0099cc)' : level === 3 ? 'linear-gradient(90deg,#7c3aed,#a855f7)' : 'linear-gradient(90deg,#475569,#64748b)', borderRadius: '3px', transition: 'width 0.8s ease' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Next Steps */}
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#94a3b8', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Recommended Next Steps</h2>
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                {data.nextSteps.map(({ step, icon: Icon, color }, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem', padding: '0.875rem 0', borderBottom: i < 2 ? '1px solid rgba(0,212,255,0.06)' : 'none' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${color}12`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={16} color={color} />
                    </div>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5, paddingTop: '0.3rem' }}>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick nav */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap' }}>
          <a href="/assessment" className="btn-secondary" style={{ fontSize: '0.85rem' }}>Take Assessment</a>
          <a href="/results" className="btn-primary" style={{ fontSize: '0.85rem' }}>View Full Results</a>
          <a href="/nexus" className="btn-secondary" style={{ fontSize: '0.85rem', borderColor: 'rgba(124,58,237,0.4)', color: '#a855f7' }}>Ask PathGuide AI</a>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

export default Dashboard
