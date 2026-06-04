import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HiArrowRight, HiArrowLeft, HiCheck } from 'react-icons/hi'
import { FiAlertCircle } from 'react-icons/fi'
import GitHubExtractor from '../components/GitHubExtractor'
import AuthModal from '../components/AuthModal'
import MarketFitWizard from '../components/market-fit/MarketFitWizard'
import { useAuth } from '../context/AuthContext'

const steps = [
  { id: 1, title: 'Basic Info', description: 'Tell us about yourself' },
  { id: 2, title: 'Skill Check', description: 'Measure practical ability' },
  { id: 3, title: 'GitHub Scan', description: 'Passive skill extraction' },
  { id: 4, title: 'Market Fit', description: 'Pick a practical opportunity' },
  { id: 5, title: 'Goals', description: 'Where do you want to go?' },
]

const skillCategories = [
  { category: 'Technical', skills: ['Python', 'SQL', 'Excel', 'Linux', 'Docker', 'Cloud Deployment', 'Networking', 'Electronics', 'Arduino', 'Sensors'] },
  { category: 'Applied Science', skills: ['Machine Learning', 'Statistics', 'Data Analysis', 'Security', 'Risk Assessment', 'User Research', 'UX Design'] },
  { category: 'Soft Skills', skills: ['Communication', 'Problem Solving', 'Leadership', 'Teamwork'] },
]

const categoryMap = { Technical: 'technical', 'Applied Science': 'domain', 'Soft Skills': 'soft' }

const diagnosticQuestions = [
  {
    id: 'data_csv_analysis',
    category: 'Data',
    title: 'Clean and summarize CSV data',
    scenario: 'Combine files, remove errors, and produce a brief summary.',
    measures: [
      { name: 'Python', weight: 1 },
      { name: 'Excel', weight: 0.7 },
      { name: 'Data Analysis', weight: 1 },
    ],
    options: [
      { score: 1, label: 'I cannot do this yet.' },
      { score: 2, label: 'I can do basic cleaning or use Excel.' },
      { score: 4, label: 'I can clean, analyze, and make clear charts.' },
      { score: 5, label: 'I can automate cleaning and create actionable reports.' },
    ],
  },
  {
    id: 'sql_dashboard',
    category: 'Business intelligence',
    title: 'Query databases and create summaries',
    scenario: 'Write queries to get key counts and basic aggregations.',
    measures: [
      { name: 'SQL', weight: 1 },
      { name: 'Data Analysis', weight: 0.8 },
    ],
    options: [
      { score: 1, label: 'I cannot write queries.' },
      { score: 2, label: 'I can write simple SELECT and WHERE queries.' },
      { score: 4, label: 'I can join tables and build summary reports.' },
      { score: 5, label: 'I can design query flows and dashboards.' },
    ],
  },
  {
    id: 'ml_model',
    category: 'AI',
    title: 'Train and evaluate a basic model',
    scenario: 'Train a simple model and check its accuracy.',
    measures: [
      { name: 'Machine Learning', weight: 1 },
      { name: 'Python', weight: 0.8 },
    ],
    options: [
      { score: 1, label: 'I cannot train models yet.' },
      { score: 2, label: 'I can follow a tutorial to train a model.' },
      { score: 4, label: 'I can train, evaluate, and explain results.' },
      { score: 5, label: 'I can compare models and improve performance.' },
    ],
  },
  {
    id: 'deploy_app',
    category: 'Deployment',
    title: 'Deploy a simple web app',
    scenario: 'Publish an app with a public URL and basic monitoring.',
    measures: [
      { name: 'Cloud Deployment', weight: 1 },
      { name: 'Docker', weight: 0.8 },
    ],
    options: [
      { score: 1, label: 'I cannot deploy apps yet.' },
      { score: 2, label: 'I can follow deployment steps on a platform.' },
      { score: 4, label: 'I can configure env, DB, and logs.' },
      { score: 5, label: 'I can containerize and run reliable demos.' },
    ],
  },
  {
    id: 'security_audit',
    category: 'Security',
    title: 'Identify common security risks',
    scenario: 'Check passwords, sharing, and basic network hygiene.',
    measures: [
      { name: 'Security', weight: 1 },
      { name: 'Risk Assessment', weight: 0.8 },
    ],
    options: [
      { score: 1, label: 'I only know common risks.' },
      { score: 2, label: 'I can spot weak passwords and phishing.' },
      { score: 4, label: 'I can run a checklist and recommend fixes.' },
      { score: 5, label: 'I can prioritize risks and create an action plan.' },
    ],
  },
  {
    id: 'iot_sensor',
    category: 'IoT',
    title: 'Build a simple sensor prototype',
    scenario: 'Read sensor data and show it on a simple dashboard.',
    measures: [
      { name: 'Electronics', weight: 1 },
      { name: 'Arduino', weight: 1 },
    ],
    options: [
      { score: 1, label: 'I cannot build sensor prototypes yet.' },
      { score: 2, label: 'I can wire sensors and read values.' },
      { score: 4, label: 'I can calibrate sensors and show readings.' },
      { score: 5, label: 'I can package a reliable demo and BOM.' },
    ],
  },
  {
    id: 'ux_field_test',
    category: 'UX',
    title: 'Run a quick usability test',
    scenario: 'Observe users completing tasks and record issues.',
    measures: [
      { name: 'User Research', weight: 1 },
      { name: 'UX Design', weight: 1 },
    ],
    options: [
      { score: 1, label: 'I cannot run usability tests yet.' },
      { score: 2, label: 'I can collect basic feedback.' },
      { score: 4, label: 'I can run task tests and report findings.' },
      { score: 5, label: 'I can measure success and iterate designs.' },
    ],
  },
]

const levelLabels = {
  1: 'Needs support',
  2: 'Guided practice',
  3: 'Basic delivery',
  4: 'Independent',
  5: 'Competition ready',
}

const clampLevel = (value) => Math.max(1, Math.min(5, Math.round(value)))

const getSkillCategory = (skillName) => {
  const group = skillCategories.find(category => category.skills.includes(skillName))?.category
  return categoryMap[group] || 'technical'
}

const deriveMeasuredSkills = (skillCheck = {}) => {
  const buckets = {}

  diagnosticQuestions.forEach(question => {
    const selectedScore = Number(skillCheck[question.id])
    if (!selectedScore) return

    question.measures.forEach(({ name, weight = 1 }) => {
      if (!buckets[name]) buckets[name] = { score: 0, max: 0 }
      buckets[name].score += selectedScore * weight
      buckets[name].max += 5 * weight
    })
  })

  return Object.fromEntries(
    Object.entries(buckets).map(([name, value]) => [
      name,
      clampLevel((value.score / value.max) * 5),
    ])
  )
}

const buildPracticalInterestTags = ({ interests = [], marketSelections = {} }) => {
  const marketTags = marketSelections.tags || []
  return [...new Set([...interests, ...marketTags])]
}

const buildDiagnosticResults = ({ skillCheck = {}, skillEvidence = '', experience = '', education = '', marketSelections = {} }) => {
  const answered = diagnosticQuestions
    .map(question => ({
      question,
      option: question.options.find(item => item.score === Number(skillCheck[question.id])),
    }))
    .filter(item => item.option)

  const totalScore = answered.reduce((sum, item) => sum + item.option.score, 0)
  const maxPossibleScore = answered.length * 5
  const categoryTotals = {}

  answered.forEach(({ question, option }) => {
    if (!categoryTotals[question.category]) categoryTotals[question.category] = { score: 0, maxScore: 0 }
    categoryTotals[question.category].score += option.score
    categoryTotals[question.category].maxScore += 5
  })

  const answers = answered.map(({ question, option }) => ({
    questionId: question.id,
    questionText: question.title,
    selectedOption: option.label,
    score: option.score,
    category: question.category,
  }))

  if (skillEvidence.trim()) {
    answers.push({
      questionId: 'project_evidence',
      questionText: 'Project evidence or proof of work',
      selectedOption: skillEvidence.trim(),
      score: 0,
      category: 'evidence',
    })
  }

  if (experience || education) {
    answers.push({
      questionId: 'learner_context',
      questionText: 'Learner background',
      selectedOption: `Experience: ${experience || 'not specified'}; Education: ${education || 'not specified'}`,
      score: 0,
      category: 'profile',
    })
  }

  const marketLabel = [marketSelections.domainLabel, marketSelections.proofLabel].filter(Boolean).join(' | ')
  if (marketLabel) {
    answers.push({
      questionId: 'market_fit_wizard',
      questionText: 'Market fit choices',
      selectedOption: marketLabel,
      score: 0,
      category: 'market-fit',
    })
  }

  return {
    answers,
    totalScore,
    maxPossibleScore,
    percentile: maxPossibleScore ? Math.round((totalScore / maxPossibleScore) * 100) : 0,
    categoryBreakdown: Object.entries(categoryTotals).map(([category, value]) => ({
      category,
      score: value.score,
      maxScore: value.maxScore,
      percentage: Math.round((value.score / value.maxScore) * 100),
    })),
    completedAt: new Date().toISOString(),
  }
}

const Assessment = () => {
  const [expandedQuestions, setExpandedQuestions] = useState({})
  const [expandedOptionTexts, setExpandedOptionTexts] = useState({})
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    name: '', email: '', experience: '', education: '',
    skillCheck: {}, skillEvidence: '', interests: [], marketSelections: { domainId: '', domainLabel: '', proofId: '', proofLabel: '', tags: [] }, careerGoals: '', workPreference: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [showAuth, setShowAuth] = useState(false)
  const { token, user, login } = useAuth()
  const navigate = useNavigate()

  const toggleMarketSelection = (groupKey, optionId) => {
    setFormData(prev => ({
      ...prev,
      marketSelections: {
        ...prev.marketSelections,
        [groupKey]: (prev.marketSelections[groupKey] || []).includes(optionId)
          ? (prev.marketSelections[groupKey] || []).filter(id => id !== optionId)
          : [...(prev.marketSelections[groupKey] || []), optionId],
      },
    }))
  }

  const setDiagnosticAnswer = (questionId, score) => {
    setFormData(prev => ({ ...prev, skillCheck: { ...prev.skillCheck, [questionId]: score } }))
  }

  const progressPct = ((currentStep - 1) / (steps.length - 1)) * 100
  const measuredSkills = deriveMeasuredSkills(formData.skillCheck)
  const measuredSkillEntries = Object.entries(measuredSkills)
  const answeredDiagnostics = Object.keys(formData.skillCheck).length
  const diagnosticTotal = Object.values(formData.skillCheck).reduce((sum, score) => sum + Number(score || 0), 0)
  const diagnosticPercent = answeredDiagnostics ? Math.round((diagnosticTotal / (answeredDiagnostics * 5)) * 100) : 0
  const practicalTags = buildPracticalInterestTags(formData)
  const canContinue = (
    (currentStep !== 2 || answeredDiagnostics >= 4) &&
    (currentStep !== 4 || (formData.marketSelections.domainId && formData.marketSelections.proofId))
  )

  const toggleQuestionExpand = (id) => setExpandedQuestions(prev => ({ ...prev, [id]: !prev[id] }))
  const toggleOptionText = (questionId, optionIndex) => setExpandedOptionTexts(prev => ({ ...prev, [`${questionId}_${optionIndex}`]: !prev[`${questionId}_${optionIndex}`] }))
  const truncate = (text, length = 140) => (text && text.length > length ? `${text.slice(0, length).trim()}…` : text)

  const handleMarketFitChange = (nextSelection) => {
    setFormData(prev => ({ ...prev, marketSelections: nextSelection }))
  }

  const handleMarketFitConfirm = (nextSelection) => {
    setFormData(prev => ({ ...prev, marketSelections: nextSelection }))
  }

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

      const derivedSkills = deriveMeasuredSkills(formData.skillCheck)
      const skillRatings = Object.entries(derivedSkills).map(([name, level]) => ({
        name,
        proficiency: level,
        category: getSkillCategory(name),
      }))
      const extractedInterests = buildPracticalInterestTags(formData)

      const payload = {
        skillRatings,
        extractedInterests,
        careerGoals: formData.careerGoals,
        workPreferences: {
          style: formData.workPreference,
          industry: extractedInterests.filter(item => ['AI', 'Data', 'Cloud', 'Cybersecurity', 'IoT', 'Design', 'Agriculture'].includes(item)),
        },
        personalityTraits: [],
        quizResults: buildDiagnosticResults(formData),
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
              <div style={{ marginBottom: '1rem', padding: '0.9rem', borderRadius: '8px', background: 'rgba(2,6,23,0.45)', border: '1px solid rgba(148,163,184,0.06)' }}>
                <div style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: '0.45rem' }}>Quick guidance</div>
                <ul style={{ margin: 0, paddingLeft: '1.05rem', color: '#94a3b8', lineHeight: 1.6 }}>
                  <li>Pick the option that best matches what you can deliver in practice.</li>
                  <li>Answer at least 4 checks so recommendations are reliable.</li>
                  <li>Add one short proof of work (link or description).</li>
                </ul>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                <div style={{ flex: '1 1 280px' }}>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.5rem' }}>Practical Skill Check</h2>
                  <p style={{ color: '#64748b', fontSize: '0.875rem', lineHeight: 1.7 }}>
                    Choose what you can genuinely deliver in realistic Sri Lankan project situations. PATHAI converts these answers into measured skill levels for career matching.
                  </p>
                </div>
                <div style={{ minWidth: '165px', padding: '0.9rem 1rem', border: '1px solid rgba(0,212,255,0.18)', borderRadius: '8px', background: 'rgba(0,212,255,0.06)' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.35rem' }}>Diagnostic progress</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                    <span style={{ color: '#00d4ff', fontSize: '1.4rem', fontWeight: 800 }}>{answeredDiagnostics}</span>
                    <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>/ {diagnosticQuestions.length} checks</span>
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.25rem' }}>{diagnosticPercent}% evidence strength</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {[
                  { label: 'Minimum to continue', value: '4 checks' },
                  { label: 'Skill levels generated', value: measuredSkillEntries.length || '0' },
                  { label: 'Measurement style', value: 'Task evidence' },
                ].map(item => (
                  <div key={item.label} style={{ padding: '0.85rem', border: '1px solid rgba(148,163,184,0.12)', borderRadius: '8px', background: 'rgba(6,13,24,0.45)' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.35rem' }}>{item.label}</div>
                    <div style={{ color: '#e2e8f0', fontWeight: 700 }}>{item.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {diagnosticQuestions.map(question => {
                  const selectedScore = Number(formData.skillCheck[question.id])
                  return (
                    <div key={question.id} style={{
                      padding: '1rem',
                      borderRadius: '8px',
                      border: `1px solid ${selectedScore ? 'rgba(0,212,255,0.35)' : 'rgba(0,212,255,0.12)'}`,
                      background: selectedScore ? 'rgba(0,212,255,0.055)' : 'rgba(6,13,24,0.45)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.68rem', color: '#00d4ff', textTransform: 'uppercase', letterSpacing: '0.11em', fontWeight: 800 }}>{question.category}</span>
                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          Measures: {question.measures.map(item => item.name).join(', ')}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.75rem', marginBottom: '0.45rem' }}>
                        <h3 style={{ color: '#e2e8f0', fontSize: '1rem', fontWeight: 750, margin: 0 }}>{question.title}</h3>
                        <button onClick={() => toggleQuestionExpand(question.id)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.82rem', padding: 0 }}>
                          {expandedQuestions[question.id] ? 'Show less' : 'Read more'}
                        </button>
                      </div>
                      <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '0.9rem' }}>{expandedQuestions[question.id] ? question.scenario : truncate(question.scenario, 140)}</p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: '0.65rem' }}>
                        {question.options.map((option, optIdx) => {
                          const selected = selectedScore === option.score
                          const keyId = `${question.id}_${optIdx}`
                          return (
                            <button key={option.score} onClick={() => setDiagnosticAnswer(question.id, option.score)} style={{
                              minHeight: '82px',
                              padding: '0.8rem',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              textAlign: 'left',
                              transition: 'all 0.2s ease',
                              border: '1px solid',
                              borderColor: selected ? '#00d4ff' : 'rgba(148,163,184,0.14)',
                              background: selected ? 'rgba(0,212,255,0.12)' : 'rgba(2,4,8,0.32)',
                              color: selected ? '#dff9ff' : '#94a3b8',
                            }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '7px', marginBottom: '0.55rem', border: `1px solid ${selected ? '#00d4ff' : 'rgba(0,212,255,0.2)'}`, color: selected ? '#00d4ff' : '#64748b', fontWeight: 800 }}>
                                {optIdx + 1}
                              </span>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.6rem' }}>
                                <span style={{ display: 'block', fontSize: '0.8rem', lineHeight: 1.45, color: selected ? '#020408' : undefined }}>{expandedOptionTexts[keyId] ? option.label : truncate(option.label, 140)}</span>
                                {option.label && option.label.length > 140 && (
                                  <button onClick={(e) => { e.stopPropagation(); toggleOptionText(question.id, optIdx) }} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.75rem', padding: 0 }}>
                                    {expandedOptionTexts[keyId] ? 'Less' : 'More'}
                                  </button>
                                )}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div style={{ marginTop: '1.75rem', padding: '1rem', border: '1px solid rgba(124,58,237,0.22)', borderRadius: '8px', background: 'rgba(124,58,237,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.9rem' }}>
                  <div>
                    <h3 style={{ color: '#e2e8f0', fontSize: '0.95rem', fontWeight: 750, marginBottom: '0.3rem' }}>Measured skill levels</h3>
                    <p style={{ color: '#64748b', fontSize: '0.8rem' }}>Generated from the task answers above, not manual self-rating.</p>
                  </div>
                  <span style={{ color: answeredDiagnostics >= 4 ? '#00ff88' : '#fbbf24', fontSize: '0.78rem', fontWeight: 700 }}>
                    {answeredDiagnostics >= 4 ? 'Ready to continue' : `Answer ${4 - answeredDiagnostics} more`}
                  </span>
                </div>

                {measuredSkillEntries.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '0.75rem' }}>
                    {measuredSkillEntries.map(([skill, level]) => (
                      <div key={skill} style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(2,4,8,0.36)', border: '1px solid rgba(148,163,184,0.12)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.5rem' }}>
                          <span style={{ color: '#e2e8f0', fontSize: '0.82rem', fontWeight: 700 }}>{skill}</span>
                          <span style={{ color: '#00d4ff', fontSize: '0.82rem', fontWeight: 800 }}>{level}/5</span>
                        </div>
                        <div style={{ height: '6px', background: 'rgba(0,212,255,0.1)', borderRadius: '999px', overflow: 'hidden', marginBottom: '0.45rem' }}>
                          <div style={{ height: '100%', width: `${(level / 5) * 100}%`, background: 'linear-gradient(90deg,#00d4ff,#00ff88)', borderRadius: '999px' }} />
                        </div>
                        <div style={{ color: '#64748b', fontSize: '0.72rem' }}>{levelLabels[level]}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: '#64748b', fontSize: '0.85rem', padding: '0.75rem', border: '1px dashed rgba(148,163,184,0.22)', borderRadius: '8px' }}>
                    Select a few task answers to generate measurable skill levels.
                  </div>
                )}
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Proof of work
                </label>
                <textarea
                  className="input-futuristic"
                  rows={4}
                  placeholder="Short link or one-line proof (e.g., GitHub repo, dashboard link, or 1-sentence project proof)"
                  value={formData.skillEvidence}
                  onChange={e => setFormData(p => ({ ...p, skillEvidence: e.target.value }))}
                  style={{ resize: 'vertical' }}
                />
              </div>

              {answeredDiagnostics < 4 && (
                <div style={{ marginTop: '1rem', color: '#fbbf24', fontSize: '0.82rem', lineHeight: 1.6 }}>
                  Answer at least 4 practical checks so the prediction is based on enough evidence.
                </div>
              )}
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
              <MarketFitWizard
                value={formData.marketSelections}
                onChange={handleMarketFitChange}
                onConfirm={(selection) => {
                  handleMarketFitConfirm(selection)
                  setCurrentStep(s => Math.min(steps.length, s + 1))
                }}
              />

              <div style={{ marginTop: '1.4rem', padding: '1rem', border: '1px solid rgba(124,58,237,0.2)', borderRadius: '8px', background: 'rgba(124,58,237,0.06)' }}>
                <div style={{ fontSize: '0.72rem', color: '#a855f7', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800, marginBottom: '0.65rem' }}>Signals sent to career matching</div>
                {practicalTags.length ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {practicalTags.slice(0, 14).map(tag => (
                      <span key={tag} style={{ padding: '0.4rem 0.6rem', borderRadius: '999px', background: 'rgba(0,212,255,0.09)', border: '1px solid rgba(0,212,255,0.2)', color: '#94eaff', fontSize: '0.74rem', fontWeight: 700 }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: '#64748b', fontSize: '0.84rem' }}>Choose a problem and proof source to generate useful matching signals.</div>
                )}
              </div>

              <div style={{ marginTop: '1rem', color: '#94a3b8', fontSize: '0.82rem', lineHeight: 1.6 }}>
                Use the wizard above to pick a domain, choose a proof method, and confirm your signals.
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
              ? <button
                  onClick={() => canContinue && setCurrentStep(s => Math.min(steps.length, s + 1))}
                  disabled={!canContinue}
                  className="btn-primary"
                  style={{ opacity: canContinue ? 1 : 0.45, cursor: canContinue ? 'pointer' : 'not-allowed' }}
                >
                  {currentStep === 2 && !canContinue ? 'Answer 4 Checks' : currentStep === 4 && !canContinue ? 'Pick Problem + Proof' : 'Continue'} <HiArrowRight />
                </button>
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
