import { useState, useRef, useEffect } from 'react'
import { FiSend, FiZap, FiRefreshCw, FiAward, FiCpu, FiUser, FiAlertCircle } from 'react-icons/fi'

// ── Career options (can be pulled from backend later) ────────────
const CAREERS = [
  'Machine Learning Engineer', 'Full Stack Developer', 'Cloud Engineer',
  'Data Scientist', 'DevOps Engineer', 'Cybersecurity Analyst',
  'UX/UI Designer', 'Product Manager', 'Data Analyst', 'iOS Developer',
]

const GRADE_COLORS = {
  Excellent: '#00ff88', Good: '#00d4ff', Fair: '#f59e0b', 'Needs Improvement': '#ff006e',
}

// ── Bubble component ──────────────────────────────────────────────
const Bubble = ({ role, children, animate }) => {
  const isAI = role === 'ai'
  return (
    <div style={{
      display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
      justifyContent: isAI ? 'flex-start' : 'flex-end',
      animation: animate ? 'fadeSlide 0.3s ease' : 'none',
    }}>
      {isAI && (
        <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <FiCpu size={16} color="#00d4ff" />
        </div>
      )}
      <div style={{
        maxWidth: '80%', padding: '0.875rem 1.1rem', borderRadius: isAI ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
        background: isAI ? 'rgba(0,212,255,0.06)' : 'rgba(124,58,237,0.12)',
        border: `1px solid ${isAI ? 'rgba(0,212,255,0.15)' : 'rgba(124,58,237,0.25)'}`,
        fontSize: '0.875rem', color: '#cbd5e1', lineHeight: 1.6,
      }}>
        {children}
      </div>
      {!isAI && (
        <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <FiUser size={16} color="#a855f7" />
        </div>
      )}
    </div>
  )
}

// ── Typing indicator ──────────────────────────────────────────────
const TypingDots = () => (
  <Bubble role="ai">
    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', padding: '0.125rem 0' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#00d4ff', opacity: 0.6, animation: `bounce 1s ease ${i * 0.15}s infinite` }} />
      ))}
    </div>
  </Bubble>
)

// ── Evaluation card ───────────────────────────────────────────────
const EvalCard = ({ evaluation, sessionScore }) => {
  const gradeColor = GRADE_COLORS[evaluation.grade] || '#94a3b8'
  return (
    <div style={{ background: 'rgba(6,13,24,0.8)', border: `1px solid ${gradeColor}30`, borderRadius: '12px', padding: '1.25rem', marginTop: '0.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="font-display" style={{ fontSize: '2rem', fontWeight: 900, color: gradeColor, lineHeight: 1 }}>{evaluation.score}</div>
          <div style={{ fontSize: '0.6rem', color: '#475569', textTransform: 'uppercase' }}>/ 100</div>
        </div>
        <div>
          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: gradeColor, marginBottom: '0.2rem' }}>{evaluation.grade}</div>
          <div style={{ fontSize: '0.7rem', color: '#475569' }}>Session avg: <span style={{ color: '#00d4ff', fontWeight: 700 }}>{sessionScore}</span></div>
        </div>
      </div>

      <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '1rem', borderLeft: `3px solid ${gradeColor}40`, paddingLeft: '0.75rem' }}>
        {evaluation.feedback}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.875rem' }}>
        {evaluation.strengths?.length > 0 && (
          <div>
            <div style={{ fontSize: '0.65rem', color: '#00ff88', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '0.4rem' }}>✓ STRENGTHS</div>
            {evaluation.strengths.map(s => <div key={s} style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.2rem' }}>· {s}</div>)}
          </div>
        )}
        {evaluation.improvements?.length > 0 && (
          <div>
            <div style={{ fontSize: '0.65rem', color: '#f59e0b', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '0.4rem' }}>↑ IMPROVE</div>
            {evaluation.improvements.map(s => <div key={s} style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.2rem' }}>· {s}</div>)}
          </div>
        )}
      </div>

      {evaluation.idealApproach && (
        <div style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.12)', borderRadius: '8px', padding: '0.75rem' }}>
          <div style={{ fontSize: '0.65rem', color: '#00d4ff', fontWeight: 700, marginBottom: '0.3rem' }}>IDEAL APPROACH</div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5 }}>{evaluation.idealApproach}</div>
        </div>
      )}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────
const SimulationChat = () => {
  const [phase, setPhase] = useState('select')   // select | loading | chat | done
  const [career, setCareer] = useState('')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [sessionScore, setSessionScore] = useState(0)
  const [rounds, setRounds] = useState(0)
  const [error, setError] = useState('')
  const [waitingForNext, setWaitingForNext] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, typing])

  const token = () => localStorage.getItem('token')

  const apiCall = async (endpoint, method = 'POST', body) => {
    const res = await fetch(`/api/simchat/${endpoint}`, {
      method, headers: { 'Content-Type': 'application/json', ...(token() && { Authorization: `Bearer ${token()}` }) },
      ...(body && { body: JSON.stringify(body) }),
    })
    const json = await res.json()
    if (!json.success) throw new Error(json.error || 'API error')
    return json.data
  }

  const addMsg = (role, content) => setMessages(prev => [...prev, { role, content, id: Date.now() + Math.random() }])

  const handleStart = async () => {
    if (!career) return
    setPhase('loading')
    setError('')
    try {
      const data = await apiCall('start', 'POST', { career })
      setPhase('chat')
      addMsg('ai', (
        <div>
          <div style={{ fontSize: '0.7rem', color: '#7c3aed', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
            🎯 {career.toUpperCase()} SIMULATION · {data.difficulty?.toUpperCase()} LEVEL
          </div>
          <p style={{ marginBottom: '0.75rem', color: '#e2e8f0' }}><strong>Situation:</strong> {data.situation}</p>
          <div style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)', borderRadius: '8px', padding: '0.75rem', marginBottom: '0.75rem' }}>
            <strong style={{ color: '#00d4ff' }}>Your challenge:</strong> {data.challenge}
          </div>
          {data.context?.length > 0 && (
            <div>
              <div style={{ fontSize: '0.7rem', color: '#334155', marginBottom: '0.3rem' }}>💡 HINTS TO CONSIDER</div>
              {data.context.map((h, i) => <div key={i} style={{ fontSize: '0.78rem', color: '#475569' }}>· {h}</div>)}
            </div>
          )}
        </div>
      ))
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
    try {
      const data = await apiCall('answer', 'POST', { answer })
      setSessionScore(data.sessionScore)
      setRounds(data.rounds)
      setTyping(false)
      addMsg('ai', (
        <div>
          <div style={{ marginBottom: '0.5rem', color: '#94a3b8' }}>Here's my evaluation of your response:</div>
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
    try {
      const data = await apiCall('next', 'POST')
      setTyping(false)
      addMsg('ai', (
        <div>
          <div style={{ fontSize: '0.7rem', color: '#7c3aed', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
            🎯 ROUND {data.rounds + 1} · {data.difficulty?.toUpperCase()} LEVEL
          </div>
          <p style={{ marginBottom: '0.75rem', color: '#e2e8f0' }}><strong>New Situation:</strong> {data.situation}</p>
          <div style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)', borderRadius: '8px', padding: '0.75rem' }}>
            <strong style={{ color: '#00d4ff' }}>Challenge:</strong> {data.challenge}
          </div>
        </div>
      ))
    } catch (err) {
      setTyping(false)
      setError(err.message)
    }
  }

  return (
    <div className="section-pad" style={{ position: 'relative', zIndex: 1 }}>
      <style>{`
        @keyframes fadeSlide { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
        @keyframes bounce { 0%,80%,100%{transform:scale(0.6)} 40%{transform:scale(1)} }
      `}</style>
      <div className="container-max" style={{ maxWidth: '820px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div className="badge badge-purple" style={{ display: 'inline-flex', margin: '0 auto 1rem' }}>
            <FiZap size={12} /> AI Simulation
          </div>
          <h1 className="font-display" style={{ fontSize: 'clamp(1.75rem,4vw,2.5rem)', fontWeight: 900, color: '#e2e8f0', letterSpacing: '-0.02em', marginBottom: '0.75rem' }}>
            Career <span style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Test Drive</span>
          </h1>
          <p style={{ color: '#64748b' }}>Face real workplace scenarios · Get AI feedback · Track your aptitude score</p>
        </div>

        {/* Career selector */}
        {phase === 'select' && (
          <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '1.5rem' }}>Choose a career to simulate</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(175px,1fr))', gap: '0.625rem', marginBottom: '1.75rem' }}>
              {CAREERS.map(c => (
                <button key={c} onClick={() => setCareer(c)} style={{
                  padding: '0.75rem', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s ease',
                  border: '1px solid', fontSize: '0.82rem', fontWeight: 500,
                  borderColor: career === c ? '#7c3aed' : 'rgba(124,58,237,0.15)',
                  background: career === c ? 'rgba(124,58,237,0.12)' : 'rgba(6,13,24,0.5)',
                  color: career === c ? '#a855f7' : '#64748b',
                  boxShadow: career === c ? '0 0 16px rgba(124,58,237,0.2)' : 'none',
                }}>{c}</button>
              ))}
            </div>
            {/* Custom input */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <input className="input-futuristic" placeholder="Or type a custom career role..." value={career}
                onChange={e => setCareer(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleStart()} />
            </div>
            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: 'rgba(255,0,110,0.08)', border: '1px solid rgba(255,0,110,0.2)', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.82rem', color: '#ff006e' }}>
                <FiAlertCircle size={15} /> {error}
              </div>
            )}
            <button onClick={handleStart} disabled={!career.trim()} className="btn-primary"
              style={{ opacity: !career.trim() ? 0.5 : 1, background: 'linear-gradient(135deg,#7c3aed,#a855f7)', fontSize: '0.925rem', padding: '0.75rem 2rem' }}>
              <FiZap size={16} /> Start Simulation
            </button>
          </div>
        )}

        {/* Loading */}
        {phase === 'loading' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', border: '3px solid rgba(124,58,237,0.15)', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ color: '#94a3b8' }}>Generating your <span style={{ color: '#a855f7' }}>{career}</span> scenario...</p>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {/* Chat UI */}
        {phase === 'chat' && (
          <div>
            {/* Score bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1.25rem', marginBottom: '1rem', background: 'rgba(6,13,24,0.7)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FiCpu size={15} color="#7c3aed" />
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Simulating: <strong style={{ color: '#a855f7' }}>{career}</strong></span>
              </div>
              <div style={{ display: 'flex', gap: '1.5rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div className="font-display" style={{ fontSize: '1.1rem', fontWeight: 900, color: '#00d4ff', lineHeight: 1 }}>{sessionScore}</div>
                  <div style={{ fontSize: '0.6rem', color: '#334155' }}>AVG SCORE</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div className="font-display" style={{ fontSize: '1.1rem', fontWeight: 900, color: '#a855f7', lineHeight: 1 }}>{rounds}</div>
                  <div style={{ fontSize: '0.6rem', color: '#334155' }}>ROUNDS</div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div style={{ minHeight: '400px', maxHeight: '520px', overflowY: 'auto', padding: '1.25rem', background: 'rgba(2,4,8,0.6)', border: '1px solid rgba(0,212,255,0.08)', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1rem' }}>
              {messages.map((m, i) => (
                <Bubble key={m.id} role={m.role} animate={i === messages.length - 1}>{m.content}</Bubble>
              ))}
              {typing && <TypingDots />}
              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: 'rgba(255,0,110,0.08)', border: '1px solid rgba(255,0,110,0.2)', borderRadius: '8px', fontSize: '0.8rem', color: '#ff006e' }}>
                  <FiAlertCircle size={14} /> {error}
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Next scenario or answer input */}
            {waitingForNext ? (
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={handleNext} className="btn-primary" style={{ flex: 1, background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}>
                  <FiRefreshCw size={15} /> Next Scenario
                </button>
                <button onClick={() => { setPhase('select'); setMessages([]); setRounds(0); setSessionScore(0); setWaitingForNext(false); }} className="btn-secondary">
                  End Session
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <textarea
                  className="input-futuristic"
                  rows={3}
                  placeholder="Type your answer here... Be detailed and explain your reasoning."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleSend() }}
                  disabled={typing}
                  style={{ flex: 1, resize: 'none', opacity: typing ? 0.6 : 1 }}
                />
                <button onClick={handleSend} disabled={!input.trim() || typing} className="btn-primary"
                  style={{ alignSelf: 'flex-end', padding: '0.75rem 1.25rem', opacity: !input.trim() || typing ? 0.5 : 1, background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}>
                  <FiSend size={16} />
                </button>
              </div>
            )}
            <p style={{ fontSize: '0.68rem', color: '#1e293b', textAlign: 'center', marginTop: '0.5rem' }}>Ctrl+Enter to send · Your aptitude score updates after each round</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default SimulationChat
