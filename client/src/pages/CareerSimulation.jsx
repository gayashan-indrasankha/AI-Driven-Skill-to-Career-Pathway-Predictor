import { useState, useEffect } from 'react'
import { HiPlay, HiChartBar, HiClock, HiCurrencyDollar, HiTrendingUp } from 'react-icons/hi'
import { MdOutlineTimeline } from 'react-icons/md'
import { FiAlertCircle } from 'react-icons/fi'

const COLORS = ['#00d4ff', '#7c3aed', '#00ff88', '#ff006e', '#f59e0b', '#ec4899']

const pathwayColors = ['#00d4ff', '#7c3aed', '#00ff88', '#ff006e']

const CareerSimulation = () => {
  const [careers, setCareers] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [mySkills, setMySkills] = useState([])
  const [simResult, setSimResult] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}

      try {
        // Load careers from DB
        const careersRes = await fetch('/api/careers?limit=6', { headers })
        const careersJson = await careersRes.json()
        const careerList = careersJson.success
          ? (careersJson.data?.careers || careersJson.data || [])
          : []
        setCareers(careerList)

        // Load user skills from latest assessment
        if (token) {
          const aRes = await fetch('/api/assessment/my/latest', { headers }).catch(() => null)
          const aJson = aRes ? await aRes.json().catch(() => null) : null
          if (aJson?.success && aJson?.data) {
            const a = aJson.data
            const skills = [
              ...(a.skillRatings?.map(s => s.name) || []),
              ...(a.githubData?.topLanguages?.map(l => l.language) || []),
              ...(a.extractedInterests || []),
            ]
            setMySkills([...new Set(skills)])
          }
        }
      } catch (err) {
        setError('Could not load career data from server.')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const runSimulation = () => {
    if (!selectedId) return
    setIsRunning(true)
    setSimResult(null)

    setTimeout(() => {
      const career = careers.find(c => c._id === selectedId || c.id === selectedId)
      if (!career) { setIsRunning(false); return }

      const required = career.requiredSkills?.map(s => s.name) || []
      const matched = mySkills.filter(s => required.some(r => r.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(r.toLowerCase())))
      const gaps = required.filter(r => !mySkills.some(s => s.toLowerCase().includes(r.toLowerCase()) || r.toLowerCase().includes(s.toLowerCase())))
      const matchScore = required.length > 0 ? Math.round((matched.length / required.length) * 100) : 65
      const midSalary = career.salaryPotential?.midLevel
        ? Math.round((midSalary?.min || career.salaryPotential.midLevel.min) + (matchScore / 100) * ((career.salaryPotential.midLevel.max || 130000) - (career.salaryPotential.midLevel.min || 80000)))
        : 95000
      const projectedSalary = career.salaryPotential?.midLevel
        ? Math.round(career.salaryPotential.midLevel.min + (matchScore / 100) * (career.salaryPotential.midLevel.max - career.salaryPotential.midLevel.min))
        : 95000

      setSimResult({
        career,
        matched: matched.length ? matched : mySkills.slice(0, 3),
        gaps: gaps.slice(0, 6),
        matchScore,
        projectedSalary,
        monthsToReady: Math.max(2, gaps.length * 2),
        pathway: career.pathwaySteps?.length ? career.pathwaySteps : [
          { step: 1, title: 'Foundation', durationMonths: 3, description: 'Fill critical skill gaps identified by AI' },
          { step: 2, title: 'Development', durationMonths: 5, description: 'Build portfolio projects and earn certifications' },
          { step: 3, title: 'Application', durationMonths: 4, description: 'Apply to target roles and network actively' },
          { step: 4, title: 'Transition', durationMonths: 6, description: 'Land your first role and onboard successfully' },
        ],
        certifications: career.certifications || [],
      })
      setIsRunning(false)
    }, 1800)
  }

  return (
    <div className="section-pad" style={{ position: 'relative', zIndex: 1 }}>
      <div className="container-max">
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div className="badge badge-purple" style={{ margin: '0 auto 1rem', display: 'inline-flex' }}>
            <MdOutlineTimeline size={12} /> AI Simulation Engine
          </div>
          <h1 className="font-display" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 800, color: '#e2e8f0', letterSpacing: '-0.02em', marginBottom: '0.75rem' }}>
            Career <span className="gradient-text-purple">Simulation</span>
          </h1>
          <p style={{ color: '#64748b' }}>Model your career trajectory using real market data</p>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1.25rem', background: 'rgba(255,0,110,0.06)', border: '1px solid rgba(255,0,110,0.2)', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.82rem', color: '#ff6b9d' }}>
            <FiAlertCircle size={15} /> {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '1.5rem' }}>

          {/* Config Panel */}
          <div>
            <h2 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#94a3b8', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Configure Simulation</h2>
            <div className="glass-card" style={{ padding: '1.75rem' }}>

              {/* Career selector */}
              <div style={{ marginBottom: '1.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Target Career</label>
                {loading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                    {[1,2,3,4].map(i => <div key={i} style={{ height: '60px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px' }} />)}
                  </div>
                ) : careers.length === 0 ? (
                  <p style={{ color: '#475569', fontSize: '0.82rem' }}>No careers in database. <a href="#" onClick={() => fetch('/api/careers').then(r => r.json()).then(d => setCareers(d.data?.careers || []))} style={{ color: '#00d4ff' }}>Retry</a></p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                    {careers.map((career, i) => {
                      const id = career._id || career.id
                      const isSelected = selectedId === id
                      return (
                        <button key={id} onClick={() => { setSelectedId(id); setSimResult(null) }} style={{
                          padding: '1rem', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.25s ease',
                          border: '1px solid', textAlign: 'left',
                          borderColor: isSelected ? '#7c3aed' : 'rgba(124,58,237,0.15)',
                          background: isSelected ? 'rgba(124,58,237,0.12)' : 'rgba(6,13,24,0.5)',
                        }}>
                          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: isSelected ? '#a855f7' : '#94a3b8', marginBottom: '0.25rem' }}>{career.title}</div>
                          <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <span style={{ fontSize: '0.7rem', color: '#475569' }}>{career.industry}</span>
                            <span style={{ fontSize: '0.7rem', color: '#00ff88' }}>+{career.growthRate}% growth</span>
                            <span style={{ fontSize: '0.7rem', color: '#475569' }}>
                              ${Math.round((career.salaryPotential?.midLevel?.min || 80000)/1000)}K–${Math.round((career.salaryPotential?.midLevel?.max || 130000)/1000)}K
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Current skills */}
              <div style={{ marginBottom: '1.75rem', padding: '1rem', background: 'rgba(0,212,255,0.04)', borderRadius: '10px', border: '1px solid rgba(0,212,255,0.1)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Your Detected Skills {mySkills.length > 0 && `(${mySkills.length})`}
                </div>
                {mySkills.length === 0 ? (
                  <p style={{ fontSize: '0.75rem', color: '#475569' }}>
                    <a href="/assessment" style={{ color: '#00d4ff' }}>Complete assessment</a> or <a href="/assessment" style={{ color: '#7c3aed' }}>connect GitHub</a> to detect your skills
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {mySkills.slice(0, 12).map(skill => (
                      <span key={skill} className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>{skill}</span>
                    ))}
                  </div>
                )}
              </div>

              <button onClick={runSimulation} disabled={!selectedId || isRunning || loading} className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', opacity: !selectedId ? 0.5 : 1 }}>
                {isRunning
                  ? <><div style={{ width: '16px', height: '16px', border: '2px solid rgba(2,4,8,0.3)', borderTopColor: '#020408', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Simulating...</>
                  : <><HiPlay /> Run Simulation</>}
              </button>
            </div>
          </div>

          {/* Results Panel */}
          <div>
            <h2 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#94a3b8', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Simulation Results</h2>

            {isRunning && (
              <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', minHeight: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                <div style={{ width: '48px', height: '48px', border: '3px solid rgba(124,58,237,0.15)', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <p style={{ color: '#64748b' }}>Running AI analysis...</p>
              </div>
            )}

            {!simResult && !isRunning && (
              <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', minHeight: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                  <MdOutlineTimeline size={32} color="#7c3aed" />
                </div>
                <p style={{ color: '#475569', fontSize: '0.9rem' }}>Select a target career and run the simulation to see your personalized pathway analysis.</p>
              </div>
            )}

            {simResult && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                {/* Score row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                  {[
                    { icon: HiChartBar, label: 'Match Score', value: `${simResult.matchScore}%`, color: simResult.matchScore >= 70 ? '#00ff88' : simResult.matchScore >= 50 ? '#00d4ff' : '#f59e0b' },
                    { icon: HiClock, label: 'Time to Ready', value: `${simResult.monthsToReady}mo`, color: '#7c3aed' },
                    { icon: HiCurrencyDollar, label: 'Proj. Salary', value: `$${(simResult.projectedSalary / 1000).toFixed(0)}K`, color: '#00ff88' },
                  ].map(({ icon: Icon, label, value, color }) => (
                    <div key={label} className="glass-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
                      <Icon size={20} color={color} style={{ marginBottom: '0.5rem' }} />
                      <div className="font-display" style={{ fontSize: '1.4rem', fontWeight: 800, color, marginBottom: '0.2rem' }}>{value}</div>
                      <div style={{ fontSize: '0.7rem', color: '#475569' }}>{label}</div>
                    </div>
                  ))}
                </div>

                {/* Gap Analysis */}
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#94a3b8', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Skill Gap Analysis</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#00d4ff', fontWeight: 600, marginBottom: '0.6rem', letterSpacing: '0.08em' }}>✓ MATCHED SKILLS</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                        {simResult.matched.length ? simResult.matched.map(s => <span key={s} className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>{s}</span>) : <span style={{ fontSize: '0.78rem', color: '#334155' }}>Complete assessment to detect matches</span>}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#ff006e', fontWeight: 600, marginBottom: '0.6rem', letterSpacing: '0.08em' }}>✗ GAP SKILLS</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                        {simResult.gaps.length ? simResult.gaps.map(s => <span key={s} style={{ padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.65rem', fontWeight: 600, background: 'rgba(255,0,110,0.1)', border: '1px solid rgba(255,0,110,0.25)', color: '#ff006e' }}>{s}</span>) : <span style={{ fontSize: '0.78rem', color: '#00ff88' }}>✓ No gaps detected!</span>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Certifications */}
                {simResult.certifications.length > 0 && (
                  <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#94a3b8', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Recommended Certifications</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {simResult.certifications.slice(0, 3).map((cert, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0.875rem', background: 'rgba(0,212,255,0.04)', borderRadius: '8px', border: '1px solid rgba(0,212,255,0.08)' }}>
                          <div>
                            <div style={{ fontSize: '0.82rem', color: '#e2e8f0', fontWeight: 600 }}>{cert.name}</div>
                            <div style={{ fontSize: '0.7rem', color: '#475569' }}>{cert.issuer} · {cert.estimatedPrepTime}</div>
                          </div>
                          {cert.cost !== undefined && <span style={{ fontSize: '0.72rem', color: '#00ff88' }}>{cert.cost === 0 ? 'Free' : `$${cert.cost}`}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pathway Steps */}
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#94a3b8', marginBottom: '1.25rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Recommended Pathway</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {simResult.pathway.map(({ step, title, durationMonths, description }, i) => {
                      const color = pathwayColors[i % pathwayColors.length]
                      return (
                        <div key={step} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: `${color}20`, border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color, flexShrink: 0 }}>{step}</div>
                            {i < simResult.pathway.length - 1 && <div style={{ width: '2px', height: '24px', background: `${color}30`, marginTop: '4px' }} />}
                          </div>
                          <div style={{ paddingTop: '0.2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#e2e8f0' }}>{title}</span>
                              <span style={{ fontSize: '0.65rem', color: '#475569', fontFamily: 'var(--font-mono)' }}>{durationMonths} months</span>
                            </div>
                            <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.5 }}>{description}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default CareerSimulation
