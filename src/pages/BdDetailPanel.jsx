// BdDetailPanel.jsx — NZ BD Compass
// Slide-in detail panel for a single BD opportunity. Fetches
// /api/cross-ref/drug/:chemical for the BD breakdown from pharmac-tracker API.
import { useState, useEffect } from 'react'
import '../bd-detail-panel.css'

const API = import.meta.env.VITE_API_BASE || 'http://localhost:3002'

const I = {
  close:  (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>),
  arrow:  (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>),
  search: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.4-3.4" /></svg>),
  alert:  (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h.01" /></svg>),
}

const FACTOR_MAX   = { revenue: 30, auAccess: 25, ofi: 20, patent: 15, gapDensity: 10 }
const FACTOR_LABEL = { revenue: 'Revenue', auAccess: 'AU access', ofi: 'OFI', patent: 'Patent', gapDensity: 'Gap density' }
const BREAKDOWN_KEYS = ['revenue', 'auAccess', 'ofi', 'patent', 'gapDensity']

function tierOf(score) {
  if (score >= 80) return { c: 'var(--accent)', k: 'High priority' }
  if (score >= 65) return { c: 'var(--amber)',  k: 'Worth watching' }
  return                  { c: 'var(--gray)',   k: 'Lower priority' }
}
const segCount = score => Math.max(1, Math.min(5, Math.round(score / 20)))

const RISK_META = {
  high:   { tone: 'high', label: 'High',   tag: 'margin pressure',          desc: 'Several NZ-funded alternatives sit in the same ATC class — expect downward reference-pricing pressure on any funded price.' },
  medium: { tone: 'med',  label: 'Medium', tag: 'some funded competition',   desc: 'Some NZ-funded alternatives in the ATC class — moderate reference-pricing exposure.' },
  low:    { tone: 'low',  label: 'Low',    tag: 'little funded competition',  desc: 'Few or no NZ-funded alternatives in the ATC class — limited reference-pricing exposure.' },
}
function riskFlagsOf(gap) {
  const out = []
  const r = gap.reference_pricing_risk
  if (r && RISK_META[r]) out.push({ key: 'refPricing', name: 'Reference pricing', level: r, ...RISK_META[r] })
  return out
}

const prettySector = s => (s || '').replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

function whyText(key, breakdown, drugDetail, gap) {
  const pts = breakdown[key] ?? 0
  const max = FACTOR_MAX[key]
  const g   = drugDetail?.global
  const au  = drugDetail?.au
  const nz  = drugDetail?.nz
  const p   = gap.pharma_intel || {}

  if (key === 'revenue') {
    const rev = g?.matched ? g.revenue_usd_b : p.revenue_usd_b
    if (rev == null) return 'No revenue data available'
    const tier = rev >= 10 ? 'top tier (≥$10B)' : rev >= 5 ? 'high tier (≥$5B)' : rev >= 1 ? 'mid tier (≥$1B)' : 'emerging (<$1B)'
    return `$${Number(rev).toFixed(1)}B global sales · ${tier}`
  }
  if (key === 'auAccess') {
    return au?.accessLevel ?? gap.au_restriction ?? 'Unknown access level'
  }
  if (key === 'ofi') {
    if (nz?.ofi) return `${nz.ofi.quarter} · ${nz.ofi.status}`
    return pts > 0 ? 'In OFI queue' : 'Not currently in the OFI queue'
  }
  if (key === 'patent') {
    const expiry = (g?.matched ? g.patent_expiry : null) ?? p.patent_expiry
    if (!expiry) return 'No patent expiry data'
    const yr  = parseInt(String(expiry).match(/(20\d{2})/)?.[1] ?? '0', 10)
    const yrs = Math.max(0, yr - new Date().getFullYear())
    return `Expires ${expiry} · ${yrs} yr${yrs !== 1 ? 's' : ''} of runway`
  }
  if (key === 'gapDensity') {
    const sector = prettySector(drugDetail?.sector) || prettySector(p.sector_id) || gap.tg1 || 'this area'
    const frac   = max > 0 ? pts / max : 0
    const count  = frac >= 0.9 ? '≥20' : pts > 0 ? '≥10' : '<10'
    return `${count} gaps in ${sector}`
  }
  return ''
}

function BreakdownSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="an-skel" style={{ height: 54, borderRadius: 8 }} />
      ))}
    </div>
  )
}

export default function BdDetailPanel({ gap, open, onClose, onSearch, onMethodology }) {
  const [drugDetail, setDrugDetail]       = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = e => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    const prev = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    return () => { document.documentElement.style.overflow = prev }
  }, [open])

  useEffect(() => {
    if (!open || !gap) { setDrugDetail(null); return }
    let alive = true
    setDrugDetail(null)
    setDetailLoading(true)
    fetch(`${API}/api/cross-ref/drug/${encodeURIComponent(gap.name)}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (alive) { setDrugDetail(d); setDetailLoading(false) } })
      .catch(() => { if (alive) setDetailLoading(false) })
    return () => { alive = false }
  }, [open, gap?.name])

  if (!gap) return null

  const p         = gap.pharma_intel || {}
  const chemical  = gap.name
  const bdScore   = Math.round(gap.bd_score)
  const { c, k }  = tierOf(bdScore)
  const segs      = segCount(bdScore)
  const brand     = p.brand_name || gap.brand || '—'
  const company   = p.company || '—'
  const sectorName = prettySector(p.sector_id) || gap.tg1 || 'Uncategorised'

  const moa        = p.moa_simple
  const indications = Array.isArray(p.indication_normalized) && p.indication_normalized.length
    ? p.indication_normalized : null
  const revenue    = p.revenue_usd_b
  const patent     = p.patent_expiry
  const hasGlobal  = moa || indications || revenue != null || patent

  const au = drugDetail?.au
  const nz = drugDetail?.nz
  const bd = drugDetail?.bdScore

  const flags = riskFlagsOf(gap)

  return (
    <>
      <div className={`bdp-overlay${open ? ' open' : ''}`} onClick={onClose} />

      <aside
        className={`bdp-panel${open ? ' open' : ''}`}
        style={{ '--bdp-c': c }}
        role="dialog"
        aria-modal="true"
        aria-label={`${chemical} – BD opportunity detail`}
      >
        {/* ── Header ── */}
        <div className="bdp-head">
          <button className="bdp-close" onClick={onClose} aria-label="Close panel">{I.close}</button>
          <span className="bdp-sector">{sectorName}</span>
          <h2 className="bdp-chem">{chemical}</h2>
          <p className="bdp-brand"><b>{brand}</b>{company !== '—' ? ` · ${company}` : ''}</p>

          <div className="bdp-score">
            <div className="bdp-score-num">{bdScore}<span>/100</span></div>
            <div className="bdp-score-meta">
              <span className="bdp-score-lab">BD score</span>
              <span className="bdp-score-tier">{k}</span>
            </div>
            <span className="bdp-heat" aria-hidden="true">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className={i < segs ? 'on' : ''} />
              ))}
            </span>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="bdp-body">

          {/* §1 — Reimbursement */}
          <section className="bdp-section">
            <h3 className="bdp-sec-title">Reimbursement</h3>
            <div className="bdp-cols">
              <div className="bdp-col">
                <div className="bdp-col-flag">
                  <span className="fc" style={{ background: 'var(--text-mute)' }} />
                  New Zealand
                </div>
                <div className="bdp-kv">
                  <span className="bdp-kv-lab">PHARMAC Schedule</span>
                  <span className="bdp-status"><span className="sd" />Not in Schedule</span>
                </div>
                {gap.ofiPending && (
                  <div className="bdp-kv">
                    <span className="bdp-kv-lab">OFI queue</span>
                    <span className="bdp-ofi-chip">
                      <span className="sd" />
                      {nz?.ofi ? `${nz.ofi.status} · ${nz.ofi.quarter}` : 'In OFI queue'}
                    </span>
                  </div>
                )}
              </div>

              <div className="bdp-col">
                <div className="bdp-col-flag">
                  <span className="fc" style={{ background: 'var(--accent)' }} />
                  Australia · PBS
                </div>
                {gap.au_restriction && (
                  <div className="bdp-kv">
                    <span className="bdp-kv-lab">Access level</span>
                    <span className="bdp-pbs">{gap.au_restriction}</span>
                  </div>
                )}
                {au?.indication && (
                  <div className="bdp-kv">
                    <span className="bdp-kv-lab">AU indication</span>
                    <span className="bdp-kv-val">{au.indication}</span>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* §2 — Global intelligence */}
          <section className="bdp-section">
            <h3 className="bdp-sec-title">Global intelligence</h3>
            {!hasGlobal ? (
              <p className="bdp-empty">Global data not available for this medicine.</p>
            ) : (
              <div className="bdp-glob">
                {revenue != null && (
                  <div className="bdp-glob-row">
                    <span className="bdp-glob-lab">Global revenue</span>
                    <span className="bdp-glob-val mono">
                      ${Number(revenue).toFixed(1)}B
                      <span style={{ color: 'var(--text-mute)', fontWeight: 500, fontSize: 12.5 }}> · 2024</span>
                    </span>
                  </div>
                )}
                {patent && (
                  <div className="bdp-glob-row">
                    <span className="bdp-glob-lab">Patent expiry</span>
                    <span className="bdp-glob-val mono">{patent}</span>
                  </div>
                )}
                {moa && (
                  <div className="bdp-glob-row">
                    <span className="bdp-glob-lab">Mechanism</span>
                    <span className="bdp-glob-val moa">{moa}</span>
                  </div>
                )}
                {indications && (
                  <div className="bdp-glob-row">
                    <span className="bdp-glob-lab">Indications</span>
                    <div className="bdp-glob-val">
                      <span className="bdp-tags">
                        {indications.map(t => <span key={t} className="bdp-tag">{t}</span>)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* §3 — Risk flags (separate axis from BD score) */}
          <section className="bdp-section bdp-risk">
            <h3 className="bdp-sec-title">
              Risk flags <span className="bdp-sec-tag">beside the score, not in it</span>
            </h3>
            <div className="bdp-flags">
              {flags.length === 0 ? (
                <p className="bdp-empty">No risk flags identified for this medicine.</p>
              ) : flags.map(f => (
                <div key={f.key} className={`bdp-flag ${f.tone}`}>
                  <div className="bdp-flag-head">
                    <span className="bdp-flag-name">{f.name}</span>
                    <span className="bdp-flag-badge">
                      {f.tone === 'high' && <span className="bdp-flag-ic" aria-hidden="true">{I.alert}</span>}
                      {f.label}{f.tone === 'high' ? ' · margin pressure' : ''}
                    </span>
                  </div>
                  <p className="bdp-flag-desc">{f.desc}</p>
                </div>
              ))}
            </div>
            <p className="bdp-risk-caveat">
              {I.alert}
              <span>Estimated from the density of NZ-funded competitors within this medicine's ATC class. The actual size of any funded price cut can't be predicted.</span>
            </p>
            <p className="bdp-risk-more">Reference pricing is the only barrier tracked today — others will appear here as their data lands, never estimated or shown before then.</p>
          </section>

          {/* §4 — BD score breakdown */}
          <section className="bdp-section">
            <h3 className="bdp-sec-title">BD score breakdown</h3>
            {detailLoading ? <BreakdownSkeleton />
              : bd ? (
                <>
                  <div className="bdp-sb">
                    {BREAKDOWN_KEYS.map(key => {
                      const pts = Math.round(bd.breakdown[key] ?? 0)
                      const max = FACTOR_MAX[key]
                      const why = whyText(key, bd.breakdown, drugDetail, gap)
                      return (
                        <div key={key} className="bdp-sb-row">
                          <span className="bdp-sb-lab">{FACTOR_LABEL[key]}</span>
                          <span className="bdp-sb-num">{pts}<span>/{max}</span></span>
                          <div className="bdp-meter">
                            <div className="bdp-meter-fill" style={{ width: `${max > 0 ? (pts / max) * 100 : 0}%` }} />
                          </div>
                          <span className="bdp-sb-why">{why}</span>
                        </div>
                      )
                    })}
                  </div>
                  <div className="bdp-sb-total">
                    <span className="t-lab">Total BD score</span>
                    <span className="t-val">{bdScore}<span>/100</span></span>
                  </div>
                </>
              ) : (
                <p className="bdp-empty">Score breakdown unavailable.</p>
              )}
            <p className="bdp-sb-foot">Opportunity size only. Risk flags above are kept out of this figure on purpose.</p>
            <button className="bdp-method" onClick={onMethodology}>
              How the score works {I.arrow}
            </button>
          </section>

        </div>

        {/* ── Footer ── */}
        <div className="bdp-foot">
          <button className="bdp-search" onClick={onSearch}>
            {I.search} Search this medicine in AU vs NZ {I.arrow}
          </button>
          <p className="bdp-foot-note">Opens PHARMAC Tracker — AU vs NZ comparison tab.</p>
        </div>
      </aside>
    </>
  )
}
