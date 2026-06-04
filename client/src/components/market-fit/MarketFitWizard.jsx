import { useMemo, useState } from 'react'
import { HiCheck, HiArrowRight } from 'react-icons/hi'
import { marketFitPresets, getMarketFitPreset } from './marketFitPresets'

const titleCase = (value) => value.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())

const buildSignals = (preset, proofId) => {
  const proof = preset?.proofOptions.find(item => item.id === proofId)
  return [...new Set([...(preset?.tags || []), ...(proof?.signals || [])])]
}

const MarketFitWizard = ({ value = {}, onChange, onConfirm }) => {
  const [step, setStep] = useState(1)
  const selectedPreset = getMarketFitPreset(value.domainId)
  const selectedProof = selectedPreset?.proofOptions.find(item => item.id === value.proofId)

  const signals = useMemo(() => buildSignals(selectedPreset, value.proofId), [selectedPreset, value.proofId])

  const selectDomain = (presetId) => {
    const preset = getMarketFitPreset(presetId)
    const nextProofId = preset?.proofOptions?.[0]?.id || ''
    onChange({
      domainId: presetId,
      domainLabel: preset?.label || '',
      proofId: nextProofId,
      proofLabel: preset?.proofOptions?.[0]?.label || '',
      tags: buildSignals(preset, nextProofId),
    })
    setStep(2)
  }

  const selectProof = (proofId) => {
    const nextTags = buildSignals(selectedPreset, proofId)
    onChange({
      ...value,
      proofId,
      proofLabel: selectedPreset?.proofOptions.find(item => item.id === proofId)?.label || '',
      tags: nextTags,
    })
    setStep(3)
  }

  const confirm = () => {
    onConfirm?.({
      ...value,
      tags: signals,
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ padding: '1rem', borderRadius: '14px', background: 'rgba(2,6,23,0.55)', border: '1px solid rgba(148,163,184,0.08)' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.8rem' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '999px', display: 'grid', placeItems: 'center', background: step >= 1 ? 'rgba(0,212,255,0.14)' : 'rgba(148,163,184,0.08)', color: step >= 1 ? '#00d4ff' : '#64748b', fontWeight: 800 }}>1</div>
          <div>
            <div style={{ color: '#e2e8f0', fontWeight: 800 }}>Choose a domain</div>
            <div style={{ color: '#94a3b8', fontSize: '0.86rem' }}>Pick the area you want to work in.</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '0.7rem' }}>
          {marketFitPresets.map(preset => {
            const active = value.domainId === preset.id
            return (
              <button
                key={preset.id}
                onClick={() => selectDomain(preset.id)}
                style={{
                  padding: '0.95rem',
                  borderRadius: '12px',
                  border: `1px solid ${active ? '#00d4ff' : 'rgba(148,163,184,0.12)'}`,
                  background: active ? 'rgba(0,212,255,0.12)' : 'rgba(15,23,42,0.55)',
                  color: active ? '#e2e8f0' : '#cbd5e1',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <strong>{preset.label}</strong>
                  {active ? <HiCheck color="#00d4ff" /> : <HiArrowRight color="#64748b" />}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {preset.tags.slice(0, 4).map(tag => (
                    <span key={tag} style={{ fontSize: '0.72rem', padding: '0.22rem 0.5rem', borderRadius: '999px', background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>{tag}</span>
                  ))}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ padding: '1rem', borderRadius: '14px', background: 'rgba(2,6,23,0.55)', border: `1px solid ${value.domainId ? 'rgba(0,212,255,0.15)' : 'rgba(148,163,184,0.08)'}`, opacity: value.domainId ? 1 : 0.55 }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.8rem' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '999px', display: 'grid', placeItems: 'center', background: step >= 2 ? 'rgba(0,212,255,0.14)' : 'rgba(148,163,184,0.08)', color: step >= 2 ? '#00d4ff' : '#64748b', fontWeight: 800 }}>2</div>
          <div>
            <div style={{ color: '#e2e8f0', fontWeight: 800 }}>How will you prove it?</div>
            <div style={{ color: '#94a3b8', fontSize: '0.86rem' }}>Choose a simple validation method.</div>
          </div>
        </div>
        {!selectedPreset ? (
          <div style={{ color: '#64748b', fontSize: '0.92rem' }}>Pick a domain first.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '0.7rem' }}>
            {selectedPreset.proofOptions.map(option => {
              const active = value.proofId === option.id
              return (
                <button
                  key={option.id}
                  onClick={() => selectProof(option.id)}
                  style={{
                    padding: '0.95rem',
                    borderRadius: '12px',
                    border: `1px solid ${active ? '#00d4ff' : 'rgba(148,163,184,0.12)'}`,
                    background: active ? 'rgba(0,212,255,0.12)' : 'rgba(15,23,42,0.55)',
                    color: active ? '#e2e8f0' : '#cbd5e1',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <strong>{option.label}</strong>
                    {active ? <HiCheck color="#00d4ff" /> : <HiArrowRight color="#64748b" />}
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.45 }}>{option.helper}</div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div style={{ padding: '1rem', borderRadius: '14px', background: 'rgba(3,7,18,0.72)', border: '1px solid rgba(34,197,94,0.22)' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.8rem' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '999px', display: 'grid', placeItems: 'center', background: step >= 3 ? 'rgba(34,197,94,0.14)' : 'rgba(148,163,184,0.08)', color: step >= 3 ? '#22c55e' : '#64748b', fontWeight: 800 }}>3</div>
          <div>
            <div style={{ color: '#e2e8f0', fontWeight: 800 }}>Review career signals</div>
            <div style={{ color: '#94a3b8', fontSize: '0.86rem' }}>These tags help match your practical direction.</div>
          </div>
        </div>

        <div style={{ padding: '0.95rem', borderRadius: '12px', background: 'linear-gradient(180deg, rgba(34,197,94,0.12), rgba(2,6,23,0.55))', border: '1px solid rgba(34,197,94,0.18)', marginBottom: '0.9rem' }}>
          <div style={{ color: '#86efac', fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800, marginBottom: '0.6rem' }}>Career matching signals</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {signals.length > 0 ? signals.map(tag => (
              <span key={tag} style={{ padding: '0.42rem 0.65rem', borderRadius: '999px', background: 'rgba(255,255,255,0.06)', color: '#dcfce7', border: '1px solid rgba(34,197,94,0.16)', fontSize: '0.8rem', fontWeight: 700 }}>
                {titleCase(tag)}
              </span>
            )) : (
              <span style={{ color: '#94a3b8' }}>Select a domain and proof method to see your signals.</span>
            )}
          </div>
        </div>

        <button
          onClick={confirm}
          disabled={!value.domainId || !value.proofId}
          style={{
            width: '100%',
            padding: '0.95rem 1rem',
            borderRadius: '12px',
            border: 'none',
            cursor: value.domainId && value.proofId ? 'pointer' : 'not-allowed',
            background: value.domainId && value.proofId ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'rgba(148,163,184,0.2)',
            color: value.domainId && value.proofId ? '#020617' : '#94a3b8',
            fontWeight: 800,
            transition: 'all 0.25s ease',
          }}
        >
          Confirm & Continue
        </button>
      </div>
    </div>
  )
}

export default MarketFitWizard
