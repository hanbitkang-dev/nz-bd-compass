// BdExplore.jsx - Engine 1 - Explore mode (the analyst's workbench).
// CD design integration, ported to the real Vite/ESM app and wired to the LIVE
// API (no mock). Same gap data the Story tab (BdOpportunities) curates, here as
// the full table: every gap, multi-filtered, sorted on any column, with a
// column picker, CSV export, and row -> BdDetailPanel.
//
// Data: one full fetch of /api/cross-ref/gap-enriched (all 523) joined by
// chemical to /api/cross-ref/reference-pricing (atc_l3/l4 + class_funded_count).
// adaptGaps() enriches each REAL gap with the camelCase aliases the table reads
// while KEEPING the real fields (name, bd_score, pharma_intel...) so the same
// object opens BdDetailPanel unchanged. Hardened for the full set: null
// revenue/patent (Track C), reference_pricing_risk 'unknown', track outside A/B/C.
import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { getGapEnriched, getReferencePricing } from '../api.js'

/* -- icons -- */
const I = {
  filter:  (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5h18l-7 8v6l-4 2v-8L3 5z"/></svg>),
  columns: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16M15 4v16"/></svg>),
  csv:     (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12m0 0 4-4m-4 4-4-4"/><path d="M5 21h14"/></svg>),
  caret:   (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>),
  check:   (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12.5 9 17.5 20 6.5"/></svg>),
  x:       (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6 6 18"/></svg>),
  search:  (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.4-3.4"/></svg>),
  sortAsc: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m6 15 6-6 6 6"/></svg>),
  sortDesc:(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>),
  reset:   (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>),
  info:    (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.5"/></svg>),
  empty:   (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.4-3.4"/><path d="M8 11h6"/></svg>),
}

/* -- score -> tier colour (mirrors Story) -- */
function tierColor(s) { return s >= 80 ? 'var(--accent)' : s >= 65 ? 'var(--amber)' : 'var(--gray-badge)' }
function segCount(s) { return Math.max(1, Math.min(5, Math.round(s / 20))) }

const RISK_LABEL = { high: 'High', medium: 'Medium', low: 'Low', unknown: 'Unknown' }
const RISK_BASIS = {
  high: 'Several NZ-funded competitors sit in this ATC L4 class - expect downward reference-pricing pressure on any funded price.',
  medium: 'Some NZ-funded competitors in the ATC L4 class - moderate reference-pricing exposure.',
  low: 'Few or no NZ-funded competitors in the ATC L4 class - limited reference-pricing exposure.',
  unknown: 'No ATC class resolved for this medicine - reference-pricing exposure not estimated.',
}
// NZ funded list-price range of the ATC class (v4 B). per pack · across N funded presentations.
const fmtMoney = (v) => '$' + Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 })
const fmtPriceRange = (r) => (r.min === r.max ? `${fmtMoney(r.min)}` : `${fmtMoney(r.min)}–${fmtMoney(r.max)}`) + ` /pack · ${r.n}`

/* -- real -> table shape adapter (keeps real fields for BdDetailPanel) -- */
const yearOf = (pe) => { const m = String(pe ?? '').match(/20\d{2}/); return m ? +m[0] : null }
function adaptGaps(gaps, rpItems) {
  const rp = new Map()
  for (const it of (rpItems || [])) rp.set(String(it.chemical).toLowerCase(), it)
  return (gaps || []).map((g) => {
    const r = rp.get(String(g.name).toLowerCase())
    const pe = g.pharma_intel?.patent_expiry || ''
    return {
      ...g, // real fields preserved (name, bd_score, pharma_intel, reference_pricing_risk, ...)
      generic: g.name,
      brand: g.pharma_intel?.brand_name || g.brand || '-',
      company: g.pharma_intel?.company || '',
      sectorName: g.tg1 || 'Uncategorised',
      bdScore: g.bd_score ?? 0,
      revenueUsdB: g.pharma_intel?.revenue_usd_b ?? null,
      patentExpiry: pe,
      patentYear: yearOf(pe),
      referencePricingRisk: g.reference_pricing_risk || 'unknown',
      modality: g.pharma_intel?.modality || '-',
      track: g.track || '-',
      atc_l3: r?.atc_l3 || '',
      atc_l4: r?.atc_l4 || '',
      class_funded_count: r?.class_funded_count ?? null,
      class_price_range: r?.price_range || null,
      au_restriction: g.au_restriction || '-',
      ofiPending: !!g.ofiPending,
      ofiNote: null,
    }
  })
}

/* -- outside-click hook -- */
function useOutside(onClose) {
  const ref = useRef(null)
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [onClose])
  return ref
}

/* -- dual-range slider -- */
function RangeFilter({ label, min, max, step, value, onChange, fmt }) {
  const [lo, hi] = value
  const span = max - min || 1
  const pct = (v) => ((v - min) / span) * 100
  return (
    <div className="exp-fgroup">
      <span className="exp-fgroup-lab">{label}</span>
      <div className="exp-range">
        <div className="exp-range-top">
          <span className="exp-range-val">{fmt(lo)}<span className="to">-</span>{fmt(hi)}</span>
        </div>
        <div className="exp-range-track">
          <div className="exp-range-fill" style={{ left: pct(lo) + '%', width: (pct(hi) - pct(lo)) + '%' }} />
          <input type="range" min={min} max={max} step={step} value={lo}
            onChange={(e) => onChange([Math.min(+e.target.value, hi), hi])} />
          <input type="range" min={min} max={max} step={step} value={hi}
            onChange={(e) => onChange([lo, Math.max(+e.target.value, lo)])} />
        </div>
      </div>
    </div>
  )
}

/* -- segmented multi-toggle -- */
function SegMulti({ label, options, selected, onToggle }) {
  return (
    <div className="exp-fgroup">
      <span className="exp-fgroup-lab">{label}</span>
      <div className="exp-seg">
        {options.map((o) => {
          const on = selected.has(o.value)
          return (
            <button key={o.value} className={on ? 'on' : ''} onClick={() => onToggle(o.value)}>
              {o.sw && <span className="sw" style={{ background: o.sw }} />}
              {o.label}{o.n != null && <span className="ct">{o.n}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* -- risk cell with hover popover (honesty device).
   Portalled to <body> + position:fixed so it escapes BOTH the table wrap's
   overflow clip AND any transformed ancestor (.view-enter), then flipped
   above/below by whichever side has room. -- */
function RiskCell({ d }) {
  const lvl = d.referencePricingRisk
  const ref = useRef(null)
  const [pos, setPos] = useState(null)
  const show = useCallback(() => {
    const el = ref.current; if (!el) return
    const r = el.getBoundingClientRect()
    const POP_H = 224, GAP = 9
    const spaceAbove = r.top, spaceBelow = window.innerHeight - r.bottom
    const place = (spaceAbove >= POP_H + GAP || spaceAbove >= spaceBelow) ? 'above' : 'below'
    const top = place === 'above' ? r.top - GAP : r.bottom + GAP
    const left = Math.max(133, Math.min(window.innerWidth - 133, r.left + r.width / 2))
    setPos({ left, top, place })
  }, [])
  const hide = useCallback(() => setPos(null), [])
  if (!lvl) return <span className="exp-dash">—</span>
  const pop = pos && createPortal(
    <span className={'exp-risk-pop ' + pos.place} style={{ left: pos.left + 'px', top: pos.top + 'px' }}
      onMouseEnter={show} onMouseLeave={hide}>
      <span className="exp-risk-pop-grade"><span className="rd" style={{ width: 8, height: 8, borderRadius: '50%', background: lvl === 'low' ? 'var(--green)' : lvl === 'unknown' ? 'var(--text-mute)' : 'var(--amber)' }} />Reference pricing - {RISK_LABEL[lvl]}</span>
      <span className="exp-rp-row"><span className="k">ATC L3</span><span className="v">{d.atc_l3 || '-'}</span></span>
      <span className="exp-rp-row"><span className="k">ATC L4</span><span className="v">{d.atc_l4 || '-'}</span></span>
      <span className="exp-rp-row"><span className="k">Funded in class</span><span className="v mono">{d.class_funded_count == null ? '-' : d.class_funded_count + ' NZ'}</span></span>
      {d.class_price_range && <span className="exp-rp-row"><span className="k">NZ funded price</span><span className="v mono">{fmtPriceRange(d.class_price_range)}</span></span>}
      <span className="exp-rp-basis">{RISK_BASIS[lvl]} Estimate only - the size of any funded price cut can't be predicted.{d.class_price_range && ' Price is the list/scheduled price per pack, not net of confidential rebates.'}</span>
    </span>,
    document.body
  )
  return (
    <span className={'exp-risk ' + lvl} ref={ref} tabIndex={0}
      onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide} onClick={(e) => e.stopPropagation()}>
      <span className="exp-risk-pill">
        <span className="rd" />{RISK_LABEL[lvl]}
        <span className="why">why</span>
      </span>
      {pop}
    </span>
  )
}

/* -- AU utilization cell (raw, not NZ-scaled). Hover popover mirrors RiskCell:
   shows ATC5 grain (substance vs class), scripts, benefit cost + basis. The
   "why" pattern carries the honesty that a class-level number is a shared sum. -- */
const auFmt = (c) => c == null ? '—' : c >= 1e6 ? '$' + (c / 1e6).toFixed(1) + 'M' : c >= 1e3 ? '$' + Math.round(c / 1e3) + 'k' : '$' + c
function AuUtilCell({ d }) {
  const u = d.au_utilization
  const ref = useRef(null)
  const [pos, setPos] = useState(null)
  const show = useCallback(() => {
    const el = ref.current; if (!el) return
    const r = el.getBoundingClientRect()
    const POP_H = 200, GAP = 9
    const place = (r.top >= POP_H + GAP || r.top >= window.innerHeight - r.bottom) ? 'above' : 'below'
    setPos({ left: Math.max(133, Math.min(window.innerWidth - 133, r.left + r.width / 2)), top: place === 'above' ? r.top - GAP : r.bottom + GAP, place })
  }, [])
  const hide = useCallback(() => setPos(null), [])
  // Track C with no DoS match → "AU data unavailable" (we looked). Any other
  // track → "—" (AU utilization is a Track C signal; not applicable here).
  if (!u) return d.track === 'C'
    ? <span className="exp-au na">AU data unavailable</span>
    : <span className="exp-dash">—</span>
  const isClass = u.grain === 'class'
  const pop = pos && createPortal(
    <span className={'exp-risk-pop ' + pos.place} style={{ left: pos.left + 'px', top: pos.top + 'px' }} onMouseEnter={show} onMouseLeave={hide}>
      <span className="exp-risk-pop-grade"><span className="rd" style={{ width: 8, height: 8, borderRadius: '50%', background: isClass ? 'var(--amber)' : 'var(--accent)' }} />AU utilization · {isClass ? 'class-level' : 'substance-level'}</span>
      <span className="exp-rp-row"><span className="k">ATC5</span><span className="v">{u.atc5}</span></span>
      <span className="exp-rp-row"><span className="k">Scripts</span><span className="v mono">{u.scripts.toLocaleString()}</span></span>
      <span className="exp-rp-row"><span className="k">Benefit cost</span><span className="v mono">{auFmt(u.cost)}</span></span>
      <span className="exp-rp-basis">{u.basis} Raw AU PBS dispensing, not scaled to NZ.</span>
    </span>,
    document.body
  )
  return (
    <span className={'exp-au' + (isClass ? ' cls' : '')} ref={ref} tabIndex={0}
      onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide} onClick={(e) => e.stopPropagation()}>
      <span className="exp-au-val">{auFmt(u.cost)}</span>
      {isClass && <span className="exp-au-grain" title="Class-level sum — shared across the ATC class">∑ class</span>}
      {pop}
    </span>
  )
}

/* -- NZ Medsafe registration cell (Engine 1; read-through of the STEP 3 snapshot).
   5 buckets, colour-coded, with a hover popover carrying the site-defined legal
   meaning + sponsors (display only). Mirrors the RiskCell portal pattern. -- */
const NZREG = {
  registered:          { label: 'Registered',            cls: 'reg',       def: 'Consent given — active s20 consent to market in NZ.' },
  registered_inactive: { label: 'Registered (inactive)', cls: 'inact',     def: 'Approval lapsed / Not available — previously registered, currently inactive.' },
  not_registered:      { label: 'Not registered',        cls: 'none',      def: 'No NZ registration found (INN + brand both checked).' },
  review_pending:      { label: 'Review pending',        cls: 'review',    def: 'Status unclear — not auto-classified.' },
  not_yet_checked:     { label: 'Not yet checked',       cls: 'unchecked', def: 'A medicine gap added after the last snapshot — awaiting the next precompute (transient).' },
  not_eligible:        { label: 'N/A',                   cls: 'na',        def: 'Not a Medsafe-eligible medicine (e.g. dressing, extemporaneous, device) — permanently out of scope.' },
}
const NZREG_ORDER = { registered: 6, registered_inactive: 5, review_pending: 4, not_registered: 3, not_yet_checked: 2, not_eligible: 1 }
function NzRegCell({ d }) {
  const r = d.nz_registration || { status_rollup: 'not_yet_checked' }
  const meta = NZREG[r.status_rollup] || NZREG.not_yet_checked
  const ref = useRef(null)
  const [pos, setPos] = useState(null)
  const show = useCallback(() => {
    const el = ref.current; if (!el) return
    const rect = el.getBoundingClientRect()
    const POP_H = 190, GAP = 9
    const place = (rect.top >= POP_H + GAP || rect.top >= window.innerHeight - rect.bottom) ? 'above' : 'below'
    setPos({ left: Math.max(133, Math.min(window.innerWidth - 133, rect.left + rect.width / 2)), top: place === 'above' ? rect.top - GAP : rect.bottom + GAP, place })
  }, [])
  const hide = useCallback(() => setPos(null), [])
  const pop = pos && createPortal(
    <span className={'exp-risk-pop ' + pos.place} style={{ left: pos.left + 'px', top: pos.top + 'px' }} onMouseEnter={show} onMouseLeave={hide}>
      <span className="exp-risk-pop-grade"><span className={'exp-nzreg-dot ' + meta.cls} />NZ registration · {meta.label}</span>
      {r.statuses?.length > 0 && <span className="exp-rp-row"><span className="k">Medsafe status</span><span className="v">{r.statuses.join(', ')}</span></span>}
      {r.sponsors?.length > 0 && <span className="exp-rp-row"><span className="k">Sponsor</span><span className="v">{r.sponsors.join(', ')}</span></span>}
      {r.products_n != null && <span className="exp-rp-row"><span className="k">Products</span><span className="v mono">{r.products_n}</span></span>}
      <span className="exp-rp-basis">{meta.def}</span>
    </span>,
    document.body
  )
  return (
    <span className={'exp-nzreg ' + meta.cls} ref={ref} tabIndex={0}
      onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide} onClick={(e) => e.stopPropagation()}>
      <span className="exp-nzreg-dot" />{meta.label}
      {pop}
    </span>
  )
}

/* -- column definitions -- */
const COLS = [
  { key: 'chemical', label: 'Chemical', sticky: true, def: true,
    val: (d) => d.generic,
    cell: (d) => (<><span className="exp-chem-name">{d.generic}</span><span className="exp-chem-sub">{d.brand}</span></>),
    csv: (d) => d.generic },
  { key: 'track', label: 'Track', def: true, center: true,
    val: (d) => d.track,
    cell: (d) => <span className={'exp-track ' + (['A','B','C'].includes(d.track) ? d.track : '')}>{d.track}</span>,
    csv: (d) => d.track },
  { key: 'tg1', label: 'TG1', def: true,
    val: (d) => d.sectorName,
    cell: (d) => <span className="exp-tag">{d.sectorName}</span>,
    csv: (d) => d.sectorName },
  { key: 'bd_score', label: 'BD score', num: true, def: true,
    val: (d) => d.bdScore,
    cell: (d) => {
      const c = tierColor(d.bdScore), segs = segCount(d.bdScore)
      return (<span className="exp-score" style={{ '--score-c': c }}>
        <span className="exp-score-bar">{Array.from({ length: 5 }).map((_, i) => <span key={i} className={'exp-score-seg' + (i < segs ? ' on' : '')} />)}</span>
        <span className="exp-score-v">{d.bdScore}</span>
      </span>)
    },
    csv: (d) => d.bdScore },
  { key: 'revenue', label: 'Revenue', num: true, def: true,
    val: (d) => (d.revenueUsdB == null ? null : d.revenueUsdB),   // null -> pinned bottom by the sort comparator
    cell: (d) => <span className="exp-num">{d.revenueUsdB == null ? <span className="exp-dash">—</span> : '$' + d.revenueUsdB.toFixed(1) + 'B'}</span>,
    csv: (d) => (d.revenueUsdB == null ? '' : d.revenueUsdB) },
  { key: 'patent_expiry', label: 'Patent', num: true, def: true,
    val: (d) => (d.patentYear == null ? null : d.patentYear),
    cell: (d) => <span className="exp-num">{d.patentExpiry ? d.patentExpiry : <span className="exp-dash">—</span>}</span>,
    csv: (d) => d.patentExpiry },
  { key: 'au_restriction', label: 'AU restriction', def: true,
    val: (d) => d.au_restriction,
    cell: (d) => <span className="exp-tag exp-muted">{d.au_restriction}</span>,
    csv: (d) => d.au_restriction },
  { key: 'reference_pricing_risk', label: 'Ref-pricing risk', def: true,
    val: (d) => ({ high: 3, medium: 2, low: 1, unknown: 0 }[d.referencePricingRisk] || 0),
    cell: (d) => <RiskCell d={d} />,
    csv: (d) => RISK_LABEL[d.referencePricingRisk] || '' },
  { key: 'atc_l3', label: 'ATC L3', def: false,
    val: (d) => d.atc_l3,
    cell: (d) => <span className="exp-tag exp-muted">{d.atc_l3 || '-'}</span>,
    csv: (d) => d.atc_l3 },
  { key: 'atc_l4', label: 'ATC L4', def: false,
    val: (d) => d.atc_l4,
    cell: (d) => <span className="exp-tag exp-muted">{d.atc_l4 || '-'}</span>,
    csv: (d) => d.atc_l4 },
  { key: 'class_funded_count', label: 'Class funded (NZ)', num: true, def: false,
    val: (d) => (d.class_funded_count == null ? null : d.class_funded_count),
    cell: (d) => <span className="exp-num">{d.class_funded_count == null ? <span className="exp-dash">—</span> : d.class_funded_count}</span>,
    csv: (d) => (d.class_funded_count == null ? '' : d.class_funded_count) },
  { key: 'au_util', label: 'AU utilization', num: true, def: false,
    val: (d) => (d.au_utilization == null ? null : d.au_utilization.cost),
    cell: (d) => <AuUtilCell d={d} />,
    csv: (d) => (d.au_utilization == null ? 'AU data unavailable' : d.au_utilization.cost) },
  { key: 'nz_reg', label: 'NZ Registration', def: false,
    val: (d) => NZREG_ORDER[d.nz_registration?.status_rollup] ?? 0,
    cell: (d) => <NzRegCell d={d} />,
    csv: (d) => d.nz_registration?.status_rollup || 'not_yet_checked' },
  { key: 'ofiPending', label: 'OFI', def: true,
    val: (d) => (d.ofiPending ? 1 : 0),
    cell: (d) => d.ofiPending
      ? <span className="exp-dot-pill yes"><span className="d" />{d.ofiNote || 'In queue'}</span>
      : <span className="exp-dot-pill no">-</span>,
    csv: (d) => (d.ofiPending ? (d.ofiNote || 'in queue') : 'no') },
]
const COL_BY_KEY = Object.fromEntries(COLS.map((c) => [c.key, c]))

/* -- live data: gap-enriched joined to reference-pricing, adapted -- */
function useEngine1Data() {
  const [s, setS] = useState({ loading: true, error: false, items: [], updated: null, auMeta: null, nzMeta: null })
  const [nonce, setNonce] = useState(0)
  useEffect(() => {
    let alive = true
    setS((x) => ({ ...x, loading: true, error: false }))
    Promise.all([getGapEnriched(), getReferencePricing()])
      .then(([g, rp]) => { if (alive) setS({ loading: false, error: false, items: adaptGaps(g.gaps, rp.items), updated: g.cache_last_updated || null, auMeta: g.au_utilization_meta || null, nzMeta: g.nz_registration_meta || null }) })
      .catch(() => { if (alive) setS({ loading: false, error: true, items: [], updated: null, auMeta: null, nzMeta: null }) })
    return () => { alive = false }
  }, [nonce])
  return [s, () => setNonce((n) => n + 1)]
}

/* -- CSV export -- */
function exportCsv(rows, cols) {
  const esc = (v) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s }
  const head = cols.map((c) => esc(c.label)).join(',')
  const body = rows.map((d) => cols.map((c) => esc(c.csv(d))).join(',')).join('\n')
  const blob = new Blob(['﻿' + head + '\n' + body], { type: 'text/csv;charset=utf-8;' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'bd-opportunities-explore.csv'
  document.body.appendChild(a); a.click()
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove() }, 100)
}

/* -- default filter state (bounds from data) -- */
function freshFilters(b) {
  return {
    q: '',
    track: new Set(), tg1: new Set(), risk: new Set(), restriction: new Set(), modality: new Set(),
    ofiOnly: false,
    bd: [b.bdMin, b.bdMax], rev: [b.revMin, b.revMax], pat: [b.patMin, b.patMax],
  }
}

/* -- main -- */
export default function BdExplore({ onOpenDetail }) {
  const [{ loading, error, items, updated, auMeta, nzMeta }, retry] = useEngine1Data()

  // data-driven bounds for the range filters (ignore null/NaN)
  const bounds = useMemo(() => {
    if (!items.length) return { bdMin: 0, bdMax: 100, revMin: 0, revMax: 14, patMin: 2026, patMax: 2042 }
    const bd = items.map((d) => d.bdScore).filter((v) => Number.isFinite(v))
    const rev = items.map((d) => d.revenueUsdB).filter((v) => Number.isFinite(v))
    const pat = items.map((d) => d.patentYear).filter((v) => Number.isFinite(v))
    return {
      bdMin: bd.length ? Math.min(...bd) : 0, bdMax: bd.length ? Math.max(...bd) : 100,
      revMin: 0, revMax: rev.length ? Math.ceil(Math.max(...rev)) : 14,
      patMin: pat.length ? Math.min(...pat) : 2026, patMax: pat.length ? Math.max(...pat) : 2042,
    }
  }, [items])

  const [filters, setFilters] = useState(() => freshFilters({ bdMin: 0, bdMax: 100, revMin: 0, revMax: 14, patMin: 2026, patMax: 2042 }))
  useEffect(() => { if (!loading && !error) setFilters(freshFilters(bounds)) /* reset to live bounds once */ // eslint-disable-next-line
  }, [loading]) // run when the first load resolves

  const [sort, setSort] = useState({ key: 'bd_score', dir: 'desc' })
  const [visCols, setVisCols] = useState(() => new Set(COLS.filter((c) => c.def).map((c) => c.key)))
  const [openPop, setOpenPop] = useState(null) // 'filter' | 'cols' | null

  const set = (patch) => setFilters((f) => ({ ...f, ...patch }))
  const toggleIn = (key) => (v) => setFilters((f) => {
    const next = new Set(f[key]); next.has(v) ? next.delete(v) : next.add(v)
    return { ...f, [key]: next }
  })

  // option lists derived from data
  const tg1Opts = useMemo(() => {
    const c = {}; items.forEach((d) => c[d.sectorName] = (c[d.sectorName] || 0) + 1)
    return Object.keys(c).sort().map((v) => ({ value: v, label: v, n: c[v] }))
  }, [items])
  const restrictionOpts = useMemo(() => {
    const c = {}; items.forEach((d) => c[d.au_restriction] = (c[d.au_restriction] || 0) + 1)
    return Object.keys(c).sort().map((v) => ({ value: v, label: v, n: c[v] }))
  }, [items])
  const modalityOpts = useMemo(() => {
    const c = {}; items.forEach((d) => c[d.modality] = (c[d.modality] || 0) + 1)
    return Object.keys(c).sort().map((v) => ({ value: v, label: v, n: c[v] }))
  }, [items])

  // filtering (null revenue/patent pass range filters - "unknown", never hidden by a range)
  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase()
    let list = items.filter((d) => {
      if (q && !(d.generic + ' ' + d.brand + ' ' + d.sectorName).toLowerCase().includes(q)) return false
      if (filters.track.size && !filters.track.has(d.track)) return false
      if (filters.tg1.size && !filters.tg1.has(d.sectorName)) return false
      if (filters.risk.size && !filters.risk.has(d.referencePricingRisk)) return false
      if (filters.restriction.size && !filters.restriction.has(d.au_restriction)) return false
      if (filters.modality.size && !filters.modality.has(d.modality)) return false
      if (filters.ofiOnly && !d.ofiPending) return false
      if (d.bdScore < filters.bd[0] || d.bdScore > filters.bd[1]) return false
      if (d.revenueUsdB != null && (d.revenueUsdB < filters.rev[0] || d.revenueUsdB > filters.rev[1])) return false
      if (d.patentYear != null && (d.patentYear < filters.pat[0] || d.patentYear > filters.pat[1])) return false
      return true
    })
    const col = COL_BY_KEY[sort.key]
    const dir = sort.dir === 'asc' ? 1 : -1
    list = [...list].sort((a, b) => {
      const va = col.val(a), vb = col.val(b)
      // Missing values (e.g. Track C has no global revenue/patent) are pinned to
      // the BOTTOM regardless of sort direction - they are "no data", not "lowest".
      const na = va == null, nb = vb == null
      if (na || nb) return na && nb ? 0 : na ? 1 : -1
      if (va < vb) return -1 * dir; if (va > vb) return 1 * dir; return 0
    })
    return list
  }, [items, filters, sort])

  const cols = COLS.filter((c) => visCols.has(c.key))
  const clickSort = (key) => setSort((s) => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: (COL_BY_KEY[key].num || key === 'bd_score') ? 'desc' : 'asc' })

  // active filter chips
  const chips = []
  const mkSet = (key, label) => { if (filters[key].size) chips.push({ id: key, k: label, v: [...filters[key]].map((x) => RISK_LABEL[x] || x).join(', '), clear: () => set({ [key]: new Set() }) }) }
  mkSet('track', 'Track'); mkSet('tg1', 'TG1'); mkSet('risk', 'Risk'); mkSet('restriction', 'AU'); mkSet('modality', 'Modality')
  if (filters.ofiOnly) chips.push({ id: 'ofi', k: 'OFI', v: 'In queue', clear: () => set({ ofiOnly: false }) })
  if (filters.bd[0] > bounds.bdMin || filters.bd[1] < bounds.bdMax) chips.push({ id: 'bd', k: 'BD', v: `${filters.bd[0]}-${filters.bd[1]}`, clear: () => set({ bd: [bounds.bdMin, bounds.bdMax] }) })
  if (filters.rev[0] > bounds.revMin || filters.rev[1] < bounds.revMax) chips.push({ id: 'rev', k: 'Rev', v: `$${filters.rev[0]}-${filters.rev[1]}B`, clear: () => set({ rev: [bounds.revMin, bounds.revMax] }) })
  if (filters.pat[0] > bounds.patMin || filters.pat[1] < bounds.patMax) chips.push({ id: 'pat', k: 'Patent', v: `${filters.pat[0]}-${filters.pat[1]}`, clear: () => set({ pat: [bounds.patMin, bounds.patMax] }) })
  const activeCount = chips.length

  const filterRef = useOutside(useCallback(() => setOpenPop((p) => p === 'filter' ? null : p), []))
  const colsRef = useOutside(useCallback(() => setOpenPop((p) => p === 'cols' ? null : p), []))

  return (
    <section className="an-section exp e1">
      <div className="exp-head">
        <div className="exp-head-text">
          <div className="an-eyebrow">Explore - all opportunities</div>
          <h2 className="exp-title">The full gap, on your terms.</h2>
          <p className="exp-sub">
            Every scored medicine from the Story view - here as a table you can slice, sort, and pull.
            Filter on any axis, reorder by any column, reveal the ATC class behind each risk grade, and
            export what you've shaped. Same data, work mode.
          </p>
        </div>
        <button className="exp-csv" onClick={() => exportCsv(filtered, cols)} disabled={loading || !filtered.length}>
          {I.csv} Export CSV
        </button>
      </div>

      {/* toolbar */}
      <div className="exp-toolbar">
        <div className="exp-search">
          {I.search}
          <input type="text" placeholder="Search chemical, brand, area..." value={filters.q}
            onChange={(e) => set({ q: e.target.value })} />
        </div>

        <div className="exp-pop-wrap" ref={filterRef}>
          <button className={'exp-btn' + (activeCount ? ' on' : '')} onClick={() => setOpenPop((p) => p === 'filter' ? null : 'filter')} aria-expanded={openPop === 'filter'}>
            {I.filter} Filters {activeCount > 0 && <span className="exp-btn-n">{activeCount}</span>}
            <span className={'exp-caret' + (openPop === 'filter' ? ' up' : '')}>{I.caret}</span>
          </button>
          {openPop === 'filter' && (
            <div className="exp-pop left wide">
              <div className="exp-pop-head">
                <span className="exp-pop-title">Filter opportunities</span>
                {activeCount > 0 && <div className="exp-pop-acts"><button onClick={() => setFilters(freshFilters(bounds))}>Reset all</button></div>}
              </div>
              <div className="exp-pop-scroll">
                <SegMulti label="Track" options={[{ value: 'A', label: 'A - Small molecule', sw: 'var(--accent)' }, { value: 'B', label: 'B - Biologic', sw: 'var(--blue)' }, { value: 'C', label: 'C - Local generic', sw: 'var(--gray-badge)' }]} selected={filters.track} onToggle={toggleIn('track')} />
                <SegMulti label="Reference-pricing risk" options={[{ value: 'high', label: 'High', sw: 'var(--amber)' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low', sw: 'var(--green)' }, { value: 'unknown', label: 'Unknown' }]} selected={filters.risk} onToggle={toggleIn('risk')} />
                <RangeFilter label="BD score" min={bounds.bdMin} max={bounds.bdMax} step={1} value={filters.bd} onChange={(v) => set({ bd: v })} fmt={(v) => v} />
                <RangeFilter label="Global revenue (USD B)" min={bounds.revMin} max={bounds.revMax} step={0.5} value={filters.rev} onChange={(v) => set({ rev: v })} fmt={(v) => '$' + v + 'B'} />
                <RangeFilter label="Patent expiry" min={bounds.patMin} max={bounds.patMax} step={1} value={filters.pat} onChange={(v) => set({ pat: v })} fmt={(v) => v} />
                <SegMulti label="Modality" options={modalityOpts} selected={filters.modality} onToggle={toggleIn('modality')} />
                <SegMulti label="AU restriction" options={restrictionOpts} selected={filters.restriction} onToggle={toggleIn('restriction')} />
                <div className="exp-fgroup">
                  <span className="exp-fgroup-lab">OFI queue</span>
                  <div className="exp-seg">
                    <button className={filters.ofiOnly ? 'on' : ''} onClick={() => set({ ofiOnly: !filters.ofiOnly })}>
                      <span className="sw" style={{ background: 'var(--accent)' }} />In OFI queue only
                    </button>
                  </div>
                </div>
                <div className="exp-fgroup">
                  <span className="exp-fgroup-lab">Therapeutic area - TG1</span>
                  <div className="exp-checks">
                    {tg1Opts.map((o) => {
                      const on = filters.tg1.has(o.value)
                      return (
                        <label key={o.value} className={'exp-check' + (on ? ' on' : '')}>
                          <input type="checkbox" checked={on} onChange={() => toggleIn('tg1')(o.value)} />
                          <span className="cb">{on ? I.check : null}</span>
                          <span className="ck-name">{o.label}</span>
                          <span className="ck-n">{o.n}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="exp-pop-wrap" ref={colsRef}>
          <button className="exp-btn" onClick={() => setOpenPop((p) => p === 'cols' ? null : 'cols')} aria-expanded={openPop === 'cols'}>
            {I.columns} Columns <span className="exp-btn-n" style={{ background: 'var(--text-mute)' }}>{cols.length}</span>
            <span className={'exp-caret' + (openPop === 'cols' ? ' up' : '')}>{I.caret}</span>
          </button>
          {openPop === 'cols' && (
            <div className="exp-pop left">
              <div className="exp-pop-head"><span className="exp-pop-title">Visible columns</span>
                <div className="exp-pop-acts"><button onClick={() => setVisCols(new Set(COLS.map((c) => c.key)))}>All</button><button onClick={() => setVisCols(new Set(COLS.filter((c) => c.def).map((c) => c.key)))}>Default</button></div>
              </div>
              <div className="exp-pop-scroll">
                <div className="exp-cols">
                  {COLS.map((c) => {
                    const on = visCols.has(c.key)
                    return (
                      <label key={c.key} className={'exp-col-opt' + (on ? ' on' : '') + (c.sticky ? ' locked' : '')}>
                        <input type="checkbox" checked={on} disabled={c.sticky}
                          onChange={() => setVisCols((s) => { const n = new Set(s); n.has(c.key) ? n.delete(c.key) : n.add(c.key); return n })} />
                        <span className="cb">{on ? I.check : null}</span>
                        <span className="ck-name">{c.label}</span>
                        {c.sticky && <span className="lock">pinned</span>}
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="exp-tools-spacer" />
      </div>

      {/* active filters + count */}
      <div className="exp-active">
        <span className="exp-count">
          {loading ? 'Loading...' : <><b>{filtered.length}</b> of {items.length} medicines</>}
        </span>
        {chips.length > 0 && <span className="exp-active-sep" />}
        {chips.map((c) => (
          <span key={c.id} className="exp-chip">
            <span className="chip-k">{c.k}</span>{c.v}
            <button className="exp-chip-x" onClick={c.clear} aria-label={'Clear ' + c.k}>{I.x}</button>
          </span>
        ))}
        {chips.length > 0 && <button className="exp-reset" onClick={() => setFilters(freshFilters(bounds))}>{I.reset} Reset all</button>}
      </div>

      {/* table */}
      {error ? (
        <div className="exp-table-wrap"><div className="exp-empty"><div className="exp-empty-title">Data unavailable</div><div className="exp-empty-sub">Couldn't reach the cross-reference source.</div><button onClick={retry}>Retry</button></div></div>
      ) : (
        <div className="exp-table-wrap">
          <table className="exp-table">
            <thead>
              <tr>
                {cols.map((c) => {
                  const sorted = sort.key === c.key
                  return (
                    <th key={c.key} className={'col-' + c.key + (sorted ? ' sorted' : '')}>
                      <button className={'exp-th-btn' + (c.num ? ' num' : '')} onClick={() => clickSort(c.key)}>
                        {c.label}
                        <span className="exp-th-arrow">{sorted ? (sort.dir === 'asc' ? I.sortAsc : I.sortDesc) : I.sortDesc}</span>
                      </button>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="exp-skel-row">{cols.map((c) => <td key={c.key} className={'col-' + c.key}><div className="exp-skel-bar" style={{ width: c.num ? '44%' : '72%', marginLeft: c.num ? 'auto' : 14 }} /></td>)}</tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={cols.length}><div className="exp-empty"><div className="exp-empty-ic">{I.empty}</div><div className="exp-empty-title">No medicines match these filters</div><div className="exp-empty-sub">Loosen a filter or reset to see the full {items.length}.</div><button onClick={() => setFilters(freshFilters(bounds))}>Reset all filters</button></div></td></tr>
              ) : (
                filtered.map((d) => (
                  <tr key={d.name} onClick={() => onOpenDetail && onOpenDetail(d)}>
                    {cols.map((c) => <td key={c.key} className={'col-' + c.key + (c.num ? ' exp-num' : '')} style={c.center ? { textAlign: 'center' } : undefined}>{c.cell(d)}</td>)}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="exp-foot">
        {I.info}
        <p>
          <b>The risk column carries its own basis.</b> Hover any reference-pricing grade to see the ATC L3 / L4
          class and how many NZ-funded competitors sit in it - that count is the basis of the grade, shown so you
          can judge it yourself. It sits beside the BD score, never inside it. Reference pricing is the only
          barrier tracked today; new columns slot into the picker as their data lands. {updated && <>As of {updated}.</>}
          {auMeta && <><br /><b>AU utilization</b> (in the column picker) is <b>raw AU PBS dispensing</b> — benefit
          cost &amp; scripts from the Date-of-Supply data ({auMeta.period}), <b>not scaled to NZ</b>. It gives Track C
          local generics (no BD Score) a "where the money flows in AU" signal. Hover a value for its ATC grain —
          a <i>class-level</i> figure is shared across the whole ATC class, not one drug. {auMeta.note}</>}
          {nzMeta && <><br /><b>NZ Registration</b> (in the column picker) is a <b>Medsafe snapshot</b> (offline
          precompute, as of {nzMeta.as_of}) over the {nzMeta.total} matched + Track C medicines — <b>not live</b>.
          Hover a value for its meaning; <i>not registered</i> means INN + brand both returned nothing, and
          medicines outside the snapshot read <i>not yet checked</i> (never assumed unregistered).</>}
        </p>
      </div>
    </section>
  )
}
