import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HiArrowRight, HiArrowLeft, HiCheck } from 'react-icons/hi'
import { FiAlertCircle } from 'react-icons/fi'
import GitHubExtractor from '../components/GitHubExtractor'
import AuthModal from '../components/AuthModal'
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
    title: 'Analyze messy student or sales CSV data',
    scenario: 'A school or small business gives you attendance, sales, and results in separate CSV files. What can you deliver in one day?',
    measures: [
      { name: 'Python', weight: 1 },
      { name: 'Excel', weight: 0.7 },
      { name: 'Data Analysis', weight: 1 },
      { name: 'Statistics', weight: 0.7 },
      { name: 'Communication', weight: 0.4 },
    ],
    options: [
      { score: 1, label: 'I can describe the columns but need help cleaning and analyzing the data.' },
      { score: 2, label: 'I can use Excel filters, charts, and basic formulas to find simple patterns.' },
      { score: 4, label: 'I can clean the data, calculate useful metrics, and create charts with clear findings.' },
      { score: 5, label: 'I can automate cleaning, validate assumptions, visualize trends, and explain business actions.' },
    ],
  },
  {
    id: 'sql_dashboard',
    category: 'Business intelligence',
    title: 'Turn customer records into a simple dashboard',
    scenario: 'A training center wants monthly registrations, payment status, and course demand from multiple tables.',
    measures: [
      { name: 'SQL', weight: 1 },
      { name: 'Excel', weight: 0.6 },
      { name: 'Data Analysis', weight: 0.8 },
      { name: 'Problem Solving', weight: 0.5 },
    ],
    options: [
      { score: 1, label: 'I can inspect the table names but need help writing useful queries.' },
      { score: 2, label: 'I can write SELECT, WHERE, and basic summaries for one table.' },
      { score: 4, label: 'I can join tables, group results, export clean data, and build a basic dashboard.' },
      { score: 5, label: 'I can design the query flow, check data quality, and deliver decision-ready insights.' },
    ],
  },
  {
    id: 'ml_model',
    category: 'AI model',
    title: 'Build and test a prediction model',
    scenario: 'A farmer cooperative asks for a prototype that predicts crop disease risk from weather and field observations.',
    measures: [
      { name: 'Machine Learning', weight: 1 },
      { name: 'Statistics', weight: 0.8 },
      { name: 'Python', weight: 0.8 },
      { name: 'Risk Assessment', weight: 0.5 },
    ],
    options: [
      { score: 1, label: 'I understand the goal but need help preparing data or training a model.' },
      { score: 2, label: 'I can train a tutorial model if the dataset and steps are already prepared.' },
      { score: 4, label: 'I can split data, train a baseline model, evaluate accuracy, and explain limitations.' },
      { score: 5, label: 'I can compare models, reduce false alarms, document risks, and make a usable demo.' },
    ],
  },
  {
    id: 'deploy_app',
    category: 'Deployment',
    title: 'Deploy a working web prototype',
    scenario: 'Your team has a MERN or Python app and needs judges to access it reliably during the exhibition.',
    measures: [
      { name: 'Linux', weight: 0.8 },
      { name: 'Docker', weight: 0.8 },
      { name: 'Cloud Deployment', weight: 1 },
      { name: 'Problem Solving', weight: 0.5 },
    ],
    options: [
      { score: 1, label: 'I can run the app locally but need help deploying it.' },
      { score: 2, label: 'I can follow deployment steps on a platform like Render, Vercel, or Railway.' },
      { score: 4, label: 'I can configure environment variables, database access, logs, and a public URL.' },
      { score: 5, label: 'I can containerize, monitor failures, document recovery steps, and demo reliably.' },
    ],
  },
  {
    id: 'security_audit',
    category: 'Security',
    title: 'Check a small organization for cyber risk',
    scenario: 'A school lab or SME wants to reduce password, Wi-Fi, phishing, and data-sharing risks.',
    measures: [
      { name: 'Security', weight: 1 },
      { name: 'Risk Assessment', weight: 1 },
      { name: 'Networking', weight: 0.7 },
      { name: 'Communication', weight: 0.5 },
    ],
    options: [
      { score: 1, label: 'I know common threats but need help checking a real environment.' },
      { score: 2, label: 'I can identify weak passwords, suspicious emails, and unsafe sharing practices.' },
      { score: 4, label: 'I can run a structured checklist, score risks, and recommend practical controls.' },
      { score: 5, label: 'I can prioritize risk by impact, explain tradeoffs, and create a simple action plan.' },
    ],
  },
  {
    id: 'iot_sensor',
    category: 'IoT prototype',
    title: 'Prototype a sensor-based monitoring device',
    scenario: 'A buyer wants a low-cost device to monitor soil moisture, room air quality, or water level.',
    measures: [
      { name: 'Electronics', weight: 1 },
      { name: 'Arduino', weight: 1 },
      { name: 'Sensors', weight: 1 },
      { name: 'Problem Solving', weight: 0.5 },
    ],
    options: [
      { score: 1, label: 'I can identify needed components but need help wiring and coding.' },
      { score: 2, label: 'I can follow a wiring diagram and read sensor values with sample code.' },
      { score: 4, label: 'I can calibrate readings, build alerts, and package a stable demonstration.' },
      { score: 5, label: 'I can improve reliability, estimate unit cost, and explain scale-up for customers.' },
    ],
  },
  {
    id: 'ux_field_test',
    category: 'User validation',
    title: 'Test whether users can actually use the product',
    scenario: 'Before pitching, you need evidence that students, farmers, or SMEs understand the prototype.',
    measures: [
      { name: 'User Research', weight: 1 },
      { name: 'UX Design', weight: 1 },
      { name: 'Communication', weight: 0.6 },
      { name: 'Data Analysis', weight: 0.4 },
    ],
    options: [
      { score: 1, label: 'I can ask for opinions but need help planning a proper test.' },
      { score: 2, label: 'I can prepare a few questions and collect basic feedback from users.' },
      { score: 4, label: 'I can run task-based testing, record issues, and improve the interface.' },
      { score: 5, label: 'I can measure success rate, compare feedback, and prove customer need.' },
    ],
  },
  {
    id: 'team_pitch',
    category: 'Commercial delivery',
    title: 'Coordinate the team and pitch the business value',
    scenario: 'You have three minutes to convince judges the science can become a practical Sri Lankan business.',
    measures: [
      { name: 'Leadership', weight: 0.9 },
      { name: 'Teamwork', weight: 1 },
      { name: 'Communication', weight: 1 },
      { name: 'Problem Solving', weight: 0.6 },
    ],
    options: [
      { score: 1, label: 'I can explain my part but need help connecting science, users, and money.' },
      { score: 2, label: 'I can help prepare slides and answer simple questions from judges.' },
      { score: 4, label: 'I can divide work, explain customer value, and respond to practical objections.' },
      { score: 5, label: 'I can lead the pitch, defend cost and market assumptions, and handle Q&A clearly.' },
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

const marketSelectionGroups = [
  {
    key: 'problemAreas',
    title: 'Real problem area',
    helper: 'Choose problems where you can explain the customer pain and measurable value.',
    required: true,
    options: [
      {
        id: 'school_risk_dashboard',
        title: 'Student performance or dropout risk',
        customer: 'Schools, tuition classes, parents',
        proof: 'Early warning dashboard using attendance, marks, and engagement data.',
        tags: ['Data', 'AI', 'analytics', 'education', 'social impact', 'research'],
      },
      {
        id: 'smart_agriculture',
        title: 'Crop disease, irrigation, or farm monitoring',
        customer: 'Farmers, agri officers, cooperatives',
        proof: 'Sensor or AI prototype that reduces crop loss, water waste, or inspection time.',
        tags: ['Agriculture', 'IoT', 'AI', 'data', 'sensors', 'machine learning'],
      },
      {
        id: 'sme_business_visibility',
        title: 'SME sales, stock, or cost visibility',
        customer: 'Retail shops, service businesses, student startups',
        proof: 'Dashboard that shows profit leaks, demand trends, or cash-flow risk.',
        tags: ['Data', 'SQL', 'Excel', 'analytics', 'business', 'Entrepreneurship'],
      },
      {
        id: 'cyber_safety',
        title: 'Cyber safety for schools or SMEs',
        customer: 'Schools, clubs, small businesses',
        proof: 'Risk checklist, phishing scanner, or action plan that lowers common threats.',
        tags: ['Cybersecurity', 'security', 'risk', 'networking', 'business'],
      },
      {
        id: 'public_service_ux',
        title: 'Better access to public or campus services',
        customer: 'Students, clinics, campus offices, public counters',
        proof: 'Tested workflow that reduces waiting, confusion, or missed applications.',
        tags: ['Design', 'UX', 'research', 'social impact', 'communication'],
      },
      {
        id: 'low_cost_cloud',
        title: 'Low-cost reliable app hosting',
        customer: 'Student founders, SMEs, campus teams',
        proof: 'Deployment plan that keeps apps online and controls monthly cloud cost.',
        tags: ['Cloud', 'DevOps', 'Docker', 'platform engineering', 'business'],
      },
    ],
  },
  {
    key: 'validationAssets',
    title: 'Proof you can collect before judging',
    helper: 'Judges will trust evidence more than opinions. Pick what your team can actually access.',
    required: true,
    options: [
      {
        id: 'interview_users',
        title: 'Interview 5+ real users',
        customer: 'Students, farmers, shop owners, staff, or coordinators',
        proof: 'Short findings table with pain points, current workaround, and willingness to try.',
        tags: ['research', 'UX', 'social impact', 'communication'],
      },
      {
        id: 'pilot_location',
        title: 'Use a pilot location',
        customer: 'School, farm, shop, lab, club, department, or clinic',
        proof: 'One-page pilot plan with owner approval and test schedule.',
        tags: ['business', 'Entrepreneurship', 'research'],
      },
      {
        id: 'real_dataset',
        title: 'Use real data or field readings',
        customer: 'Records, CSV exports, surveys, sensor readings, or logs',
        proof: 'Clean sample dataset with source, date, and privacy notes.',
        tags: ['Data', 'analytics', 'AI', 'IoT', 'statistics'],
      },
      {
        id: 'budget_owner',
        title: 'Identify who could pay',
        customer: 'Owner, principal, coordinator, farmer group, or department head',
        proof: 'Simple buyer profile with budget reason and expected value in LKR.',
        tags: ['Entrepreneurship', 'business', 'social impact'],
      },
    ],
  },
  {
    key: 'prototypeRoute',
    title: 'Prototype route',
    helper: 'Pick the demonstration format that best proves value on an exhibition table.',
    required: false,
    options: [
      {
        id: 'dashboard_web_app',
        title: 'Dashboard or web app',
        customer: 'Best for data, AI, cloud, UX, and business analytics',
        proof: 'Live screens with before/after metrics and exportable report.',
        tags: ['Data', 'AI', 'Cloud', 'Design', 'analytics'],
      },
      {
        id: 'sensor_device',
        title: 'Sensor or IoT device',
        customer: 'Best for agriculture, environment, safety, and monitoring',
        proof: 'Working device, readings, bill of materials, and field test plan.',
        tags: ['IoT', 'Agriculture', 'sensors', 'electronics'],
      },
      {
        id: 'audit_action_plan',
        title: 'Audit plus action plan',
        customer: 'Best for cybersecurity, risk, operations, and cost saving',
        proof: 'Risk score, prioritized fixes, and practical implementation checklist.',
        tags: ['Cybersecurity', 'security', 'risk', 'business'],
      },
      {
        id: 'tested_mobile_flow',
        title: 'Tested mobile-first workflow',
        customer: 'Best for students, public services, field teams, and SMEs',
        proof: 'Clickable prototype with user task success and feedback evidence.',
        tags: ['Design', 'UX', 'research', 'social impact'],
      },
    ],
  },
]

const getSelectedMarketOptions = (marketSelections = {}) => marketSelectionGroups.flatMap(group =>
  (marketSelections[group.key] || [])
    .map(optionId => group.options.find(option => option.id === optionId))
    .filter(Boolean)
    .map(option => ({ ...option, groupTitle: group.title, groupKey: group.key }))
)

const buildPracticalInterestTags = ({ interests = [], marketSelections = {} }) => {
  const marketTags = getSelectedMarketOptions(marketSelections).flatMap(option => option.tags)
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

  getSelectedMarketOptions(marketSelections).forEach(option => {
    answers.push({
      questionId: `market_${option.groupKey}_${option.id}`,
      questionText: option.groupTitle,
      selectedOption: `${option.title} | Customer: ${option.customer} | Proof: ${option.proof}`,
      score: 0,
      category: 'market-fit',
    })
  })

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
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    name: '', email: '', experience: '', education: '',
    skillCheck: {}, skillEvidence: '', interests: [], marketSelections: {}, careerGoals: '', workPreference: '',
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
  const selectedProblemCount = formData.marketSelections.problemAreas?.length || 0
  const selectedValidationCount = formData.marketSelections.validationAssets?.length || 0
  const selectedPrototypeCount = formData.marketSelections.prototypeRoute?.length || 0
  const canContinue = (
    (currentStep !== 2 || answeredDiagnostics >= 4) &&
    (currentStep !== 4 || (selectedProblemCount >= 1 && selectedValidationCount >= 1))
  )

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
                      <h3 style={{ color: '#e2e8f0', fontSize: '1rem', fontWeight: 750, marginBottom: '0.45rem' }}>{question.title}</h3>
                      <p style={{ color: '#94a3b8', fontSize: '0.84rem', lineHeight: 1.6, marginBottom: '0.9rem' }}>{question.scenario}</p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: '0.65rem' }}>
                        {question.options.map(option => {
                          const selected = selectedScore === option.score
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
                                {option.score}
                              </span>
                              <span style={{ display: 'block', fontSize: '0.8rem', lineHeight: 1.45 }}>{option.label}</span>
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
                  placeholder="Example: GitHub repo, school project, Arduino prototype, Power BI dashboard, field survey, science exhibition demo, customer interview notes..."
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
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                <div style={{ flex: '1 1 320px' }}>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.5rem' }}>Problem-Market Fit</h2>
                  <p style={{ color: '#64748b', fontSize: '0.875rem', lineHeight: 1.7 }}>
                    Pick a problem you can validate with real users, data, or a pilot location before the exhibition. These choices guide the career match and make the pitch more commercial.
                  </p>
                </div>
                <div style={{ minWidth: '190px', padding: '0.9rem 1rem', border: '1px solid rgba(0,212,255,0.18)', borderRadius: '8px', background: 'rgba(0,212,255,0.06)' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.35rem' }}>Commercial readiness</div>
                  <div style={{ color: selectedProblemCount && selectedValidationCount ? '#00ff88' : '#fbbf24', fontSize: '1rem', fontWeight: 800 }}>
                    {selectedProblemCount && selectedValidationCount ? 'Evidence ready' : 'Needs proof'}
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.35rem' }}>
                    {selectedProblemCount} problem, {selectedValidationCount} proof, {selectedPrototypeCount} prototype
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(185px,1fr))', gap: '0.75rem', marginBottom: '1.4rem' }}>
                {[
                  { label: 'Problem required', value: selectedProblemCount >= 1 ? 'Selected' : 'Pick one' },
                  { label: 'Customer proof required', value: selectedValidationCount >= 1 ? 'Selected' : 'Pick one' },
                  { label: 'AI matching signals', value: practicalTags.length || '0' },
                ].map(item => (
                  <div key={item.label} style={{ padding: '0.85rem', border: '1px solid rgba(148,163,184,0.12)', borderRadius: '8px', background: 'rgba(6,13,24,0.45)' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.35rem' }}>{item.label}</div>
                    <div style={{ color: '#e2e8f0', fontWeight: 700 }}>{item.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                {marketSelectionGroups.map(group => (
                  <div key={group.key} style={{ padding: '1rem', border: '1px solid rgba(0,212,255,0.12)', borderRadius: '8px', background: 'rgba(6,13,24,0.45)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.8rem', alignItems: 'baseline', flexWrap: 'wrap', marginBottom: '0.45rem' }}>
                      <h3 style={{ color: '#e2e8f0', fontSize: '1rem', fontWeight: 750 }}>{group.title}</h3>
                      <span style={{ color: group.required ? '#00d4ff' : '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800 }}>
                        {group.required ? 'Required' : 'Optional'}
                      </span>
                    </div>
                    <p style={{ color: '#64748b', fontSize: '0.82rem', lineHeight: 1.6, marginBottom: '0.9rem' }}>{group.helper}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(245px,1fr))', gap: '0.75rem' }}>
                      {group.options.map(option => {
                        const selected = (formData.marketSelections[group.key] || []).includes(option.id)
                        return (
                          <button key={option.id} onClick={() => toggleMarketSelection(group.key, option.id)} style={{
                            minHeight: '154px',
                            padding: '0.9rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            textAlign: 'left',
                            border: '1px solid',
                            borderColor: selected ? '#00d4ff' : 'rgba(148,163,184,0.14)',
                            background: selected ? 'rgba(0,212,255,0.12)' : 'rgba(2,4,8,0.32)',
                            color: selected ? '#dff9ff' : '#94a3b8',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.6rem',
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                              <span style={{ color: selected ? '#e2e8f0' : '#cbd5e1', fontWeight: 800, fontSize: '0.9rem', lineHeight: 1.35 }}>{option.title}</span>
                              <span style={{ width: '22px', height: '22px', borderRadius: '6px', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${selected ? '#00d4ff' : 'rgba(0,212,255,0.25)'}`, background: selected ? '#00d4ff' : 'transparent' }}>
                                {selected && <HiCheck size={13} color="#020408" />}
                              </span>
                            </div>
                            <div>
                              <div style={{ color: '#00d4ff', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800, marginBottom: '0.25rem' }}>Customer</div>
                              <div style={{ fontSize: '0.78rem', lineHeight: 1.45 }}>{option.customer}</div>
                            </div>
                            <div>
                              <div style={{ color: '#a855f7', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800, marginBottom: '0.25rem' }}>Proof for judges</div>
                              <div style={{ fontSize: '0.78rem', lineHeight: 1.45 }}>{option.proof}</div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>

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

              {(!selectedProblemCount || !selectedValidationCount) && (
                <div style={{ marginTop: '1rem', color: '#fbbf24', fontSize: '0.82rem', lineHeight: 1.6 }}>
                  Select at least one real problem area and one proof source before continuing.
                </div>
              )}
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
