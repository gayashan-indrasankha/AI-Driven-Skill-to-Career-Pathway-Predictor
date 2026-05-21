import { useEffect, useMemo, useState } from 'react'
import { HiChartBar, HiClock, HiPlay, HiTrendingUp } from 'react-icons/hi'
import { MdCurrencyRupee, MdOutlineScience, MdOutlineTimeline } from 'react-icons/md'
import { FiAlertCircle, FiBookOpen, FiBriefcase, FiCheckCircle, FiExternalLink, FiRefreshCw, FiTarget } from 'react-icons/fi'

const DEFAULT_SKILLS = [
  { name: 'Python', proficiency: 3 },
  { name: 'SQL', proficiency: 3 },
  { name: 'Data Analysis', proficiency: 3 },
  { name: 'Communication', proficiency: 4 },
  { name: 'Problem Solving', proficiency: 4 },
]

const scoreColor = (score) => score >= 80 ? '#00ff88' : score >= 60 ? '#00d4ff' : score >= 40 ? '#f59e0b' : '#ff006e'
const fmtLkr = (value = 0) => `LKR ${Math.round(value).toLocaleString('en-LK')}`
const fmtShortLkr = (value = 0) => `LKR ${(value / 1000).toFixed(0)}k`

const normalizeSkill = (skill) => skill.toString().trim().toLowerCase()

const scoreCareerAgainstProfile = (career, skills = [], interests = []) => {
  const skillKeys = skills.map(skill => normalizeSkill(skill.name || skill))
  const interestKeys = interests.map(normalizeSkill)
  const requiredHits = (career.requiredSkills || []).filter(required =>
    skillKeys.some(skill => normalizeSkill(required.name).includes(skill) || skill.includes(normalizeSkill(required.name)))
  ).length
  const tagHits = (career.tags || []).filter(tag =>
    [...skillKeys, ...interestKeys].some(key => normalizeSkill(tag).includes(key) || key.includes(normalizeSkill(tag)))
  ).length
  const marketScore = (career.marketSignal?.sriLankaDemandScore || 50) / 20

  return requiredHits * 12 + tagHits * 5 + marketScore
}

const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <div className="glass-card" style={{ padding: '1.1rem', borderRadius: 8 }}>
    <Icon size={22} color={color} style={{ marginBottom: '0.6rem' }} />
    <div className="font-display" style={{ color, fontSize: '1.28rem', fontWeight: 900, lineHeight: 1.2 }}>{value}</div>
    <div style={{ color: '#94a3b8', fontSize: '0.78rem', marginTop: '0.25rem' }}>{label}</div>
    {sub && <div style={{ color: '#475569', fontSize: '0.68rem', marginTop: '0.15rem' }}>{sub}</div>}
  </div>
)

const SkillPill = ({ skill, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      border: '1px solid',
      borderColor: active ? 'rgba(0,255,136,0.35)' : 'rgba(0,212,255,0.14)',
      background: active ? 'rgba(0,255,136,0.09)' : 'rgba(6,13,24,0.55)',
      color: active ? '#00ff88' : '#94a3b8',
      borderRadius: 999,
      padding: '0.32rem 0.7rem',
      fontSize: '0.72rem',
      fontWeight: 700,
      cursor: 'pointer',
    }}
  >
    {active ? '✓ ' : '+ '}{skill}
  </button>
)

const CareerSimulation = () => {
  const [careers, setCareers] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [mySkills, setMySkills] = useState(DEFAULT_SKILLS)
  const [customSkill, setCustomSkill] = useState('')
  const [timelineMonths, setTimelineMonths] = useState(12)
  const [simResult, setSimResult] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [usingDemoProfile, setUsingDemoProfile] = useState(true)
  const [selectorNote, setSelectorNote] = useState('')

  const selectedCareer = useMemo(
    () => careers.find(career => (career._id || career.id) === selectedId),
    [careers, selectedId]
  )

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError('')
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}

      try {
        let profileSkills = token ? [] : DEFAULT_SKILLS
        let profileInterests = []
        let hasUserProfile = false
        let relatedCareers = []

        if (token) {
          const assessmentRes = await fetch('/api/assessment/my/latest', { headers }).catch(() => null)
          const assessmentJson = assessmentRes ? await assessmentRes.json().catch(() => null) : null
          if (assessmentJson?.success && assessmentJson?.data) {
            const assessment = assessmentJson.data
            hasUserProfile = true
            const skills = [
              ...(assessment.skillRatings?.map(skill => ({ name: skill.name, proficiency: skill.proficiency || 3 })) || []),
              ...(assessment.githubData?.topLanguages?.map(lang => ({ name: lang.language, proficiency: Math.max(1, Math.ceil((lang.percentage || 20) / 20)) })) || []),
            ]
            const unique = []
            const seen = new Set()
            skills.forEach(skill => {
              const key = normalizeSkill(skill.name)
              if (!seen.has(key)) {
                unique.push(skill)
                seen.add(key)
              }
            })
            if (unique.length) {
              setMySkills(unique)
              profileSkills = unique
              setUsingDemoProfile(false)
            }
            profileInterests = assessment.extractedInterests || []
          }

          const predictedRes = await fetch('/api/careers/predicted', { headers }).catch(() => null)
          const predictedJson = predictedRes ? await predictedRes.json().catch(() => null) : null
          if (predictedJson?.success && predictedJson?.data?.length) {
            relatedCareers = predictedJson.data
              .filter(prediction => prediction.careerPath)
              .map(prediction => ({
                ...prediction.careerPath,
                simulationMatchScore: prediction.matchScore,
                simulationReason: `${prediction.matchScore}% match from your assessment`,
                simulationStrengths: prediction.strengths || [],
                simulationGaps: prediction.gapSkills || [],
              }))
              .slice(0, 5)
            setSelectorNote('Showing only careers matched to your latest assessment.')
          }
        }

        if (!relatedCareers.length) {
          if (token && !hasUserProfile) {
            setCareers([])
            setSelectedId('')
            setSelectorNote('Complete the assessment first so simulation options can be tailored to your profile.')
            return
          }

          const careersRes = await fetch('/api/careers?limit=20', { headers })
          const careersJson = await careersRes.json()
          const careerList = careersJson.success ? (careersJson.data?.careers || careersJson.data || []) : []

          relatedCareers = careerList
            .map(career => ({
              ...career,
              relevanceScore: scoreCareerAgainstProfile(career, profileSkills, profileInterests),
            }))
            .filter(career => career.relevanceScore > 8)
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .slice(0, token ? 5 : 3)
            .map(career => ({
              ...career,
              simulationReason: token
                ? 'Related to your saved skills and interests'
                : 'Related to the demo learner profile',
            }))

          setSelectorNote(token
            ? 'No analyzed assessment matches found yet, so these are filtered by your saved skills and interests.'
            : 'Demo mode: options are filtered to the sample learner skills. Complete an assessment for your own options.')
        }

        setCareers(relatedCareers)
        setSelectedId(relatedCareers[0]?._id || relatedCareers[0]?.id || '')
      } catch {
        setError('Could not load simulation data from the server.')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const hasSkill = (skillName) => mySkills.some(skill => normalizeSkill(skill.name) === normalizeSkill(skillName))

  const toggleSkill = (skillName) => {
    setMySkills(prev => {
      if (prev.some(skill => normalizeSkill(skill.name) === normalizeSkill(skillName))) {
        return prev.filter(skill => normalizeSkill(skill.name) !== normalizeSkill(skillName))
      }
      return [...prev, { name: skillName, proficiency: 3 }]
    })
    setSimResult(null)
  }

  const addCustomSkill = () => {
    const skill = customSkill.trim()
    if (!skill || hasSkill(skill)) return
    setMySkills(prev => [...prev, { name: skill, proficiency: 3 }])
    setCustomSkill('')
    setSimResult(null)
  }

  const runSimulation = async () => {
    if (!selectedId) return
    setIsRunning(true)
    setSimResult(null)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/simulation/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ careerId: selectedId, currentSkills: mySkills, timelineMonths }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Simulation failed')
      setSimResult(json.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="section-pad" style={{ position: 'relative', zIndex: 1 }}>
      <div className="container-max">
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div className="badge badge-purple" style={{ margin: '0 auto 1rem', display: 'inline-flex' }}>
            <MdOutlineTimeline size={13} /> Science-to-Business Simulation
          </div>
          <h1 className="font-display" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 900, color: '#e2e8f0', marginBottom: '0.75rem' }}>
            Career <span className="gradient-text-purple">Commercial Simulator</span>
          </h1>
          <p style={{ color: '#94a3b8', maxWidth: 720, margin: '0 auto' }}>
            Simulate a learner's path from current skills to job readiness, prototype launch, LKR investment, and local market value.
          </p>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1.25rem', background: 'rgba(255,0,110,0.06)', border: '1px solid rgba(255,0,110,0.2)', borderRadius: 8, marginBottom: '1.5rem', fontSize: '0.82rem', color: '#ff6b9d' }}>
            <FiAlertCircle size={15} /> {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px,0.85fr) minmax(0,1.35fr)', gap: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '0.82rem', fontWeight: 800, color: '#94a3b8', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Simulation Inputs</h2>
            <div className="glass-card" style={{ padding: '1.4rem', borderRadius: 8 }}>
              <div style={{ marginBottom: '1.35rem' }}>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Target Career</label>
                {selectorNote && (
                  <div style={{ color: '#64748b', fontSize: '0.74rem', lineHeight: 1.45, marginBottom: '0.75rem', padding: '0.65rem 0.75rem', border: '1px solid rgba(0,212,255,0.1)', borderRadius: 8, background: 'rgba(0,212,255,0.035)' }}>
                    {selectorNote}
                  </div>
                )}
                {loading ? (
                  <div style={{ color: '#64748b', fontSize: '0.85rem' }}>Loading career paths...</div>
                ) : careers.length === 0 ? (
                  <div style={{ color: '#f59e0b', fontSize: '0.82rem', lineHeight: 1.5 }}>
                    No related simulation options yet. Complete the assessment so this page can tailor careers to your profile.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', maxHeight: 360, overflowY: 'auto', paddingRight: 3 }}>
                    {careers.map(career => {
                      const id = career._id || career.id
                      const isSelected = selectedId === id
                      return (
                        <button
                          key={id}
                          onClick={() => { setSelectedId(id); setSimResult(null) }}
                          style={{
                            padding: '0.9rem',
                            borderRadius: 8,
                            cursor: 'pointer',
                            border: '1px solid',
                            textAlign: 'left',
                            borderColor: isSelected ? '#7c3aed' : 'rgba(124,58,237,0.15)',
                            background: isSelected ? 'rgba(124,58,237,0.12)' : 'rgba(6,13,24,0.5)',
                          }}
                        >
                          <div style={{ fontSize: '0.88rem', fontWeight: 800, color: isSelected ? '#a855f7' : '#cbd5e1', lineHeight: 1.25 }}>{career.title}</div>
                          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', marginTop: '0.45rem' }}>
                            <span style={{ fontSize: '0.68rem', color: '#64748b' }}>{career.industry}</span>
                            <span style={{ fontSize: '0.68rem', color: '#00ff88' }}>+{career.growthRate}% growth</span>
                            <span style={{ fontSize: '0.68rem', color: '#00d4ff' }}>{fmtShortLkr(career.salaryPotential?.midLevel?.min)}-{fmtShortLkr(career.salaryPotential?.midLevel?.max)}</span>
                          </div>
                          {career.simulationReason && (
                            <div style={{ fontSize: '0.68rem', color: isSelected ? '#c4b5fd' : '#64748b', marginTop: '0.38rem' }}>
                              {career.simulationReason}
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '1.35rem' }}>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Timeline</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.5rem' }}>
                  {[6, 12, 18].map(months => (
                    <button
                      key={months}
                      onClick={() => { setTimelineMonths(months); setSimResult(null) }}
                      style={{
                        border: '1px solid',
                        borderColor: timelineMonths === months ? '#00d4ff' : 'rgba(0,212,255,0.16)',
                        background: timelineMonths === months ? 'rgba(0,212,255,0.1)' : 'transparent',
                        color: timelineMonths === months ? '#00d4ff' : '#64748b',
                        borderRadius: 8,
                        padding: '0.6rem',
                        cursor: 'pointer',
                        fontWeight: 800,
                      }}
                    >
                      {months} mo
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '1.35rem', padding: '1rem', background: 'rgba(0,212,255,0.04)', borderRadius: 8, border: '1px solid rgba(0,212,255,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Learner Skills ({mySkills.length})
                  </div>
                  {usingDemoProfile && <span style={{ fontSize: '0.68rem', color: '#f59e0b' }}>demo profile</span>}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.9rem' }}>
                  {mySkills.map(skill => (
                    <SkillPill key={skill.name} skill={`${skill.name} L${skill.proficiency}`} active onClick={() => toggleSkill(skill.name)} />
                  ))}
                </div>

                {selectedCareer?.requiredSkills?.length > 0 && (
                  <>
                    <div style={{ color: '#64748b', fontSize: '0.72rem', marginBottom: '0.45rem' }}>Add/remove target skills:</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.85rem' }}>
                      {selectedCareer.requiredSkills.map(skill => (
                        <SkillPill key={skill.name} skill={skill.name} active={hasSkill(skill.name)} onClick={() => toggleSkill(skill.name)} />
                      ))}
                    </div>
                  </>
                )}

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    className="input-futuristic"
                    value={customSkill}
                    onChange={event => setCustomSkill(event.target.value)}
                    onKeyDown={event => event.key === 'Enter' && addCustomSkill()}
                    placeholder="Add another skill"
                    style={{ fontSize: '0.78rem' }}
                  />
                  <button type="button" onClick={addCustomSkill} className="btn-secondary" style={{ padding: '0.55rem 0.85rem', fontSize: '0.78rem' }}>Add</button>
                </div>
              </div>

              <button onClick={runSimulation} disabled={!selectedId || isRunning || loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', opacity: !selectedId || isRunning || loading ? 0.55 : 1 }}>
                {isRunning
                  ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(2,4,8,0.3)', borderTopColor: '#020408', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Simulating...</>
                  : <><HiPlay /> Run LKR Simulation</>}
              </button>
            </div>
          </div>

          <div>
            <h2 style={{ fontSize: '0.82rem', fontWeight: 800, color: '#94a3b8', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Simulation Output</h2>

            {!simResult && !isRunning && (
              <div className="glass-card" style={{ padding: '3rem 1.5rem', textAlign: 'center', minHeight: 430, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
                <div style={{ width: 64, height: 64, borderRadius: 12, background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.2rem' }}>
                  <MdOutlineScience size={32} color="#a855f7" />
                </div>
                <h3 style={{ color: '#e2e8f0', marginBottom: '0.45rem', fontWeight: 900 }}>Ready to simulate</h3>
                <p style={{ color: '#64748b', fontSize: '0.88rem', maxWidth: 520 }}>
                  Select a Sri Lanka-focused career, tune the learner profile, and run the model to show judges a practical path to employability and commercialization.
                </p>
              </div>
            )}

            {isRunning && (
              <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', minHeight: 430, display: 'grid', placeItems: 'center', borderRadius: 8 }}>
                <div>
                  <div style={{ width: 48, height: 48, border: '3px solid rgba(124,58,237,0.15)', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
                  <p style={{ color: '#94a3b8' }}>Calculating readiness, LKR salary, and commercial break-even...</p>
                </div>
              </div>
            )}

            {simResult && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '0.85rem' }}>
                  <StatCard icon={HiChartBar} label="Readiness" value={`${simResult.readinessScore}%`} color={scoreColor(simResult.readinessScore)} sub={`Skills ${simResult.skillScore}%`} />
                  <StatCard icon={HiTrendingUp} label="Local Demand" value={`${simResult.marketScore}/100`} color="#00d4ff" sub={simResult.career.demandLevel?.replace('-', ' ')} />
                  <StatCard icon={HiClock} label="Time to Ready" value={`${simResult.monthsToReady} mo`} color="#a855f7" sub={`${timelineMonths} mo plan`} />
                  <StatCard icon={MdCurrencyRupee} label="Projected Monthly Salary" value={fmtShortLkr(simResult.projectedSalaryLkrMonthly)} color="#00ff88" sub="LKR only" />
                </div>

                <div className="glass-card" style={{ padding: '1.25rem', borderRadius: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.9rem' }}>
                    <FiTarget color="#00d4ff" />
                    <h3 style={{ color: '#e2e8f0', fontWeight: 900 }}>Skill Gap and Readiness</h3>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <div style={{ color: '#00ff88', fontSize: '0.72rem', fontWeight: 900, marginBottom: '0.55rem' }}>MATCHED</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {simResult.matchedSkills.length
                          ? simResult.matchedSkills.map(skill => <span key={skill.name} className="badge badge-green" style={{ fontSize: '0.68rem' }}>{skill.name} {skill.fit}%</span>)
                          : <span style={{ color: '#64748b', fontSize: '0.78rem' }}>No direct matches yet</span>}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#f59e0b', fontSize: '0.72rem', fontWeight: 900, marginBottom: '0.55rem' }}>GAPS TO BRIDGE</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {simResult.gapSkills.length
                          ? simResult.gapSkills.map(skill => <span key={skill.name} style={{ padding: '0.22rem 0.58rem', borderRadius: 999, fontSize: '0.68rem', fontWeight: 700, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.22)', color: '#f59e0b' }}>{skill.name} L{skill.currentLevel}→L{skill.requiredLevel}</span>)
                          : <span style={{ color: '#00ff88', fontSize: '0.78rem' }}>All core skills are covered</span>}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(280px,0.8fr)', gap: '1rem' }}>
                  <div className="glass-card" style={{ padding: '1.25rem', borderRadius: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                      <MdCurrencyRupee color="#00ff88" />
                      <h3 style={{ color: '#e2e8f0', fontWeight: 900 }}>LKR Commercial Projection</h3>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '0.75rem', color: '#94a3b8', fontSize: '0.82rem' }}>
                      <div>
                        <div style={{ color: '#475569', fontSize: '0.68rem' }}>Prototype</div>
                        <strong style={{ color: '#e2e8f0' }}>{simResult.commercialProjection.prototypeTitle}</strong>
                      </div>
                      <div>
                        <div style={{ color: '#475569', fontSize: '0.68rem' }}>Target customer</div>
                        <strong style={{ color: '#e2e8f0' }}>{simResult.commercialProjection.targetCustomer}</strong>
                      </div>
                      <div>
                        <div style={{ color: '#475569', fontSize: '0.68rem' }}>Build cost</div>
                        <strong style={{ color: '#00ff88' }}>{fmtLkr(simResult.commercialProjection.buildCostLkr)}</strong>
                      </div>
                      <div>
                        <div style={{ color: '#475569', fontSize: '0.68rem' }}>Learning cost</div>
                        <strong style={{ color: '#00ff88' }}>{fmtLkr(simResult.commercialProjection.learningCostLkr)}</strong>
                      </div>
                      <div>
                        <div style={{ color: '#475569', fontSize: '0.68rem' }}>Pilot revenue range</div>
                        <strong style={{ color: '#00d4ff' }}>{fmtLkr(simResult.commercialProjection.pilotRevenueLowLkr)} - {fmtLkr(simResult.commercialProjection.pilotRevenueHighLkr)}</strong>
                      </div>
                      <div>
                        <div style={{ color: '#475569', fontSize: '0.68rem' }}>Break-even</div>
                        <strong style={{ color: '#a855f7' }}>{simResult.commercialProjection.breakEvenMonths} months</strong>
                      </div>
                    </div>
                    <p style={{ color: '#64748b', fontSize: '0.8rem', lineHeight: 1.55, marginTop: '0.95rem' }}>
                      {simResult.commercialProjection.scientificPrinciple} Revenue model: {simResult.commercialProjection.revenueModel}.
                    </p>
                  </div>

                  <div className="glass-card" style={{ padding: '1.25rem', borderRadius: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.85rem' }}>
                      <FiBriefcase color="#00d4ff" />
                      <h3 style={{ color: '#e2e8f0', fontWeight: 900 }}>Business Use Cases</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {simResult.businessUseCases.map(useCase => (
                        <div key={useCase} style={{ display: 'flex', gap: '0.45rem', color: '#94a3b8', fontSize: '0.78rem', lineHeight: 1.45 }}>
                          <FiCheckCircle size={12} color="#00ff88" style={{ marginTop: 3, flexShrink: 0 }} />
                          {useCase}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="glass-card" style={{ padding: '1.25rem', borderRadius: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                    <MdOutlineTimeline color="#a855f7" />
                    <h3 style={{ color: '#e2e8f0', fontWeight: 900 }}>Month-by-Month Pathway</h3>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: '0.8rem' }}>
                    {simResult.simulationTimeline.map(item => (
                      <div key={item.step} style={{ border: '1px solid rgba(124,58,237,0.16)', borderRadius: 8, padding: '0.9rem', background: 'rgba(124,58,237,0.04)' }}>
                        <div style={{ color: '#a855f7', fontSize: '0.7rem', fontWeight: 900, marginBottom: '0.35rem' }}>MONTH {item.startMonth}-{item.endMonth}</div>
                        <h4 style={{ color: '#e2e8f0', fontWeight: 800, marginBottom: '0.3rem' }}>{item.title}</h4>
                        <p style={{ color: '#94a3b8', fontSize: '0.78rem', lineHeight: 1.5 }}>{item.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(280px,0.8fr)', gap: '1rem' }}>
                  <div className="glass-card" style={{ padding: '1.25rem', borderRadius: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.85rem' }}>
                      <FiBookOpen color="#f59e0b" />
                      <h3 style={{ color: '#e2e8f0', fontWeight: 900 }}>Recommended Learning</h3>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: '0.65rem' }}>
                      {[...simResult.learningResources, ...simResult.certifications].slice(0, 6).map(item => (
                        <div key={`${item.title || item.name}-${item.provider || item.issuer}`} style={{ border: '1px solid rgba(245,158,11,0.14)', borderRadius: 8, padding: '0.75rem', color: '#94a3b8', fontSize: '0.76rem' }}>
                          <strong style={{ color: '#e2e8f0', display: 'block', marginBottom: '0.2rem' }}>{item.title || item.name}</strong>
                          {item.provider || item.issuer}
                          <div style={{ color: '#00ff88', marginTop: '0.3rem' }}>{item.costLkr || item.cost ? fmtLkr(item.costLkr || item.cost) : 'Free'}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="glass-card" style={{ padding: '1.25rem', borderRadius: 8 }}>
                    <h3 style={{ color: '#e2e8f0', fontWeight: 900, marginBottom: '0.85rem' }}>Evidence Sources</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                      {simResult.dataSources.map(source => (
                        <a key={source.url || source.label} href={source.url} target="_blank" rel="noopener noreferrer" style={{ color: '#00d4ff', textDecoration: 'none', fontSize: '0.76rem', display: 'flex', gap: '0.42rem', alignItems: 'flex-start', lineHeight: 1.45 }}>
                          <FiExternalLink size={12} style={{ marginTop: 3, flexShrink: 0 }} />
                          {source.label}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 920px) {
          .section-pad .container-max > div[style*="grid-template-columns: minmax(320px"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}

export default CareerSimulation
