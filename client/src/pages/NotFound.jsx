import { Link } from 'react-router-dom'
import { HiArrowLeft } from 'react-icons/hi'

const NotFound = () => (
  <div className="section-pad" style={{ position: 'relative', zIndex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
    <div className="font-display" style={{ fontSize: 'clamp(6rem, 15vw, 12rem)', fontWeight: 900, lineHeight: 1, background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(124,58,237,0.2))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: '1rem' }}>
      404
    </div>
    <h1 className="font-display" style={{ fontSize: 'clamp(1.25rem, 3vw, 2rem)', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.75rem' }}>
      Signal Lost
    </h1>
    <p style={{ color: '#475569', marginBottom: '2.5rem', maxWidth: '380px', lineHeight: 1.7 }}>
      This page doesn't exist in our system. The pathway you're looking for may have been rerouted or removed.
    </p>
    <Link to="/" className="btn-primary">
      <HiArrowLeft /> Return to Base
    </Link>
  </div>
)

export default NotFound
