import { Link } from 'react-router-dom'
import { HiArrowRight, HiLightningBolt, HiChartBar, HiAcademicCap } from 'react-icons/hi'
import { MdOutlineAutoGraph, MdOutlinePsychology, MdOutlineTimeline } from 'react-icons/md'

const features = [
  {
    icon: MdOutlinePsychology,
    title: 'Evidence-Based Skill Assessment',
    description: 'Rate practical skills, scan GitHub evidence, and map readiness against Sri Lanka-focused career requirements.',
    color: '#00d4ff',
    badge: 'Smart',
  },
  {
    icon: MdOutlineAutoGraph,
    title: 'Market-Aware Career Matching',
    description: 'Recommendations blend skill fit with local demand, export-sector relevance, salary bands, and employer types.',
    color: '#7c3aed',
    badge: 'AI-Powered',
  },
  {
    icon: MdOutlineTimeline,
    title: 'Science-to-Business Roadmaps',
    description: 'Each pathway includes learning cost, prototype ideas, target customers, and revenue models for a real pitch.',
    color: '#00ff88',
    badge: 'Predictive',
  },
]

const stats = [
  { value: '6', label: 'High-Value Paths' },
  { value: 'LKR', label: 'Local Salary Bands' },
  { value: '2024', label: 'Market Sources' },
  { value: '1', label: 'Prototype per Path' },
]

const Home = () => {
  return (
    <div style={{ position: 'relative', zIndex: 1 }}>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="section-pad" style={{ paddingTop: '7rem', paddingBottom: '5rem', textAlign: 'center' }}>
        <div className="container-max fade-in-up">
          <div className="badge badge-cyan" style={{ margin: '0 auto 2rem', display: 'inline-flex' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00d4ff', boxShadow: '0 0 6px #00d4ff' }} />
            Sri Lanka Science-to-Business Career Intelligence
          </div>

          <h1
            className="font-display"
            style={{
              fontSize: 'clamp(2.5rem, 6vw, 5rem)',
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              marginBottom: '1.5rem',
              color: '#e2e8f0',
            }}
          >
            Build a{' '}
            <span className="gradient-text-cyan">Market-Ready Career</span>
            <br />
            With <span className="gradient-text-purple">Real Data</span>
          </h1>

          <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', color: '#64748b', maxWidth: '640px', margin: '0 auto 2.5rem', lineHeight: 1.75 }}>
            Turn student skills into practical Sri Lankan ICT, AI, IoT, and analytics careers with transparent scoring, real market evidence, and business-ready prototype plans.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/assessment" className="btn-primary" style={{ fontSize: '1rem', padding: '0.875rem 2.25rem' }}>
              Start Assessment <HiArrowRight />
            </Link>
            <Link to="/dashboard" className="btn-secondary" style={{ fontSize: '1rem', padding: '0.875rem 2.25rem' }}>
              View Dashboard
            </Link>
          </div>

        </div>
      </section>

      {/* ── Stats Bar ───────────────────────────────────────────── */}
      <section style={{ padding: '2rem 1.5rem' }}>
        <div className="container-max">
          <div
            className="glass-card"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', padding: '2rem', gap: '1rem' }}
          >
            {stats.map(({ value, label }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div
                  className="font-display"
                  style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 800, color: '#00d4ff', marginBottom: '0.25rem' }}
                >
                  {value}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#475569', letterSpacing: '0.05em' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────── */}
      <section className="section-pad">
        <div className="container-max">
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div className="badge badge-purple" style={{ margin: '0 auto 1rem', display: 'inline-flex' }}>Features</div>
            <h2
              className="font-display"
              style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 800, color: '#e2e8f0', letterSpacing: '-0.02em' }}
            >
              Everything You Need to
              <span className="gradient-text-multi"> Succeed</span>
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {features.map(({ icon: Icon, title, description, color, badge }) => (
              <div
                key={title}
                className="glass-card"
                style={{ padding: '2rem' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <div style={{
                    width: '52px', height: '52px',
                    background: `${color}15`,
                    border: `1px solid ${color}30`,
                    borderRadius: '12px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={26} color={color} />
                  </div>
                  <span className="badge" style={{ background: `${color}10`, border: `1px solid ${color}25`, color }}>{badge}</span>
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.75rem' }}>{title}</h3>
                <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.7 }}>{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ──────────────────────────────────────────── */}
      <section style={{ padding: '3rem 1.5rem 5rem' }}>
        <div className="container-max">
          <div
            className="glass-card"
            style={{
              padding: '4rem 2rem',
              textAlign: 'center',
              background: 'linear-gradient(135deg, rgba(0,212,255,0.05) 0%, rgba(124,58,237,0.05) 100%)',
              border: '1px solid rgba(0,212,255,0.15)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <h2
              className="font-display"
              style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 800, color: '#e2e8f0', marginBottom: '1rem', letterSpacing: '-0.02em' }}
            >
              Ready for the Judges' Questions?
            </h2>
            <p style={{ color: '#64748b', marginBottom: '2rem', maxWidth: '480px', margin: '0 auto 2rem', lineHeight: 1.7 }}>
              Run the assessment, show the source-backed recommendation, then pitch a realistic prototype with cost, customer, and revenue model.
            </p>
            <Link to="/assessment" className="btn-primary" style={{ fontSize: '1rem', padding: '0.875rem 2.5rem' }}>
              Begin Your Journey <HiArrowRight />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
