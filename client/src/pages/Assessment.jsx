import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HiArrowRight, HiArrowLeft, HiCheck } from 'react-icons/hi'
import { FiAlertCircle } from 'react-icons/fi'
import GitHubExtractor from '../components/GitHubExtractor'
import AuthModal from '../components/AuthModal'
import { useAuth } from '../context/AuthContext'

const steps = [
  { id: 1, title: 'Basic Info', description: 'Tell us about yourself' },
  { id: 2, title: 'Skills', description: 'Rate your competencies' },
  { id: 3, title: 'GitHub Scan', description: 'Passive skill extraction' },
  { id: 4, title: 'Interests', description: 'What drives you?' },
  { id: 5, title: 'Goals', description: 'Where do you want to go?' },
]

const skillCategories = [
  { category: 'Technical', skills: ['Python', 'SQL', 'Excel', 'Linux', 'Docker', 'Cloud Deployment', 'Networking', 'Electronics', 'Arduino', 'Sensors'] },
  { category: 'Applied Science', skills: ['Machine Learning', 'Statistics', 'Data Analysis', 'Security', 'Risk Assessment', 'User Research', 'UX Design'] },
  { category: 'Soft Skills', skills: ['Communication', 'Problem Solving', 'Leadership', 'Teamwork'] },
]

const interestOptions = [
  'AI', 'Data', 'Cloud', 'Cybersecurity', 'IoT', 'Agriculture',
  'Design', 'Social Impact', 'Entrepreneurship', 'Research',
]

const Assessment = () => {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    name: '', email: '', experience: '', education: '',
    skills: {}, interests: [], careerGoals: '', workPreference: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [showAuth, setShowAuth] = useState(false)
  const { token, user, login } = useAuth()
  const navigate = useNavigate()

  const toggleInterest = (interest) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest],
    }))
  }

  const setSkillLevel = (skill, level) => {
    setFormData(prev => ({ ...prev, skills: { ...prev.skills, [skill]: level } }))
  }

  const progressPct = ((currentStep - 1) / (steps.length - 1)) * 100

  const handleSubmit = async () => {
    setSubmitting(true)
    setSubmitError('')
    try {
      let authToken = token

      // Auto-register if not logged in and name+email provided
      if (!authToken && formData.name && formData.email) {
        const regRes = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: Math.random().toString(36).slice(-8) + 'Aa1!', // temp password
          }),
        })
        const regJson = await regRes.json()
        if (regJson.success) {
          login(regJson.user, regJson.token)
          authToken = regJson.token
        } else if (regJson.error?.includes('already registered')) {
          setSubmitError('Email already registered. Please sign in first.')
          setShowAuth(true)
          setSubmitting(false)
          return
        }
      }

      if (!authToken) {
        setSubmitError('Please sign in to save your assessment.')
        setShowAuth(true)
        setSubmitting(false)
        return
      }

      // Build skill ratings array
      const categoryMap = { Technical: 'technical', 'Applied Science': 'domain', 'Soft Skills': 'soft' }
      const skillRatings = Object.entries(formData.skills).map(([name, level]) => {
        const group = skillCategories.find(c => c.skills.includes(name))?.category
        return {
          name,
          proficiency: level,
          category: categoryMap[group] || 'technical',
        }
      })

      const payload = {
        skillRatings,
        extractedInterests: formData.interests,
        careerGoals: formData.careerGoals,
        workPreferences: {
          style: formData.workPreference,
          industry: formData.interests.filter(item => ['AI', 'Data', 'Cloud', 'Cybersecurity', 'IoT', 'Design'].includes(item)),
        },
        personalityTraits: [],
        quizResults: { experience: formData.experience, education: formData.education },
      }

      const res = await fetch('/api/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Failed to save assessment')

      navigate('/results')
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="section-pad" style={{ position: 'relative', zIndex: 1 }}>
      <div className="container-max" style={{ maxWidth: '780px' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div className="badge badge-cyan" style={{ margin: '0 auto 1rem', display: 'inline-flex' }}>
            Step {currentStep} of {steps.length}
          </div>
          <h1 className="font-display" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, color: '#e2e8f0', letterSpacing: '-0.02em', marginBottom: '0.75rem' }}>
            Skill <span className="gradient-text-cyan">Assessment</span>
          </h1>
          <p style={{ color: '#64748b' }}>Map your competencies to unlock your career potential</p>
        </div>

        {/* Progress */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            {steps.map((step) => (
              <div key={step.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', flex: 1 }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.8rem', fontWeight: 700, transition: 'all 0.3s ease',
                  background: currentStep > step.id ? '#00d4ff' : currentStep === step.id ? 'rgba(0,212,255,0.15)' : 'rgba(0,212,255,0.05)',
                  border: `2px solid ${currentStep >= step.id ? '#00d4ff' : 'rgba(0,212,255,0.2)'}`,
                  color: currentStep > step.id ? '#020408' : currentStep === step.id ? '#00d4ff' : '#475569',
                }}>
                  {currentStep > step.id ? <HiCheck size={16} /> : step.id}
                </div>
                <span style={{ fontSize: '0.7rem', color: currentStep >= step.id ? '#00d4ff' : '#475569' }}>{step.title}</span>
              </div>
            ))}
          </div>
          <div style={{ height: '3px', background: 'rgba(0,212,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progressPct}%`, background: 'linear-gradient(90deg,#00d4ff,#7c3aed)', borderRadius: '2px', transition: 'width 0.5s ease' }} />
          </div>
        </div>

        <div className="glass-card" style={{ padding: '2.5rem' }}>
          {currentStep === 1 && (
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '1.75rem' }}>Tell us about yourself</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                {[{ label: 'Full Name', key: 'name', placeholder: 'John Doe', type: 'text' }, { label: 'Email Address', key: 'email', placeholder: 'john@example.com', type: 'email' }].map(({ label, key, placeholder, type }) => (
                  <div key={key}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>
                    <input type={type} className="input-futuristic" placeholder={placeholder} value={formData[key]} onChange={e => setFormData(p => ({ ...p, [key]: e.target.value }))} />
                  </div>
                ))}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Experience</label>
                  <select className="input-futuristic" value={formData.experience} onChange={e => setFormData(p => ({ ...p, experience: e.target.value }))}>
                    <option value="">Select range</option>
                    <option value="0-1">0–1 years</option>
                    <option value="2-4">2–4 years</option>
                    <option value="5-8">5–8 years</option>
                    <option value="9+">9+ years</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Education</label>
                  <select className="input-futuristic" value={formData.education} onChange={e => setFormData(p => ({ ...p, education: e.target.value }))}>
                    <option value="">Select level</option>
                    <option value="high-school">High School</option>
                    <option value="bachelor">Bachelor's</option>
                    <option value="master">Master's</option>
                    <option value="phd">PhD</option>
                    <option value="self-taught">Self-Taught</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.5rem' }}>Rate Your Skills</h2>
              <p style={{ color: '#475569', fontSize: '0.875rem', marginBottom: '2rem' }}>1 = Beginner · 5 = Expert</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {skillCategories.map(({ category, skills }) => (
                  <div key={category}>
                    <h3 style={{ fontSize: '0.7rem', fontWeight: 700, color: '#00d4ff', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '1rem' }}>{category}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {skills.map(skill => (
                        <div key={skill} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.875rem', color: '#94a3b8', minWidth: '140px' }}>{skill}</span>
                          <div style={{ display: 'flex', gap: '0.375rem' }}>
                            {[1, 2, 3, 4, 5].map(level => (
                              <button key={level} onClick={() => setSkillLevel(skill, level)} style={{
                                width: '32px', height: '32px', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s ease',
                                border: '1px solid', fontSize: '0.75rem', fontWeight: 600,
                                borderColor: (formData.skills[skill] || 0) >= level ? '#00d4ff' : 'rgba(0,212,255,0.15)',
                                background: (formData.skills[skill] || 0) >= level ? 'rgba(0,212,255,0.15)' : 'transparent',
                                color: (formData.skills[skill] || 0) >= level ? '#00d4ff' : '#475569',
                              }}>{level}</button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.5rem' }}>GitHub Skill Scan</h2>
              <p style={{ color: '#475569', fontSize: '0.875rem', marginBottom: '1.75rem' }}>Auto-detect your skills and technical aptitude from your GitHub activity</p>
              <GitHubExtractor onSaved={(result) => {
                if (result?.primaryInterests) {
                  setFormData(p => ({ ...p, interests: [...new Set([...p.interests, ...result.primaryInterests])] }))
                }
              }} />
            </div>
          )}

          {currentStep === 4 && (
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.5rem' }}>What Drives You?</h2>
              <p style={{ color: '#475569', fontSize: '0.875rem', marginBottom: '2rem' }}>Select all that resonate with you</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '0.75rem' }}>
                {interestOptions.map(interest => {
                  const selected = formData.interests.includes(interest)
                  return (
                    <button key={interest} onClick={() => toggleInterest(interest)} style={{
                      padding: '1rem', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.25s ease',
                      border: '1px solid', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.6rem',
                      borderColor: selected ? '#00d4ff' : 'rgba(0,212,255,0.12)',
                      background: selected ? 'rgba(0,212,255,0.1)' : 'rgba(6,13,24,0.5)',
                      color: selected ? '#00d4ff' : '#94a3b8', fontSize: '0.875rem', fontWeight: 500,
                    }}>
                      <div style={{ width: '18px', height: '18px', borderRadius: '4px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${selected ? '#00d4ff' : 'rgba(0,212,255,0.3)'}`, background: selected ? '#00d4ff' : 'transparent' }}>
                        {selected && <HiCheck size={12} color="#020408" />}
                      </div>
                      {interest}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '1.75rem' }}>Your Career Goals</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Work Preference</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '0.75rem' }}>
                    {['Remote', 'Hybrid', 'On-site', 'Flexible'].map(pref => (
                      <button key={pref} onClick={() => setFormData(p => ({ ...p, workPreference: pref.toLowerCase() }))} style={{
                        padding: '0.875rem', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.25s ease',
                        border: '1px solid', fontSize: '0.875rem', fontWeight: 500,
                        borderColor: formData.workPreference === pref.toLowerCase() ? '#7c3aed' : 'rgba(124,58,237,0.2)',
                        background: formData.workPreference === pref.toLowerCase() ? 'rgba(124,58,237,0.12)' : 'transparent',
                        color: formData.workPreference === pref.toLowerCase() ? '#a855f7' : '#64748b',
                      }}>{pref}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Describe Your Career Goals</label>
                  <textarea className="input-futuristic" rows={5} placeholder="e.g., I want to become a senior ML engineer within 3 years..." value={formData.careerGoals} onChange={e => setFormData(p => ({ ...p, careerGoals: e.target.value }))} style={{ resize: 'vertical' }} />
                </div>
              </div>
            </div>
          )}

          {submitError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.875rem', background: 'rgba(255,0,110,0.08)', border: '1px solid rgba(255,0,110,0.2)', borderRadius: '10px', marginTop: '1.5rem', fontSize: '0.82rem', color: '#ff6b9d' }}>
              <FiAlertCircle size={15} /> {submitError}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2.5rem', paddingTop: '2rem', borderTop: '1px solid rgba(0,212,255,0.1)' }}>
            <button onClick={() => setCurrentStep(s => Math.max(1, s - 1))} disabled={currentStep === 1} className="btn-secondary" style={{ opacity: currentStep === 1 ? 0.4 : 1 }}>
              <HiArrowLeft /> Back
            </button>
            {currentStep < steps.length
              ? <button onClick={() => setCurrentStep(s => Math.min(steps.length, s + 1))} className="btn-primary">Continue <HiArrowRight /></button>
              : <button onClick={handleSubmit} disabled={submitting} className="btn-primary" style={{ background: 'linear-gradient(135deg,#00ff88,#00cc6a)', color: '#020408', opacity: submitting ? 0.7 : 1 }}>
                  {submitting
                    ? <><div style={{ width: '16px', height: '16px', border: '2px solid rgba(2,4,8,0.3)', borderTopColor: '#020408', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Saving...</>
                    : <><HiCheck /> Submit Assessment</>
                  }
                </button>
            }
          </div>
        </div>
      </div>
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} defaultTab="login" />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

export default Assessment
