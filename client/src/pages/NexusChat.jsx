import { useState, useRef, useEffect, useCallback } from 'react'
import { FiSend, FiTrash2, FiZap, FiUser, FiRefreshCw } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'

const AI_NAME = 'PathGuide AI'

// ── Markdown-lite renderer ────────────────────────────────────────
const renderText = (text) => {
  const lines = text.split('\n')
  return lines.map((line, i) => {
    // Bold: **text**
    const boldLine = line.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#e2e8f0">$1</strong>')
    // Numbered list
    if (/^\d+\.\s/.test(line)) return <div key={i} dangerouslySetInnerHTML={{ __html: `<span style="color:#00d4ff;font-weight:700">${line.match(/^\d+/)[0]}.</span> ${boldLine.replace(/^\d+\.\s/, '')}` }} style={{ paddingLeft: '0.25rem', marginBottom: '0.25rem', fontSize: '0.875rem', lineHeight: 1.6 }} />
    // Bullet
    if (/^[-•*]\s/.test(line)) return <div key={i} dangerouslySetInnerHTML={{ __html: `<span style="color:#7c3aed">▸</span> ${boldLine.replace(/^[-•*]\s/, '')}` }} style={{ paddingLeft: '0.5rem', marginBottom: '0.2rem', fontSize: '0.875rem', lineHeight: 1.6 }} />
    // Step pattern
    if (/^Step\s\d+:/i.test(line)) return <div key={i} dangerouslySetInnerHTML={{ __html: boldLine }} style={{ color: '#00ff88', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }} />
    // Blank line
    if (!line.trim()) return <div key={i} style={{ height: '0.5rem' }} />
    return <div key={i} dangerouslySetInnerHTML={{ __html: boldLine }} style={{ fontSize: '0.875rem', lineHeight: 1.7, color: '#cbd5e1' }} />
  })
}

// ── Typing indicator ──────────────────────────────────────────────
const TypingDots = () => (
  <div style={{ display: 'flex', gap: '4px', alignItems: 'center', padding: '0.75rem 1rem' }}>
    {[0, 1, 2].map(i => (
      <div key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'linear-gradient(135deg,#00d4ff,#7c3aed)', animation: `nexusBounce 1.2s ease ${i * 0.18}s infinite` }} />
    ))}
    <span style={{ fontSize: '0.7rem', color: '#334155', marginLeft: '0.5rem' }}>{AI_NAME} is preparing guidance...</span>
  </div>
)

// ── Suggested prompts ─────────────────────────────────────────────
const SUGGESTIONS = [
  'What skills do I need for ML engineering?',
  'Build a roadmap for a school dropout dashboard',
  'Analyze my assessment results and suggest next steps',
  'Which Sri Lankan tech career has the best LKR potential?',
  'What certification should I get first?',
  'How can I turn my prototype into a business pitch?',
]

// ── Message bubble ────────────────────────────────────────────────
const Message = ({ msg, isLatest }) => {
  const isUser = msg.role === 'user'
  return (
    <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-start', justifyContent: isUser ? 'flex-end' : 'flex-start', animation: isLatest ? 'nexusFade 0.35s ease' : 'none', marginBottom: '1.25rem' }}>
      {!isUser && (
        <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'linear-gradient(135deg,rgba(0,212,255,0.15),rgba(124,58,237,0.15))', border: '1px solid rgba(0,212,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 16px rgba(0,212,255,0.1)' }}>
          <span style={{ fontSize: '1rem' }}>⬡</span>
        </div>
      )}
      <div style={{
        maxWidth: '78%', padding: '1rem 1.25rem',
        borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
        background: isUser
          ? 'linear-gradient(135deg,rgba(124,58,237,0.18),rgba(168,85,247,0.12))'
          : 'rgba(6,13,24,0.8)',
        border: `1px solid ${isUser ? 'rgba(124,58,237,0.3)' : 'rgba(0,212,255,0.12)'}`,
        boxShadow: isUser ? '0 4px 20px rgba(124,58,237,0.12)' : '0 4px 20px rgba(0,0,0,0.2)',
      }}>
        {isUser
          ? <p style={{ fontSize: '0.875rem', color: '#e2e8f0', lineHeight: 1.6 }}>{msg.content}</p>
          : <div>{renderText(msg.content)}</div>
        }
        <div style={{ fontSize: '0.62rem', color: '#1e293b', marginTop: '0.5rem', textAlign: isUser ? 'right' : 'left' }}>
          {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
      {isUser && (
        <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <FiUser size={16} color="#a855f7" />
        </div>
      )}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────
const NexusChat = () => {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [guestHistory, setGuestHistory] = useState([]) // stateless guest mode
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  const { token, isAuth } = useAuth()

  useEffect(() => {
    // Welcome message
    setMessages([{
      role: 'assistant',
      content: `Hey there! I'm **${AI_NAME}** - your practical career and project pitch advisor.\n\nI can help you:\n- Explore Sri Lankan tech careers with **LKR salary signals**\n- Build personalized **learning roadmaps**\n- Understand your **assessment results**\n- Turn a prototype into a **Science-to-Business pitch**\n\nWhat career or project question is on your mind today?`,
      time: Date.now(),
    }])
  }, [])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  const send = useCallback(async (text) => {
    const msg = (text || input).trim()
    if (!msg || loading) return
    setInput('')
    setError('')

    const userMsg = { role: 'user', content: msg, time: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      let reply
      if (isAuth) {
        const res = await fetch('/api/nexus/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ message: msg }),
        })
        const json = await res.json()
        if (!json.success) throw new Error(json.error)
        reply = json.data.reply
      } else {
        // Guest mode — send local history
        const res = await fetch('/api/nexus/chat/guest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: msg, history: guestHistory }),
        })
        const json = await res.json()
        if (!json.success) throw new Error(json.error)
        reply = json.data.reply
        setGuestHistory(prev => [...prev, { role: 'user', content: msg }, { role: 'assistant', content: reply }])
      }

      setMessages(prev => [...prev, { role: 'assistant', content: reply, time: Date.now() }])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [input, loading, isAuth, token, guestHistory])

  const clearChat = async () => {
    if (isAuth) {
      await fetch('/api/nexus/chat', { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    }
    setGuestHistory([])
    setMessages([{
      role: 'assistant',
      content: `Conversation cleared. Ready for a fresh start. What would you like to explore?`,
      time: Date.now(),
    }])
  }

  return (
    <div className="section-pad" style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
      <style>{`
        @keyframes nexusFade { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
        @keyframes nexusBounce { 0%,80%,100%{transform:scale(0.5);opacity:0.4} 40%{transform:scale(1);opacity:1} }
        @keyframes nexusPulse { 0%,100%{opacity:0.4;transform:scale(1)} 50%{opacity:1;transform:scale(1.05)} }
      `}</style>

      <div className="container-max" style={{ maxWidth: '860px' }}>

        {/* ── Header ─────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Logo */}
            <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'linear-gradient(135deg,rgba(0,212,255,0.12),rgba(124,58,237,0.12))', border: '1px solid rgba(0,212,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 24px rgba(0,212,255,0.12)', position: 'relative' }}>
              <span style={{ fontSize: '1.5rem', animation: 'nexusPulse 3s ease infinite' }}>⬡</span>
              <div style={{ position: 'absolute', bottom: '-3px', right: '-3px', width: '12px', height: '12px', borderRadius: '50%', background: '#00ff88', border: '2px solid #020408', boxShadow: '0 0 8px #00ff88' }} />
            </div>
            <div>
              <h1 className="font-display" style={{ fontSize: '1.4rem', fontWeight: 900, background: 'linear-gradient(135deg,#00d4ff,#7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.01em', marginBottom: '0.1rem' }}>{AI_NAME}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 6px #00ff88' }} />
                <span style={{ fontSize: '0.7rem', color: '#475569' }}>Career & Pitch Advisor - Online</span>
                {!isAuth && <span style={{ fontSize: '0.65rem', color: '#f59e0b', marginLeft: '0.25rem' }}>- Guest mode</span>}
              </div>
            </div>
          </div>
          <button onClick={clearChat} title="Clear conversation" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '0.5rem', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', transition: 'all 0.2s ease' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,0,110,0.3)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}>
            <FiTrash2 size={14} /> Clear
          </button>
        </div>

        {/* ── Chat area ──────────────────────────────────────────── */}
        <div style={{ background: 'rgba(2,4,8,0.7)', border: '1px solid rgba(0,212,255,0.1)', borderRadius: '20px', padding: '1.5rem', minHeight: '480px', maxHeight: '560px', overflowY: 'auto', marginBottom: '1rem', backdropFilter: 'blur(12px)' }}>
          {messages.map((msg, i) => (
            <Message key={i} msg={msg} isLatest={i === messages.length - 1 && !loading} />
          ))}
          {loading && <TypingDots />}
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: 'rgba(255,0,110,0.08)', border: '1px solid rgba(255,0,110,0.2)', borderRadius: '10px', marginBottom: '1rem', fontSize: '0.8rem', color: '#ff6b9d' }}>
              {error.includes('busy') || error.includes('rate') ? `${AI_NAME} could not connect to the advisor service. Please try again.` : error}
              {(error.includes('busy') || error.includes('rate')) && (
                <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#00d4ff', cursor: 'pointer', fontSize: '0.75rem', textDecoration: 'underline', whiteSpace: 'nowrap' }}>Dismiss</button>
              )}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* ── Suggestions ────────────────────────────────────────── */}
        {messages.length <= 1 && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {SUGGESTIONS.map(s => (
              <button key={s} onClick={() => send(s)} style={{
                padding: '0.45rem 0.875rem', borderRadius: '20px', border: '1px solid rgba(0,212,255,0.15)',
                background: 'rgba(6,13,24,0.6)', cursor: 'pointer', fontSize: '0.75rem', color: '#64748b',
                transition: 'all 0.2s ease', whiteSpace: 'nowrap',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,212,255,0.4)'; e.currentTarget.style.color = '#00d4ff' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,212,255,0.15)'; e.currentTarget.style.color = '#64748b' }}>
                {s}
              </button>
            ))}
          </div>
        )}

        {/* ── Input ──────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <textarea
              ref={inputRef}
              className="input-futuristic"
              rows={2}
              placeholder={`Ask ${AI_NAME} about your career path, skills, or project pitch...`}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              disabled={loading}
              style={{ resize: 'none', paddingRight: '1rem', opacity: loading ? 0.6 : 1, borderRadius: '14px', lineHeight: 1.5 }}
            />
          </div>
          <button onClick={() => send()} disabled={!input.trim() || loading} style={{
            width: '52px', height: '52px', borderRadius: '14px', border: 'none', cursor: 'pointer',
            background: !input.trim() || loading ? 'rgba(124,58,237,0.2)' : 'linear-gradient(135deg,#7c3aed,#a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            transition: 'all 0.2s ease', boxShadow: input.trim() && !loading ? '0 0 20px rgba(124,58,237,0.35)' : 'none',
            opacity: !input.trim() || loading ? 0.6 : 1,
          }}>
            {loading ? <FiRefreshCw size={18} color="#a855f7" style={{ animation: 'spin 0.8s linear infinite' }} /> : <FiSend size={18} color="#fff" />}
          </button>
        </div>
        <p style={{ fontSize: '0.68rem', color: '#1e293b', textAlign: 'center', marginTop: '0.625rem' }}>
          Press Enter to send - Shift+Enter for new line - {isAuth ? 'Personalized with your assessment data' : 'Sign in for personalized guidance'}
        </p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  )
}

export default NexusChat
