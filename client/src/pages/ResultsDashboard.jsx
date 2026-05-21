import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { FiAward, FiBookOpen, FiBriefcase, FiCheckCircle, FiExternalLink, FiTarget, FiTrendingUp } from 'react-icons/fi'
import { MdCurrencyRupee } from 'react-icons/md'

const DEMO = [
  {
    matchScore: 88,
    confidenceLevel: 'very-high',
    gapSkills: ['MLOps', 'Statistics (raise to level 3)'],
    strengths: ['Python', 'Machine Learning', 'SQL', 'Communication'],
    estimatedTimeToReady: '4-8 months',
    careerPath: {
      title: 'AI and Machine Learning Solutions Engineer',
      industry: 'Information Technology',
      demandLevel: 'very-high',
      growthRate: 29,
      futureOutlook: 'booming',
      automationRisk: 12,
      salaryPotential: {
        entryLevel: { min: 180000, max: 350000 },
        midLevel: { min: 350000, max: 700000 },
        seniorLevel: { min: 700000, max: 1400000 },
        currency: 'LKR',
      },
      marketSignal: {
        sriLankaDemandScore: 94,
        employerTypes: ['ICT/BPM exporters', 'Banks and fintechs', 'AI startups'],
        businessUseCases: ['Tea leaf quality grading', 'Loan default prediction', 'Hospital triage analytics'],
        commercialValue: 'Customers pay when predictions reduce cost, risk, or processing time.',
        evidenceSummary: 'Sri Lanka ICT/BPM is a major service-export sector and SLASSCOM highlights AI and data skills as emerging priorities.',
        dataSources: [
          { label: 'EDB ICT/BPM National Export Strategy', url: 'https://www.srilankabusiness.com/national-export-strategy/nes-ict-bpm.html' },
          { label: 'SLASSCOM Employability Skills Report 2024', url: 'https://slasscom.lk/wp-content/uploads/2024/07/SLASSCOM-EMPLOYABILITY-SKILLS-REPORT-2024.pdf' },
        ],
      },
      prototypeIdeas: [{
        title: 'AI Tea Leaf Quality Grader',
        scientificPrinciple: 'Computer vision classification and statistical quality scoring.',
        targetCustomer: 'Small and medium tea factories',
        buildCostLkr: 65000,
        revenueModel: 'Monthly SaaS plus optional camera setup fee',
      }],
      learningResources: [
        { title: 'Machine Learning Specialization', provider: 'DeepLearning.AI', costLkr: 15000, durationWeeks: 10 },
        { title: 'MLOps Zoomcamp', provider: 'DataTalks.Club', costLkr: 0, durationWeeks: 8 },
      ],
      pathwaySteps: [
        { step: 1, title: 'Data and Python Foundation', durationMonths: 2, description: 'Learn Python, pandas, SQL, statistics, and model evaluation.' },
        { step: 2, title: 'Build Practical ML Projects', durationMonths: 3, description: 'Create models tied to agriculture, education, finance, or health.' },
        { step: 3, title: 'Deploy a Customer Demo', durationMonths: 2, description: 'Wrap the model in an API and dashboard with a measurable business metric.' },
        { step: 4, title: 'Pilot and Commercialize', durationMonths: 3, description: 'Run a pilot and refine pricing from user feedback.' },
      ],
    },
  },
]

const SCORE_COLORS = { 'very-high': '#00ff88', high: '#00d4ff', medium: '#f59e0b', low: '#ff006e' }
const fmtLkr = (value = 0) => `LKR ${(value / 1000).toFixed(0)}k`

const ScoreRing = ({ score, color }) => {
  const radius = 35
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  return (
    <div style={{ position: 'relative', width: 88, height: 88, flexShrink: 0 }}>
      <svg width="88" height="88" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="44" cy="44" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
        <circle cx="44" cy="44" r={radius} fill="none" stroke={color} strokeWidth="7" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color, fontWeight: 900 }}>
        {score}%
      </div>
    </div>
  )
}

const SalaryChart = ({ predictions }) => {
  const data = predictions.map(pred => ({
    name: pred.careerPath.title.split(' ').slice(0, 2).join(' '),
    Entry: Math.round((pred.careerPath.salaryPotential.entryLevel.min + pred.careerPath.salaryPotential.entryLevel.max) / 2),
    Mid: Math.round((pred.careerPath.salaryPotential.midLevel.min + pred.careerPath.salaryPotential.midLevel.max) / 2),
    Senior: Math.round((pred.careerPath.salaryPotential.seniorLevel.min + pred.careerPath.salaryPotential.seniorLevel.max) / 2),
  }))

  return (
    <ResponsiveContainer width="100%" height={230}>
      <BarChart data={data}>
        <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={fmtLkr} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: '#0d1117', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 8, color: '#e2e8f0' }}
          formatter={(value) => [fmtLkr(value), 'Monthly estimate']}
        />
        <Bar dataKey="Entry" fill="#7c3aed" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Mid" fill="#00d4ff" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Senior" fill="#00ff88" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

const InfoList = ({ icon: Icon, title, items, color = '#00d4ff' }) => (
  <div className="glass-card" style={{ padding: '1.25rem' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '0.85rem' }}>
      <Icon size={17} color={color} />
      <h3 style={{ fontSize: '0.95rem', color: '#e2e8f0', fontWeight: 800 }}>{title}</h3>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
      {items?.filter(Boolean).map(item => (
        <div key={item} style={{ display: 'flex', gap: '0.5rem', color: '#94a3b8', fontSize: '0.82rem', lineHeight: 1.45 }}>
          <FiCheckCircle size={13} color={color} style={{ marginTop: 3, flexShrink: 0 }} />
          <span>{item}</span>
        </div>
      ))}
    </div>
  </div>
)

const ResultsDashboard = () => {
  const [predictions, setPredictions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(0)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        setPredictions(DEMO)
        setNotice('Showing a judge-ready sample. Complete the assessment for your own match.')
        setLoading(false)
        return
      }

      try {
        const res = await fetch('/api/careers/predicted', { headers: { Authorization: `Bearer ${token}` } })
        const json = await res.json()
        if (json.success && json.data?.length) setPredictions(json.data.slice(0, 5))
        else {
          setPredictions(DEMO)
          setNotice('No assessment found yet, so this page is showing sample market data.')
        }
      } catch {
        setPredictions(DEMO)
        setNotice('Backend is offline, so this page is showing sample market data.')
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '60vh', color: '#64748b' }}>
        Loading career intelligence...
      </div>
    )
  }

  const active = predictions[selected] || predictions[0]
  const cp = active?.careerPath
  const prototype = cp?.prototypeIdeas?.[0]

  return (
    <div className="section-pad" style={{ position: 'relative', zIndex: 1 }}>
      <div className="container-max">
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div className="badge badge-cyan" style={{ display: 'inline-flex', marginBottom: '1rem' }}>Market-backed results</div>
          <h1 className="font-display" style={{ fontSize: 'clamp(1.8rem,4vw,2.9rem)', fontWeight: 900, color: '#e2e8f0', marginBottom: '0.75rem' }}>
            Skill-to-Career <span className="gradient-text-cyan">Commercial Pathway</span>
          </h1>
          <p style={{ color: '#94a3b8', maxWidth: 680, margin: '0 auto' }}>
            Recommendations combine readiness, Sri Lankan market demand, salary potential, employer types, and a science-to-business prototype angle.
          </p>
          {notice && <div style={{ marginTop: '1rem', color: '#f59e0b', fontSize: '0.8rem' }}>{notice}</div>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {predictions.map((pred, index) => {
            const color = SCORE_COLORS[pred.confidenceLevel] || '#00d4ff'
            const selectedCard = selected === index
            return (
              <button
                key={pred.careerPath?.title || index}
                onClick={() => setSelected(index)}
                style={{
                  all: 'unset',
                  cursor: 'pointer',
                  padding: '1.25rem',
                  borderRadius: 8,
                  background: selectedCard ? 'rgba(0,212,255,0.08)' : 'rgba(6,13,24,0.72)',
                  border: `1px solid ${selectedCard ? color : 'rgba(0,212,255,0.12)'}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <ScoreRing score={pred.matchScore} color={color} />
                  <div>
                    <div style={{ color: '#e2e8f0', fontWeight: 800, lineHeight: 1.25, marginBottom: '0.35rem' }}>{pred.careerPath?.title}</div>
                    <div style={{ color: '#64748b', fontSize: '0.78rem', marginBottom: '0.65rem' }}>{pred.careerPath?.industry}</div>
                    <div className="badge" style={{ color, border: `1px solid ${color}40`, background: `${color}15` }}>
                      {pred.confidenceLevel?.replace('-', ' ')} confidence
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {cp && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.15fr) minmax(320px,0.85fr)', gap: '1rem', marginBottom: '1rem' }}>
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                  <div>
                    <h2 style={{ color: '#e2e8f0', fontSize: '1.25rem', fontWeight: 900 }}>{cp.title}</h2>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: 720, marginTop: '0.4rem' }}>{cp.marketSignal?.evidenceSummary}</p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(80px,1fr))', gap: '0.65rem', minWidth: 300 }}>
                    {[
                      { label: 'Local demand', value: `${cp.marketSignal?.sriLankaDemandScore || 0}/100`, icon: FiTrendingUp },
                      { label: 'Growth', value: `${cp.growthRate}%`, icon: FiAward },
                      { label: 'Ready in', value: active.estimatedTimeToReady, icon: FiTarget },
                    ].map(({ label, value, icon: Icon }) => (
                      <div key={label} style={{ padding: '0.7rem', border: '1px solid rgba(0,212,255,0.1)', borderRadius: 8, background: 'rgba(0,212,255,0.04)' }}>
                        <Icon size={14} color="#00d4ff" />
                        <div style={{ color: '#e2e8f0', fontWeight: 800, fontSize: '0.9rem', marginTop: 4 }}>{value}</div>
                        <div style={{ color: '#64748b', fontSize: '0.66rem' }}>{label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: '0.9rem' }}>
                  <InfoList icon={FiBriefcase} title="Likely Customers" items={cp.marketSignal?.employerTypes} />
                  <InfoList icon={FiTarget} title="Business Use Cases" items={cp.marketSignal?.businessUseCases} color="#00ff88" />
                  <InfoList icon={FiCheckCircle} title="Your Strengths" items={active.strengths} color="#a855f7" />
                  <InfoList icon={FiBookOpen} title="Skill Gaps" items={active.gapSkills?.length ? active.gapSkills : ['No major gaps detected']} color="#f59e0b" />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="glass-card" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                    <MdCurrencyRupee color="#00ff88" />
                    <h3 style={{ color: '#e2e8f0', fontWeight: 800 }}>Monthly Salary Estimate</h3>
                  </div>
                  {[
                    ['Entry', cp.salaryPotential.entryLevel, '#7c3aed'],
                    ['Mid', cp.salaryPotential.midLevel, '#00d4ff'],
                    ['Senior', cp.salaryPotential.seniorLevel, '#00ff88'],
                  ].map(([label, band, color]) => (
                    <div key={label} style={{ marginBottom: '0.8rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.82rem' }}>
                        <span>{label}</span>
                        <strong style={{ color }}>{fmtLkr(band.min)} - {fmtLkr(band.max)}</strong>
                      </div>
                      <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 999, marginTop: 5 }}>
                        <div style={{ width: `${Math.min(100, (band.max / cp.salaryPotential.seniorLevel.max) * 100)}%`, height: '100%', borderRadius: 999, background: color }} />
                      </div>
                    </div>
                  ))}
                </div>

                {prototype && (
                  <div className="glass-card" style={{ padding: '1.25rem' }}>
                    <div className="badge badge-green" style={{ marginBottom: '0.8rem' }}>Prototype Pitch</div>
                    <h3 style={{ color: '#e2e8f0', fontWeight: 900, marginBottom: '0.55rem' }}>{prototype.title}</h3>
                    <p style={{ color: '#94a3b8', fontSize: '0.82rem', lineHeight: 1.5 }}>{prototype.scientificPrinciple}</p>
                    <div style={{ marginTop: '0.85rem', color: '#64748b', fontSize: '0.78rem', lineHeight: 1.65 }}>
                      Customer: {prototype.targetCustomer}<br />
                      Build cost: {fmtLkr(prototype.buildCostLkr)}<br />
                      Revenue: {prototype.revenueModel}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(280px,0.8fr)', gap: '1rem', marginBottom: '1rem' }}>
              <div className="glass-card" style={{ padding: '1.25rem' }}>
                <h3 style={{ color: '#e2e8f0', fontWeight: 800, marginBottom: '0.45rem' }}>LKR Salary Comparison</h3>
                <p style={{ color: '#64748b', fontSize: '0.78rem', marginBottom: '1rem' }}>Monthly gross estimates by career level, for local market planning.</p>
                <SalaryChart predictions={predictions} />
              </div>

              <div className="glass-card" style={{ padding: '1.25rem' }}>
                <h3 style={{ color: '#e2e8f0', fontWeight: 800, marginBottom: '0.85rem' }}>Market Sources</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {cp.marketSignal?.dataSources?.map(source => (
                    <a key={source.url || source.label} href={source.url} target="_blank" rel="noopener noreferrer" style={{ color: '#00d4ff', textDecoration: 'none', fontSize: '0.78rem', display: 'flex', gap: '0.45rem', alignItems: 'flex-start' }}>
                      <FiExternalLink size={13} style={{ marginTop: 3, flexShrink: 0 }} />
                      {source.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
              <h3 style={{ color: '#e2e8f0', fontWeight: 800, marginBottom: '1rem' }}>Practical Roadmap</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '0.9rem' }}>
                {cp.pathwaySteps?.map(step => (
                  <div key={step.step} style={{ border: '1px solid rgba(0,212,255,0.1)', borderRadius: 8, padding: '1rem', background: 'rgba(0,212,255,0.035)' }}>
                    <div style={{ color: '#00d4ff', fontWeight: 900, fontSize: '0.75rem', marginBottom: '0.4rem' }}>PHASE {step.step} - {step.durationMonths} MONTHS</div>
                    <h4 style={{ color: '#e2e8f0', fontWeight: 800, marginBottom: '0.35rem' }}>{step.title}</h4>
                    <p style={{ color: '#94a3b8', fontSize: '0.8rem', lineHeight: 1.5 }}>{step.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <a href="/assessment" className="btn-secondary">Retake Assessment</a>
          <a href="/simulation" className="btn-primary">Run Simulation</a>
        </div>
      </div>
    </div>
  )
}

export default ResultsDashboard
