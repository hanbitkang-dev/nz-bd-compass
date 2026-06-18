// BdOpportunities.jsx — NZ BD Compass · /in-licensing
// AU PBS-funded medicines not yet on the PHARMAC Schedule, enriched with
// pharma-intel + BD-scored. Calls pharmac-tracker API as external backend.
import { useState, useEffect, useMemo, useCallback } from 'react'
import '../bd-opportunities.css'
import BdDetailPanel from './BdDetailPanel'

const API = import.meta.env.VITE_API_BASE || 'http://localhost:3002'

const PAGE = 9

const I = {
  arrow:  (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>),
  filter: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5h18M6 12h12M10 19h4" /></svg>),
  caret:  (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>),
  plus:   (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>),
  alert:  (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h.01" /></svg>),
}

function tierColor(score) {
  if (score >= 80) return 'var(--accent)'
  if (score >= 65) return 'var(--amber)'
  return 'var(--gray)'
}
const segCount = score => Math.max(1, Math.min(5, Math.round(score / 20)))

const RISK_META = {
  high:   { tone: 'high', label: 'High',   tag: 'margin pressure' },
  medium: { tone: 'med',  label: 'Medium', tag: 'some funded competition' },
  low:    { tone: 'low',  label: 'Low',    tag: 'little funded competition' },
}
function riskFlagsOf(g) {
  const out = []
  const r = g.reference_pricing_risk
  if (r && RISK_META[r]) out.push({ key: 'refPricing', name: 'Reference pricing', level: r, ...RISK_META[r] })
  return out
}

const AU_CLS = {
  'Unrestricted': 'green',
  'Restricted': 'amber',
  'Authority (Streamlined)': 'blue',
  'Authority required': 'red',
}
const prettySector = s => (s || '').replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
const revFmt = v => (v == null ? null : `$${Number(v).toFixed(2).replace(/\.?0+$/, '')}B`)

function useEndpoint(url) {
  const [s, setS] = useState({ loading: true, error: false, data: null })
  const [nonce, setNonce] = useState(0)
  useEffect(() => {
    let alive = true
    setS({ loading: true, error: false, data: null })
    fetch(url)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json() })
      .then(d => { if (alive) setS({ loading: false, error: false, data: d }) })
      .catch(() => { if (alive) setS({ loading: false, error: true, data: null }) })
    return () => { alive = false }
  }, [url, nonce])
  return [s, () => setNonce(n => n + 1)]
}

function OppCard({ g, onOpen }) {
  const p = g.pharma_intel || {}
  const score = g.bd_score
  const c = tierColor(score)
  const segs = segCount(score)
  const rev = revFmt(p.revenue_usd_b)
  const indication = Array.isArray(p.indication_normalized) ? p.indication_normalized.join(', ') : ''
  const flags = riskFlagsOf(g)
  return (
    <button className="bdo-card" style={{ '--bdo-c': c }}
      onClick={() => onOpen?.(g)}>
      <div className="bdo-card-head">
        <div className="bdo-top">
          <span className="bdo-sector">{prettySector(p.sector_id) || g.tg1 || 'Uncategorised'}</span>
          <span className="bdo-score">
            <span className="bdo-score-lab">BD</span>
            <span className="bdo-score-val">{score}</span>
            <span className="bdo-bar" aria-hidden="true">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className={'bdo-seg' + (i < segs ? ' on' : '')} />
              ))}
            </span>
          </span>
        </div>
        <h3 className="bdo-chem">{g.name}</h3>
        <p className="bdo-brand"><b>{p.brand_name || g.brand || '—'}</b>{p.company ? ` · ${p.company}` : ''}</p>
      </div>

      <div className="bdo-rows">
        <span className="bdo-row-lab">AU access</span>
        <span className="bdo-row-val">
          {g.au_restriction ? <span className={`badge ${AU_CLS[g.au_restriction] || 'gray'}`}>{g.au_restriction}</span> : '—'}
          {indication && <span className="bdo-row-sub">{indication}</span>}
        </span>

        <span className="bdo-row-lab">Revenue</span>
        <span className="bdo-row-val mono">
          {rev || '—'}
          {rev && <span className="bdo-row-sub">Reported global sales</span>}
        </span>

        <span className="bdo-row-lab">Patent</span>
        <span className="bdo-row-val"><span className="bdo-pill">{p.patent_expiry || '—'}</span></span>

        {p.moa_simple && <>
          <span className="bdo-row-lab">MoA</span>
          <span className="bdo-row-val" style={{ fontWeight: 400 }}>
            <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontSize: 12.5, color: 'var(--text-dim)', lineHeight: 1.45 }}>
              {p.moa_simple}
            </span>
          </span>
        </>}
      </div>

      <div className="bdo-risk">
        <div className="bdo-risk-lab">
          <span>Risk flags</span>
          <span className="bdo-risk-cap">not in BD score</span>
        </div>
        <div className="bdo-flags">
          {flags.map(f => (
            <span key={f.key} className={`bdo-flag ${f.tone}`}>
              {f.tone === 'high' && <span className="bdo-flag-ic" aria-hidden="true">{I.alert}</span>}
              <span className="bdo-flag-name">{f.name}</span>
              <span className="bdo-flag-lvl">{f.tone === 'high' ? f.tag : f.label}</span>
            </span>
          ))}
        </div>
      </div>

      {g.ofiPending && (
        <div className="bdo-ofi"><span className="dot" />In OFI queue · NZ funding application</div>
      )}
    </button>
  )
}

function ErrorState({ onRetry }) {
  return (
    <div className="an-error">
      <div className="er-icon">{I.alert}</div>
      <div className="er-title">Data unavailable</div>
      <div className="er-sub">We couldn't reach the cross-reference source right now. It may be refreshing — try again in a moment.</div>
      {onRetry && <button className="er-retry" onClick={onRetry}>Retry</button>}
    </div>
  )
}
function Skeleton() {
  return (
    <div className="bdo-grid">
      {Array.from({ length: 6 }).map((_, i) => <div key={i} className="an-skel bdo-skel-card" />)}
    </div>
  )
}

export default function BdOpportunities({ onNavigate }) {
  const [ofiOnly, setOfiOnly] = useState(false)
  const [riskOnly, setRiskOnly] = useState(false)
  const [sortKey, setSortKey] = useState('bd_score')
  const [visible, setVisible] = useState(PAGE)

  const [sel, setSel] = useState(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const openPanel = useCallback(g => {
    setSel(g)
    setTimeout(() => setPanelOpen(true), 20)
  }, [])
  const closePanel = useCallback(() => {
    setPanelOpen(false)
    setTimeout(() => setSel(null), 320)
  }, [])

  const url = `${API}/api/cross-ref/gap-enriched?matched=true&sort=${sortKey}${ofiOnly ? '&ofi=true' : ''}`
  const [{ loading, error, data }, retry] = useEndpoint(url)

  useEffect(() => { setVisible(PAGE) }, [ofiOnly, riskOnly, sortKey])

  const allItems = data?.gaps || []
  const items = useMemo(() => {
    if (!riskOnly) return allItems
    return allItems.filter(g => g.reference_pricing_risk === 'high')
  }, [allItems, riskOnly])
  const shown = items.slice(0, visible)
  const remaining = items.length - shown.length
  const ofiCount = data ? (ofiOnly ? items.length : allItems.filter(g => g.ofiPending).length) : 0
  const riskCount = allItems.filter(g => g.reference_pricing_risk === 'high').length

  return (
    <section className="an-section">
      <div className="bdo-head">
        <div className="bdo-head-text">
          <div className="an-eyebrow">BD opportunities</div>
          <h2 className="bdo-title">The highest-value gaps, ranked for you.</h2>
          <p className="bdo-sub">
            Medicines funded on the Australian PBS but not yet on the PHARMAC Schedule — scored on
            global revenue, AU access level, patent timeline, and OFI momentum. The shortlist worth a
            funding conversation first.
          </p>
        </div>
        <div className="bdo-controls">
          <button className={'bdo-filter' + (ofiOnly ? ' active' : '')}
            onClick={() => setOfiOnly(v => !v)} aria-pressed={ofiOnly}>
            {ofiOnly ? <span className="dot" /> : I.filter}
            In OFI queue
            {!loading && <span style={{ opacity: .6 }}>· {ofiCount}</span>}
          </button>
          <button className={'bdo-filter risk' + (riskOnly ? ' active' : '')}
            onClick={() => setRiskOnly(v => !v)} aria-pressed={riskOnly}>
            <span className="bdo-filter-ic" aria-hidden="true">{I.alert}</span>
            Margin pressure
            {!loading && <span style={{ opacity: .6 }}>· {riskCount}</span>}
          </button>
          <div className="bdo-select-wrap">
            <select className="bdo-select" value={sortKey} onChange={e => setSortKey(e.target.value)} aria-label="Sort by">
              <option value="bd_score">Sort · BD score</option>
              <option value="revenue">Sort · Global revenue</option>
              <option value="chemical">Sort · Chemical (A–Z)</option>
            </select>
            <span className="bdo-caret">{I.caret}</span>
          </div>
        </div>
      </div>

      {loading ? <Skeleton />
        : error ? <div className="an-card"><div className="an-card-body"><ErrorState onRetry={retry} /></div></div>
        : (
          <>
            <p className="bdo-count">
              Showing <b>{shown.length}</b> of <b>{items.length}</b> scored opportunities ·
              drawn from {data.total} medicines AU-funded but not on the PHARMAC Schedule
              {riskOnly && <span> · filtered to high margin-pressure</span>}
            </p>
            <div className="bdo-grid">
              {shown.map(g => <OppCard key={g.name} g={g} onOpen={openPanel} />)}
            </div>

            {remaining > 0 && (
              <div className="bdo-more">
                <button onClick={() => setVisible(v => v + PAGE)}>
                  {I.plus} Load more <span className="ct">{remaining} more</span>
                </button>
              </div>
            )}

            <div className="bdo-foot">
              <a className="bdo-method" onClick={() => onNavigate && onNavigate({ tab: 'methodology' })}>
                How the BD score is calculated {I.arrow}
              </a>
              <p className="bdo-source">
                Cross-reference of Australian PBS listings against the PHARMAC Schedule, enriched with
                pharma-intel. Funding status and scores are illustrative — a prioritisation signal, not a
                regulatory determination.
              </p>
            </div>

            <div className="bdo-caveat">
              <span className="bdo-caveat-ic" aria-hidden="true">{I.alert}</span>
              <p>
                <b>Risk flags sit beside the BD score, not inside it.</b> Reference-pricing risk is
                estimated from the density of NZ-funded competitors within a medicine's ATC class — the
                actual size of any funded price cut can't be predicted. It's the only barrier tracked
                today; others will appear in this same band as their data lands. A score of 75 with a
                flag and a 60 with none are yours to weigh.
              </p>
            </div>
          </>
        )}

      <BdDetailPanel
        gap={sel}
        open={panelOpen}
        onClose={closePanel}
        onSearch={() => { closePanel(); onNavigate?.({ tab: 'compare', q: sel?.name }) }}
        onMethodology={() => { closePanel(); onNavigate?.({ tab: 'methodology' }) }}
      />
    </section>
  )
}
