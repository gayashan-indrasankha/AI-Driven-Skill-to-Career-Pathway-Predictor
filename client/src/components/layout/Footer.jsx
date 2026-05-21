import { Link } from 'react-router-dom'
import { MdOutlineElectricBolt } from 'react-icons/md'
import { FiGithub, FiTwitter, FiLinkedin, FiMail } from 'react-icons/fi'

const footerLinks = {
  Product: [
    { label: 'Home', to: '/' },
    { label: 'Assessment', to: '/assessment' },
    { label: 'Dashboard', to: '/dashboard' },
    { label: 'Simulation', to: '/simulation' },
  ],
  Technology: [
    { label: 'AI Engine', to: '#' },
    { label: 'Skill Graph', to: '#' },
    { label: 'Career Data', to: '#' },
    { label: 'API Docs', to: '#' },
  ],
  Company: [
    { label: 'About', to: '#' },
    { label: 'Blog', to: '#' },
    { label: 'Careers', to: '#' },
    { label: 'Contact', to: '#' },
  ],
}

const socialIcons = [
  { icon: FiGithub, href: '#', label: 'GitHub' },
  { icon: FiTwitter, href: '#', label: 'Twitter' },
  { icon: FiLinkedin, href: '#', label: 'LinkedIn' },
  { icon: FiMail, href: '#', label: 'Email' },
]

const Footer = () => {
  return (
    <footer
      style={{
        position: 'relative',
        zIndex: 1,
        borderTop: '1px solid rgba(0,212,255,0.08)',
        background: 'rgba(2, 4, 8, 0.8)',
        backdropFilter: 'blur(10px)',
        marginTop: 'auto',
      }}
    >
      {/* Top glow line */}
      <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.4), rgba(124,58,237,0.4), transparent)' }} />

      <div className="container-max section-pad" style={{ paddingTop: '3.5rem', paddingBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '3rem', marginBottom: '3rem' }}>

          {/* Brand column */}
          <div>
            <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <div style={{
                width: '36px', height: '36px',
                background: 'linear-gradient(135deg, #00d4ff, #7c3aed)',
                borderRadius: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 16px rgba(0,212,255,0.3)',
              }}>
                <MdOutlineElectricBolt size={20} color="#020408" />
              </div>
              <span className="font-display" style={{ fontSize: '1.1rem', fontWeight: 700, color: '#e2e8f0', letterSpacing: '0.05em' }}>
                PATH<span style={{ color: '#00d4ff' }}>AI</span>
              </span>
            </Link>
            <p style={{ color: '#64748b', fontSize: '0.875rem', lineHeight: 1.7, maxWidth: '280px', marginBottom: '1.5rem' }}>
              AI-driven career intelligence platform that maps your skills to the future of work. Navigate your professional journey with data.
            </p>
            {/* Social icons */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {socialIcons.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  style={{
                    width: '36px', height: '36px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(0,212,255,0.05)',
                    border: '1px solid rgba(0,212,255,0.12)',
                    borderRadius: '8px',
                    color: '#64748b',
                    transition: 'all 0.25s ease',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = '#00d4ff'
                    e.currentTarget.style.borderColor = 'rgba(0,212,255,0.35)'
                    e.currentTarget.style.background = 'rgba(0,212,255,0.1)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = '#64748b'
                    e.currentTarget.style.borderColor = 'rgba(0,212,255,0.12)'
                    e.currentTarget.style.background = 'rgba(0,212,255,0.05)'
                  }}
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h4 className="font-display" style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#00d4ff', marginBottom: '1.25rem' }}>
                {section}
              </h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {links.map(({ label, to }) => (
                  <li key={label}>
                    <Link
                      to={to}
                      style={{ textDecoration: 'none', color: '#64748b', fontSize: '0.875rem', transition: 'color 0.2s ease' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#94a3b8'}
                      onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <hr className="divider-glow" style={{ marginBottom: '1.5rem' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <p style={{ color: '#334155', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
            © {new Date().getFullYear()} PathAI. All rights reserved.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div className="pulse-dot" />
            <span style={{ color: '#334155', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
              Systems Operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
