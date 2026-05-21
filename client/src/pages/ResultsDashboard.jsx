import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar, Cell,
} from 'recharts'
import { FiAward, FiTrendingUp, FiDollarSign, FiBookOpen, FiCheckCircle, FiRefreshCw } from 'react-icons/fi'

// ── Demo data (used when not authenticated) ──────────────────────
const DEMO = [
  {
    matchScore: 91, confidenceLevel: 'very-high',
    gapSkills: ['PyTorch', 'MLflow'],
    strengths: ['Python', 'Machine Learning', 'SQL'],
    estimatedTimeToReady: '3–6 months',
    careerPath: {
      title: 'Machine Learning Engineer', industry: 'Technology',
      demandLevel: 'very-high', growthRate: 28, futureOutlook: 'booming', automationRisk: 10,
      salaryPotential: { entryLevel: { min: 80000, max: 110000 }, midLevel: { min: 110000, max: 160000 }, seniorLevel: { min: 160000, max: 250000 }, currency: 'USD' },
      requiredDegrees: [{ level: 'bachelor', field: 'Computer Science' }],
      certifications: [{ name: 'TensorFlow Developer', issuer: 'Google', estimatedPrepTime: '3 months' }, { name: 'AWS ML Specialty', issuer: 'Amazon', estimatedPrepTime: '6 months' }],
      roles: [{ title: 'Junior ML Engineer', level: 'junior' }, { title: 'ML Engineer', level: 'mid' }, { title: 'Senior ML Engineer', level: 'senior' }],
      pathwaySteps: [
        { step: 1, title: 'Python & Math Foundations', durationMonths: 3, description: 'Master Python, linear algebra, and probability.' },
        { step: 2, title: 'ML Core Concepts', durationMonths: 3, description: 'Supervised/unsupervised learning and evaluation.' },
        { step: 3, title: 'Deep Learning & Frameworks', durationMonths: 3, description: 'TensorFlow, PyTorch, neural architectures.' },
        { step: 4, title: 'Deploy & Land First Role', durationMonths: 3, description: 'Build portfolio, deploy models, apply.' },
      ],
    },
  },
  {
    matchScore: 78, confidenceLevel: 'high',
    gapSkills: ['GraphQL', 'Docker'],
    strengths: ['JavaScript', 'React', 'Node.js'],
    estimatedTimeToReady: '2–4 months',
    careerPath: {
      title: 'Full Stack Developer', industry: 'Technology',
      demandLevel: 'very-high', growthRate: 23, futureOutlook: 'booming', automationRisk: 15,
      salaryPotential: { entryLevel: { min: 60000, max: 85000 }, midLevel: { min: 85000, max: 130000 }, seniorLevel: { min: 130000, max: 200000 }, currency: 'USD' },
      requiredDegrees: [{ level: 'bachelor', field: 'Computer Science or Bootcamp' }],
      certifications: [{ name: 'AWS Developer Associate', issuer: 'Amazon', estimatedPrepTime: '3 months' }],
      roles: [{ title: 'Junior Developer', level: 'junior' }, { title: 'Full Stack Developer', level: 'mid' }, { title: 'Tech Lead', level: 'lead' }],
      pathwaySteps: [
        { step: 1, title: 'HTML/CSS/JS Mastery', durationMonths: 2, description: 'Solidify web fundamentals.' },
        { step: 2, title: 'React & Frontend', durationMonths: 2, description: 'Component patterns and state management.' },
        { step: 3, title: 'Backend & APIs', durationMonths: 2, description: 'Node.js, Express, MongoDB.' },
        { step: 4, title: 'First Job', durationMonths: 2, description: 'Portfolio projects and applications.' },
      ],
    },
  },
  {
    matchScore: 64, confidenceLevel: 'medium',
    gapSkills: ['Tableau', 'R'],
    strengths: ['SQL', 'Statistics', 'Python'],
    estimatedTimeToReady: '4–6 months',
    careerPath: {
      title: 'Data Analyst', industry: 'Analytics',
      demandLevel: 'high', growthRate: 18, futureOutlook: 'growing', automationRisk: 25,
      salaryPotential: { entryLevel: { min: 50000, max: 70000 }, midLevel: { min: 70000, max: 100000 }, seniorLevel: { min: 100000, max: 140000 }, currency: 'USD' },
      requiredDegrees: [{ level: 'bachelor', field: 'Statistics or Business' }],
      certifications: [{ name: 'Google Data Analytics', issuer: 'Google', estimatedPrepTime: '6 months' }],
      roles: [{ title: 'Junior Analyst', level: 'junior' }, { title: 'Data Analyst', level: 'mid' }, { title: 'Lead Analyst', level: 'lead' }],
      pathwaySteps: [
        { step: 1, title: 'SQL & Excel', durationMonths: 2, description: 'Core data querying and analysis.' },
        { step: 2, title: 'Python & Statistics', durationMonths: 2, description: 'pandas, numpy, hypothesis testing.' },
        { step: 3, title: 'Visualization', durationMonths: 2, description: 'Tableau and Power BI dashboards.' },
        { step: 4, title: 'Portfolio & Certification', durationMonths: 2, description: 'Google cert and first applications.' },
      ],
    },
  },
]

// ── Helpers ───────────────────────────────────────────────────────
const SCORE_COLORS = { 'very-high': '#00ff88', high: '#00d4ff', medium: '#a855f7', low: '#ff006e' }
const fmt = (n) => `$${(n / 1000).toFixed(0)}k`

const useTooltipStyle = () => ({
  contentStyle: { background: '#0d1117', border: '1px solid rgba(0,212,255,0.2)', borderRadius: '10px', color: '#e2e8f0', fontSize: '0.78rem' },
  labelStyle: { color: '#94a3b8' },
})

// ── Match Score Ring ──────────────────────────────────────────────
const ScoreRing = ({ score, color, size = 80 }) => {
  const r = size / 2 - 7
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.2s ease', filter: `drop-shadow(0 0 6px ${color}80)` }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="font-display" style={{ fontSize: size > 70 ? '1.25rem' : '0.9rem', fontWeight: 900, color }}>{score}%</span>
      </div>
    </div>
  )
}

// ── Roadmap Timeline ──────────────────────────────────────────────
const Roadmap = ({ career }) => {
  const phases = [
    {
      icon: '🎓', label: 'EDUCATION', color: '#00d4ff',
      items: career.requiredDegrees.map(d => `${d.level.charAt(0).toUpperCase() + d.level.slice(1)}'s in ${d.field}`),
    },
    {
      icon: '📜', label: 'CERTIFICATIONS', color: '#a855f7',
      items: career.certifications.map(c => `${c.name} (${c.issuer}) · ${c.estimatedPrepTime}`),
    },
    {
      icon: '💼', label: 'FIRST ROLE', color: '#00ff88',
      items: [career.roles.find(r => r.level === 'junior' || r.level === 'entry')?.title || career.roles[0]?.title || ''],
    },
    ...career.pathwaySteps.map((s, i) => ({
      icon: `${s.step}`, label: `PHASE ${s.step}: ${s.title.toUpperCase()}`, color: '#f59e0b',
      items: [s.description, `Duration: ${s.durationMonths} months`],
    })),
  ]

  return (
    <div style={{ position: 'relative', paddingLeft: '2rem' }}>
      <div style={{ position: 'absolute', left: '11px', top: 0, bottom: 0, width: '2px', background: 'linear-gradient(180deg,#00d4ff,#7c3aed,#00ff88)', opacity: 0.3 }} />
      {phases.map((phase, i) => (
        <div key={i} style={{ position: 'relative', marginBottom: '1.5rem' }}>
          <div style={{ position: 'absolute', left: '-1.85rem', top: '0.1rem', width: '22px', height: '22px', borderRadius: '50%', background: phase.color + '20', border: `2px solid ${phase.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: phase.color, fontWeight: 700 }}>
            {i + 1}
          </div>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: phase.color, letterSpacing: '0.1em', marginBottom: '0.4rem' }}>{phase.label}</div>
          {phase.items.map((item, j) => item && (
            <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <FiCheckCircle size={12} color={phase.color} style={{ flexShrink: 0, marginTop: '2px', opacity: 0.7 }} />
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>{item}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

// ── Salary Chart ──────────────────────────────────────────────────
const SalaryChart = ({ predictions }) => {
  const tooltipStyle = useTooltipStyle()
  const data = predictions.map(p => ({
    name: p.careerPath.title.split(' ').slice(0, 2).join(' '),
    Entry: Math.round((p.careerPath.salaryPotential.entryLevel.min + p.careerPath.salaryPotential.entryLevel.max) / 2),
    Mid: Math.round((p.careerPath.salaryPotential.midLevel.min + p.careerPath.salaryPotential.midLevel.max) / 2),
    Senior: Math.round((p.careerPath.salaryPotential.seniorLevel.min + p.careerPath.salaryPotential.seniorLevel.max) / 2),
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barGap={4} barCategoryGap="30%">
        <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={fmt} tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip {...tooltipStyle} formatter={(v) => [`$${v.toLocaleString()}`, '']} />
        <Bar dataKey="Entry" fill="#7c3aed" radius={[4, 4, 0, 0]} name="Entry Level" />
        <Bar dataKey="Mid" fill="#00d4ff" radius={[4, 4, 0, 0]} name="Mid Level" />
        <Bar dataKey="Senior" fill="#00ff88" radius={[4, 4, 0, 0]} name="Senior Level" />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────
const ResultsDashboard = () => {
  const [predictions, setPredictions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem('token')
      if (!token) { setPredictions(DEMO); setLoading(false); return }
      try {
        const res = await fetch('/api/careers/predicted', { headers: { Authorization: `Bearer ${token}` } })
        const json = await res.json()
        if (json.success && json.data?.length) setPredictions(json.data.slice(0, 3))
        else { setPredictions(DEMO); setError('Using demo data — complete an assessment for real predictions.') }
      } catch { setPredictions(DEMO); setError('Backend offline — showing demo data.') }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
      <div style={{ width: '48px', height: '48px', border: '3px solid rgba(0,212,255,0.15)', borderTopColor: '#00d4ff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: '#475569' }}>Loading your career predictions...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const active = predictions[selected]
  const cp = active?.careerPath

  return (
    <div className="section-pad" style={{ position: 'relative', zIndex: 1 }}>
      <div className="container-max">

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div className="badge badge-cyan" style={{ display: 'inline-flex', margin: '0 auto 1rem' }}>AI Predictions</div>
          <h1 className="font-display" style={{ fontSize: 'clamp(1.75rem,4vw,2.75rem)', fontWeight: 900, color: '#e2e8f0', letterSpacing: '-0.02em', marginBottom: '0.75rem' }}>
            Your Career <span className="gradient-text-cyan">Pathway Results</span>
          </h1>
          <p style={{ color: '#64748b', maxWidth: '480px', margin: '0 auto' }}>AI-analyzed predictions based on your skills, interests & GitHub activity</p>
          {error && <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', padding: '0.5rem 1rem', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '8px', fontSize: '0.78rem', color: '#f59e0b' }}>{error}</div>}
        </div>

        {/* Top 3 Career Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
          {predictions.map((pred, i) => {
            const color = SCORE_COLORS[pred.confidenceLevel] || '#00d4ff'
            const isActive = selected === i
            return (
              <button key={i} onClick={() => setSelected(i)} style={{
                all: 'unset', cursor: 'pointer', display: 'block',
                padding: '1.75rem', borderRadius: '16px',
                background: isActive ? `rgba(0,0,0,0.5)` : 'rgba(6,13,24,0.7)',
                border: `1px solid ${isActive ? color : 'rgba(0,212,255,0.1)'}`,
                boxShadow: isActive ? `0 0 30px ${color}20` : 'none',
                transition: 'all 0.3s ease',
                position: 'relative', overflow: 'hidden',
              }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.borderColor = 'rgba(0,212,255,0.3)' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.borderColor = 'rgba(0,212,255,0.1)' }}>

                {/* Rank badge */}
                <div style={{ position: 'absolute', top: '1rem', right: '1rem', width: '28px', height: '28px', borderRadius: '50%', background: i === 0 ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${i === 0 ? '#f59e0b' : 'rgba(255,255,255,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: i === 0 ? '#f59e0b' : '#475569' }}>#{i + 1}</div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.25rem' }}>
                  <ScoreRing score={pred.matchScore} color={color} size={72} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.25rem', lineHeight: 1.3 }}>{pred.careerPath?.title}</div>
                    <div style={{ fontSize: '0.75rem', color: '#475569', marginBottom: '0.5rem' }}>{pred.careerPath?.industry}</div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.6rem', borderRadius: '20px', background: `${color}15`, border: `1px solid ${color}30`, fontSize: '0.65rem', color, fontWeight: 700 }}>
                      {pred.confidenceLevel?.replace('-', ' ').toUpperCase()} MATCH
                    </div>
                  </div>
                </div>

                {/* Stats row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.625rem', marginBottom: '1rem' }}>
                  {[
                    { label: 'Growth', value: `${pred.careerPath?.growthRate}%`, icon: FiTrendingUp },
                    { label: 'Demand', value: pred.careerPath?.demandLevel?.replace('-', ' '), icon: FiAward },
                    { label: 'To Ready', value: pred.estimatedTimeToReady?.split('–')[0] + '+mo', icon: FiRefreshCw },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} style={{ textAlign: 'center', padding: '0.5rem', background: 'rgba(0,212,255,0.04)', borderRadius: '8px', border: '1px solid rgba(0,212,255,0.08)' }}>
                      <Icon size={12} color="#475569" />
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', marginTop: '0.2rem' }}>{value}</div>
                      <div style={{ fontSize: '0.6rem', color: '#334155' }}>{label}</div>
                    </div>
                  ))}
                </div>

                {/* Strengths */}
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#334155', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Your Strengths</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {pred.strengths?.slice(0, 3).map(s => (
                      <span key={s} style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)', borderRadius: '20px', color: '#00ff88' }}>{s}</span>
                    ))}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Detail Section */}
        {cp && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.1fr) minmax(0,0.9fr)', gap: '1.5rem', marginBottom: '2rem' }}>

            {/* Left: Roadmap */}
            <div className="glass-card" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.75rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FiBookOpen size={18} color="#00d4ff" />
                </div>
                <div>
                  <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.1rem' }}>Dynamic Roadmap</h2>
                  <p style={{ fontSize: '0.72rem', color: '#475569' }}>{cp.title} · End-to-end pathway</p>
                </div>
              </div>
              <Roadmap career={cp} />
            </div>

            {/* Right: Salary + Gap */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Salary card */}
              <div className="glass-card" style={{ padding: '1.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FiDollarSign size={18} color="#00ff88" />
                  </div>
                  <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#e2e8f0' }}>Salary Potential</h2>
                </div>

                {/* Salary tiers */}
                {[
                  { label: 'Entry Level', data: cp.salaryPotential.entryLevel, color: '#7c3aed' },
                  { label: 'Mid Level', data: cp.salaryPotential.midLevel, color: '#00d4ff' },
                  { label: 'Senior Level', data: cp.salaryPotential.seniorLevel, color: '#00ff88' },
                ].map(({ label, data, color }) => (
                  <div key={label} style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                      <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{label}</span>
                      <span className="font-display" style={{ fontSize: '0.85rem', color, fontWeight: 700 }}>{fmt(data.min)} – {fmt(data.max)}</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.04)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(data.max / (cp.salaryPotential.seniorLevel.max || 1)) * 100}%`, background: color, borderRadius: '3px', opacity: 0.8 }} />
                    </div>
                  </div>
                ))}

                <div style={{ marginTop: '0.5rem', padding: '0.625rem', background: 'rgba(0,255,136,0.06)', borderRadius: '8px', border: '1px solid rgba(0,255,136,0.15)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: '#475569', marginBottom: '0.2rem' }}>PEAK EARNING POTENTIAL</div>
                  <div className="font-display" style={{ fontSize: '1.5rem', fontWeight: 900, color: '#00ff88' }}>
                    {fmt(cp.salaryPotential.seniorLevel.max)}
                    <span style={{ fontSize: '0.75rem', color: '#475569', fontFamily: 'inherit' }}>/yr</span>
                  </div>
                </div>
              </div>

              {/* Skill Gap */}
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '1rem' }}>Skills Gap to Bridge</h3>
                {predictions[selected]?.gapSkills?.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {predictions[selected].gapSkills.map(s => (
                      <span key={s} style={{ fontSize: '0.72rem', padding: '0.3rem 0.7rem', background: 'rgba(255,0,110,0.08)', border: '1px solid rgba(255,0,110,0.2)', borderRadius: '20px', color: '#ff6b9d' }}>+ {s}</span>
                    ))}
                  </div>
                ) : <p style={{ fontSize: '0.8rem', color: '#00ff88' }}>✓ You already have all required skills!</p>}
              </div>
            </div>
          </div>
        )}

        {/* Salary Comparison Chart */}
        <div className="glass-card" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.5rem' }}>Salary Comparison Across Paths</h2>
          <p style={{ fontSize: '0.75rem', color: '#475569', marginBottom: '1.5rem' }}>Average salary by career level (USD)</p>
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', marginBottom: '1rem' }}>
            {[{color:'#7c3aed',label:'Entry'},{color:'#00d4ff',label:'Mid'},{color:'#00ff88',label:'Senior'}].map(({color,label}) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: color }} />
                <span style={{ fontSize: '0.72rem', color: '#475569' }}>{label}</span>
              </div>
            ))}
          </div>
          <SalaryChart predictions={predictions} />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/assessment" className="btn-secondary">Retake Assessment</a>
          <a href="/simulation" className="btn-primary">Run Career Simulation →</a>
        </div>

      </div>
    </div>
  )
}

export default ResultsDashboard
