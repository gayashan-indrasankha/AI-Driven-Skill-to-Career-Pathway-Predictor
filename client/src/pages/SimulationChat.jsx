import { useEffect, useRef, useState } from 'react'
import { FiAlertCircle, FiCpu, FiRefreshCw, FiSend, FiUser, FiZap } from 'react-icons/fi'

const FALLBACK_CAREERS = [
  'AI and Machine Learning Solutions Engineer',
  'Data Analyst and Business Intelligence Specialist',
  'Cloud and Platform Engineer',
]

const DEMO_PROFILE_SKILLS = ['Python', 'SQL', 'Data Analysis', 'Communication']
const normalize = (value = '') => value.toString().trim().toLowerCase()
const scoreCareerAgainstProfile = (career, skills = [], interests = []) => {
  const keys = [...skills, ...interests].map(normalize)
  const requiredHits = (career.requiredSkills || []).filter(skill =>
    keys.some(key => normalize(skill.name).includes(key) || key.includes(normalize(skill.name)))
  ).length
  const tagHits = (career.tags || []).filter(tag =>
    keys.some(key => normalize(tag).includes(key) || key.includes(normalize(tag)))
  ).length

  return requiredHits * 12 + tagHits * 5 + ((career.marketSignal?.sriLankaDemandScore || 50) / 20)
}

const GRADE_COLORS = {
  Excellent: '#00ff88',
  Good: '#00d4ff',
  Fair: '#f59e0b',
  'Needs Improvement': '#ff006e',
}

const Bubble = ({ role, children }) => {
  const isAI = role === 'ai'
  return (
    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', justifyContent: isAI ? 'flex-start' : 'flex-end' }}>
      {isAI && (
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <FiCpu size={16} color="#00d4ff" />
        </div>
      )}
      <div style={{
        maxWidth: '82%',
        padding: '0.875rem 1.1rem',
        borderRadius: isAI ? '4px 12px 12px 12px' : '12px 4px 12px 12px',
        background: isAI ? 'rgba(0,212,255,0.06)' : 'rgba(124,58,237,0.12)',
        border: `1px solid ${isAI ? 'rgba(0,212,255,0.15)' : 'rgba(124,58,237,0.25)'}`,
        fontSize: '0.875rem',
        color: '#cbd5e1',
        lineHeight: 1.6,
      }}>
        {children}
      </div>
      {!isAI && (
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <FiUser size={16} color="#a855f7" />
        </div>
      )}
    </div>
  )
}

const TypingDots = () => (
  <Bubble role="ai">
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '0.125rem 0' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#00d4ff', opacity: 0.6, animation: `bounce 1s ease ${i * 0.15}s infinite` }} />
      ))}
    </div>
  </Bubble>
)

const EvalCard = ({ evaluation, sessionScore }) => {
  const gradeColor = GRADE_COLORS[evaluation.grade] || '#94a3b8'
  return (
    <div style={{ background: 'rgba(6,13,24,0.8)', border: `1px solid ${gradeColor}30`, borderRadius: 8, padding: '1.1rem', marginTop: '0.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.9rem' }}>
        <div>
          <div className="font-display" style={{ fontSize: '2rem', fontWeight: 900, color: gradeColor, lineHeight: 1 }}>{evaluation.score}</div>
          <div style={{ fontSize: '0.6rem', color: '#475569', textTransform: 'uppercase' }}>/ 100</div>
        </div>
        <div>
          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: gradeColor }}>{evaluation.grade}</div>
          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Session average: <span style={{ color: '#00d4ff', fontWeight: 800 }}>{sessionScore}</span></div>
        </div>
      </div>

      <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.55, marginBottom: '0.9rem', borderLeft: `3px solid ${gradeColor}55`, paddingLeft: '0.75rem' }}>
        {evaluation.feedback}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.9rem' }}>
        <div>
          <div style={{ fontSize: '0.66rem', color: '#00ff88', fontWeight: 800, marginBottom: '0.35rem' }}>STRENGTHS</div>
          {evaluation.strengths?.map(item => <div key={item} style={{ fontSize: '0.76rem', color: '#64748b' }}>- {item}</div>)}
        </div>
        <div>
          <div style={{ fontSize: '0.66rem', color: '#f59e0b', fontWeight: 800, marginBottom: '0.35rem' }}>IMPROVE</div>
          {evaluation.improvements?.map(item => <div key={item} style={{ fontSize: '0.76rem', color: '#64748b' }}>- {item}</div>)}
        </div>
      </div>

      {evaluation.idealApproach && (
        <div style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.12)', borderRadius: 8, padding: '0.75rem' }}>
          <div style={{ fontSize: '0.66rem', color: '#00d4ff', fontWeight: 800, marginBottom: '0.3rem' }}>IDEAL APPROACH</div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5 }}>{evaluation.idealApproach}</div>
        </div>
      )}
    </div>
  )
}

const ScenarioMessage = ({ data, title }) => (
  <div>
    <div style={{ fontSize: '0.7rem', color: '#a855f7', fontWeight: 800, letterSpacing: '0.08em', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
      {title} - {data.difficulty || 'junior'} level
    </div>
    <p style={{ marginBottom: '0.75rem', color: '#e2e8f0' }}><strong>Situation:</strong> {data.situation}</p>
    <div style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)', borderRadius: 8, padding: '0.75rem', marginBottom: '0.75rem' }}>
      <strong style={{ color: '#00d4ff' }}>Challenge:</strong> {data.challenge}
    </div>
    {data.context?.length > 0 && (
      <div>
        <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '0.3rem', fontWeight: 800 }}>HINTS TO CONSIDER</div>
        {data.context.map((hint, index) => <div key={index} style={{ fontSize: '0.78rem', color: '#64748b' }}>- {hint}</div>)}
      </div>
    )}
  </div>
)

const SimulationChat = () => {
  const [phase, setPhase] = useState('select')
  const [career, setCareer] = useState('')
  const [careerOptions, setCareerOptions] = useState(FALLBACK_CAREERS)
  const [optionNote, setOptionNote] = useState('')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [sessionScore, setSessionScore] = useState(0)
  const [rounds, setRounds] = useState(0)
  const [error, setError] = useState('')
  const [waitingForNext, setWaitingForNext] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    const loadCareers = async () => {
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      try {
        if (token) {
          const predictedRes = await fetch('/api/careers/predicted', { headers }).catch(() => null)
          const predictedJson = predictedRes ? await predictedRes.json().catch(() => null) : null
          if (predictedJson?.success && predictedJson.data?.length) {
            const options = predictedJson.data.filter(item => item.careerPath).map(item => item.careerPath.title).slice(0, 5)
            setCareerOptions(options)
            setCareer(options[0] || '')
            setOptionNote('Showing scenario options from your latest career predictions.')
            return
          }
        }

        const [careersRes, assessmentRes] = await Promise.all([
          fetch('/api/careers?limit=20', { headers }),
          token ? fetch('/api/assessment/my/latest', { headers }).catch(() => null) : Promise.resolve(null),
        ])
        const careersJson = await careersRes.json()
        const assessmentJson = assessmentRes ? await assessmentRes.json().catch(() => null) : null
        const careerList = careersJson.success ? (careersJson.data || []) : []
        if (token && !assessmentJson?.success) {
          setCareerOptions([])
          setCareer('')
          setOptionNote('Complete the assessment first so scenario options can be tailored to your profile.')
          return
        }

        const profileSkills = assessmentJson?.success
          ? [
              ...(assessmentJson.data.skillRatings?.map(skill => skill.name) || []),
              ...(assessmentJson.data.githubData?.topLanguages?.map(lang => lang.language) || []),
            ]
          : DEMO_PROFILE_SKILLS
        const profileInterests = assessmentJson?.data?.extractedInterests || []
        const related = careerList
          .map(item => ({ ...item, relevanceScore: scoreCareerAgainstProfile(item, profileSkills, profileInterests) }))
          .filter(item => item.relevanceScore > 8)
          .sort((a, b) => b.relevanceScore - a.relevanceScore)
          .slice(0, token ? 5 : 3)
          .map(item => item.title)

        if (related.length) {
          setCareerOptions(related)
          setCareer(related[0] || '')
          setOptionNote(token
            ? 'No prediction set found yet, so options are filtered by your saved skills and interests.'
            : 'Demo mode: options are filtered to a sample learner profile.')
        }
      } catch {
        setCareerOptions(FALLBACK_CAREERS)
        setCareer(FALLBACK_CAREERS[0])
        setOptionNote('Using sample related options because live career matching could not load.')
      }
    }
    loadCareers()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  const token = () => localStorage.getItem('token')
  const addMsg = (role, content) => setMessages(prev => [...prev, { role, content, id: Date.now() + Math.random() }])

  const apiCall = async (endpoint, method = 'POST', body) => {
    const res = await fetch(`/api/simchat/${endpoint}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token() && { Authorization: `Bearer ${token()}` }) },
      ...(body && { body: JSON.stringify(body) }),
    })
    const json = await res.json()
    if (!json.success) throw new Error(json.error || 'Simulation API error')
    return json.data
  }

  const handleStart = async () => {
    if (!career.trim()) return
    setPhase('loading')
    setError('')
    setMessages([])
    setSessionScore(0)
    setRounds(0)
    try {
      const data = await apiCall('start', 'POST', { career })
      setCareer(data.career || career)
      setPhase('chat')
      addMsg('ai', <ScenarioMessage data={data} title={`${data.career || career} simulation`} />)
    } catch (err) {
      setError(err.message)
      setPhase('select')
    }
  }

  const handleSend = async () => {
    if (!input.trim() || typing || waitingForNext) return
    const answer = input.trim()
    setInput('')
    addMsg('user', answer)
    setTyping(true)
    setError('')

    try {
      const data = await apiCall('answer', 'POST', { answer })
      setSessionScore(data.sessionScore)
      setRounds(data.rounds)
      setTyping(false)
      addMsg('ai', (
        <div>
          <div style={{ marginBottom: '0.5rem', color: '#94a3b8' }}>Evaluation:</div>
          <EvalCard evaluation={data} sessionScore={data.sessionScore} />
        </div>
      ))
      setWaitingForNext(true)
    } catch (err) {
      setTyping(false)
      setError(err.message)
    }
  }

  const handleNext = async () => {
    setWaitingForNext(false)
    setTyping(true)
    setError('')
    try {
      const data = await apiCall('next', 'POST')
      setTyping(false)
      addMsg('ai', <ScenarioMessage data={data} title={`Round ${data.rounds + 1}`} />)
    } catch (err) {
      setTyping(false)
      setError(err.message)
    }
  }

  const resetSession = () => {
    setPhase('select')
    setMessages([])
    setRounds(0)
    setSessionScore(0)
    setWaitingForNext(false)
    setInput('')
    setError('')
  }

  return (
    <div className="section-pad" style={{ position: 'relative', zIndex: 1 }}>
      <style>{`
        @keyframes bounce { 0%,80%,100%{transform:scale(0.6)} 40%{transform:scale(1)} }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
      <div className="container-max" style={{ maxWidth: 860 }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div className="badge badge-purple" style={{ display: 'inline-flex', margin: '0 auto 1rem' }}>
            <FiZap size={12} /> Practical Scenario Simulation
          </div>
          <h1 className="font-display" style={{ fontSize: 'clamp(1.75rem,4vw,2.5rem)', fontWeight: 900, color: '#e2e8f0', marginBottom: '0.75rem' }}>
            Career <span className="gradient-text-purple">Test Drive</span>
          </h1>
          <p style={{ color: '#94a3b8' }}>Face Sri Lankan workplace scenarios, explain your solution, and get scored feedback.</p>
        </div>

        {phase === 'select' && (
          <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', borderRadius: 8 }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#e2e8f0', marginBottom: '1.4rem' }}>Choose a career to simulate</h2>
            {optionNote && (
              <div style={{ color: '#64748b', fontSize: '0.78rem', lineHeight: 1.45, marginBottom: '1rem', padding: '0.65rem 0.75rem', border: '1px solid rgba(0,212,255,0.1)', borderRadius: 8, background: 'rgba(0,212,255,0.035)', textAlign: 'left' }}>
                {optionNote}
              </div>
            )}
            {careerOptions.length === 0 ? (
              <div style={{ color: '#f59e0b', fontSize: '0.84rem', lineHeight: 1.55, marginBottom: '1rem' }}>
                No related scenario options are available yet. Complete the assessment to unlock personalized simulations.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: '0.65rem', marginBottom: '1.5rem' }}>
                {careerOptions.map(option => (
                  <button key={option} onClick={() => setCareer(option)} style={{
                    padding: '0.8rem',
                    borderRadius: 8,
                    cursor: 'pointer',
                    border: '1px solid',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    textAlign: 'left',
                    borderColor: career === option ? '#7c3aed' : 'rgba(124,58,237,0.15)',
                    background: career === option ? 'rgba(124,58,237,0.12)' : 'rgba(6,13,24,0.5)',
                    color: career === option ? '#a855f7' : '#94a3b8',
                  }}>
                    {option}
                  </button>
                ))}
              </div>
            )}
            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: 'rgba(255,0,110,0.08)', border: '1px solid rgba(255,0,110,0.2)', borderRadius: 8, marginBottom: '1rem', fontSize: '0.82rem', color: '#ff006e' }}>
                <FiAlertCircle size={15} /> {error}
              </div>
            )}
            {careerOptions.length > 0
              ? <button onClick={handleStart} disabled={!career.trim()} className="btn-primary" style={{ opacity: !career.trim() ? 0.5 : 1, background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}>
                  <FiZap size={16} /> Start Scenario
                </button>
              : <a href="/assessment" className="btn-primary" style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}>Go to Assessment</a>
            }
          </div>
        )}

        {phase === 'loading' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem', gap: '1rem' }}>
            <div style={{ width: 48, height: 48, border: '3px solid rgba(124,58,237,0.15)', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ color: '#94a3b8' }}>Generating a practical scenario for <span style={{ color: '#a855f7' }}>{career}</span>...</p>
          </div>
        )}

        {phase === 'chat' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1.25rem', marginBottom: '1rem', background: 'rgba(6,13,24,0.7)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 8, gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FiCpu size={15} color="#7c3aed" />
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Simulating: <strong style={{ color: '#a855f7' }}>{career}</strong></span>
              </div>
              <div style={{ display: 'flex', gap: '1.5rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div className="font-display" style={{ fontSize: '1.1rem', fontWeight: 900, color: '#00d4ff', lineHeight: 1 }}>{sessionScore}</div>
                  <div style={{ fontSize: '0.6rem', color: '#475569' }}>AVG SCORE</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div className="font-display" style={{ fontSize: '1.1rem', fontWeight: 900, color: '#a855f7', lineHeight: 1 }}>{rounds}</div>
                  <div style={{ fontSize: '0.6rem', color: '#475569' }}>ROUNDS</div>
                </div>
              </div>
            </div>

            <div style={{ minHeight: 400, maxHeight: 540, overflowY: 'auto', padding: '1.2rem', background: 'rgba(2,4,8,0.6)', border: '1px solid rgba(0,212,255,0.08)', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: '1.15rem', marginBottom: '1rem' }}>
              {messages.map(message => <Bubble key={message.id} role={message.role}>{message.content}</Bubble>)}
              {typing && <TypingDots />}
              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: 'rgba(255,0,110,0.08)', border: '1px solid rgba(255,0,110,0.2)', borderRadius: 8, fontSize: '0.8rem', color: '#ff006e' }}>
                  <FiAlertCircle size={14} /> {error}
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {waitingForNext ? (
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button onClick={handleNext} className="btn-primary" style={{ flex: 1, background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}>
                  <FiRefreshCw size={15} /> Next Scenario
                </button>
                <button onClick={resetSession} className="btn-secondary">End Session</button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <textarea
                  className="input-futuristic"
                  rows={3}
                  placeholder="Type your answer. Include scientific reasoning, implementation, LKR cost, risks, and customer value."
                  value={input}
                  onChange={event => setInput(event.target.value)}
                  onKeyDown={event => { if (event.key === 'Enter' && event.ctrlKey) handleSend() }}
                  disabled={typing}
                  style={{ flex: 1, resize: 'none', opacity: typing ? 0.6 : 1 }}
                />
                <button onClick={handleSend} disabled={!input.trim() || typing} className="btn-primary" style={{ alignSelf: 'flex-end', padding: '0.75rem 1.25rem', opacity: !input.trim() || typing ? 0.5 : 1, background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}>
                  <FiSend size={16} />
                </button>
              </div>
            )}
            <p style={{ fontSize: '0.68rem', color: '#334155', textAlign: 'center', marginTop: '0.5rem' }}>Ctrl+Enter to send. Score updates after each round.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default SimulationChat
