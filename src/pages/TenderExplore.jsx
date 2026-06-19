// TenderExplore.jsx - Engine 2 - Explore mode (the analyst's workbench).
// CD design integration, ported to the real Vite/ESM app and wired to the LIVE
// /api/tender-clock (the SAME endpoint Story reads). The full sole-supply set as
// a table: filter, sort any column, pick columns, export CSV, row -> detail
// drawer. adaptTargets() adds cohort (= exclusivity_end year) which the real API
// doesn't carry. Hardened for the full 139: 4th hold status 'estimated',
// data-derived cohort options (real data spans 2026-2028, not just 2027/2028),
// null suppliers, and lead_months read live (no hardcoded "~18mo/~5mo").
import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { getTenderClock } from '../api.js'

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
  close:   (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>),
  bolt:    (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/></svg>),
  shield:  (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l8 3v6c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6l8-3z"/><path d="M12 3v18"/></svg>),
  help:    (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.2 9.2a2.8 2.8 0 0 1 5.4 1c0 1.8-2.6 2.2-2.6 4M12 18v.5"/></svg>),
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
function fmtDate(iso) { if (!iso) return '-'; const [y, m] = iso.split('-'); return MONTHS[+m - 1] + ' ' + y }
const DIFF = { small_molecule_generic: { cls: 'simple', label: 'Small-molecule generic' }, complex: { cls: 'complex', label: 'Complex formulation' } }
// hold_status mirrors tenderClock.js classifyHold(). 'estimated' is the transient
// state emitted ONLY while the WS1 supplier map is still loading (backfill) - not a
// real classification; surfaced honestly rather than silently absorbed.
const HOLD = { competitor: 'Competitor-held', opaque: 'Opaque - unmapped', local: 'Local incumbent', estimated: 'Estimated - supplier map loading' }
const diffOf = (k) => DIFF[k] || { cls: 'simple', label: k || '-' }

// Cohort = exclusivity-end year. 2028 has enough runway to start a new dossier;
// 2027 is defend-only (~5mo); 2026 has already expired or is imminent (effectively
// closed per the PHARMAC caveat). Any future year with no interpretation falls back
// to "review pending" so an unmodelled cohort is labelled, never silently shown.
const COHORT_MODE = {
  '2028': { mode: 'start',  word: 'start now' },
  '2027': { mode: 'defend', word: 'defend only' },
  '2026': { mode: 'closed', word: 'closing / closed' },
}
const cohortMeaning = (y) => COHORT_MODE[y] || { mode: 'review', word: 'review pending' }

/* -- live data -> table shape: add cohort (real API has no cohort field) -- */
function adaptTargets(raw) {
  return (raw?.targets || []).map((t) => ({ ...t, cohort: String(t.exclusivity_end || '').slice(0, 4) }))
}

function useOutside(onClose) {
  const ref = useRef(null)
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [onClose])
  return ref
}
function SegMulti({ label, options, selected, onToggle }) {
  return (
    <div className="exp-fgroup">
      <span className="exp-fgroup-lab">{label}</span>
      <div className="exp-seg">
        {options.map((o) => {
          const on = selected.has(o.value)
          return (<button key={o.value} className={on ? 'on' : ''} onClick={() => onToggle(o.value)}>
            {o.sw && <span className="sw" style={{ background: o.sw }} />}{o.label}{o.n != null && <span className="ct">{o.n}</span>}
          </button>)
        })}
      </div>
    </div>
  )
}

/* -- columns -- */
const COLS = [
  { key: 'chemical', label: 'Chemical', sticky: true, def: true,
    val: (t) => t.chemical, cell: (t) => <span className="exp-chem-name" style={{ textTransform: 'none' }}>{t.chemical}</span>, csv: (t) => t.chemical },
  { key: 'tg1', label: 'TG1', def: true,
    val: (t) => t.tg1, cell: (t) => <span className="exp-tag">{t.tg1}</span>, csv: (t) => t.tg1 },
  { key: 'cohort', label: 'Cohort', def: true,
    val: (t) => +t.cohort,
    cell: (t) => { const m = cohortMeaning(t.cohort); const start = m.mode === 'start'; return <span className={'exp-cohort ' + (start ? 'start' : 'defend')} title={`${t.cohort} - ${m.word}`}>{start ? I.bolt : I.shield}{t.cohort}</span> },
    csv: (t) => t.cohort },
  { key: 'exclusivity_end', label: 'Expiry', def: true,
    val: (t) => t.exclusivity_end, cell: (t) => <span className="exp-num" style={{ fontWeight: 700 }}>{fmtDate(t.exclusivity_end)}</span>, csv: (t) => t.exclusivity_end },
  { key: 'supplier', label: 'Supplier', def: true,
    val: (t) => t.supplier || 'zzz',
    cell: (t) => t.supplier ? <span className="exp-tag" style={{ color: 'var(--text)', fontWeight: 600 }}>{t.supplier}</span> : <span className="exp-muted" style={{ fontStyle: 'italic', fontSize: 12 }}>unmapped</span>,
    csv: (t) => t.supplier || 'unmapped' },
  { key: 'hold_status', label: 'Held by', def: true,
    val: (t) => t.hold_status,
    cell: (t) => <span className={'exp-hold ' + t.hold_status}>{t.hold_status === 'opaque' ? I.help : <span className="d" />}{HOLD[t.hold_status] || t.hold_status}</span>,
    csv: (t) => HOLD[t.hold_status] || t.hold_status },
  { key: 'mfr_difficulty', label: 'Difficulty', def: true,
    val: (t) => (t.mfr_difficulty === 'complex' ? 2 : 1),
    cell: (t) => { const d = diffOf(t.mfr_difficulty); return <span className={'exp-diff ' + d.cls}>{d.label}</span> },
    csv: (t) => diffOf(t.mfr_difficulty).label },
  { key: 're_tender_itt', label: 'Re-tender ITT', def: true,
    val: (t) => t.re_tender_itt, cell: (t) => <span className="exp-tag exp-muted" style={{ fontFamily: 'var(--mono)', fontWeight: 600 }}>{t.re_tender_itt}</span>, csv: (t) => t.re_tender_itt },
  { key: 'bid_window', label: 'Bid window', def: false,
    val: (t) => t.bid_window, cell: (t) => <span className="exp-tag exp-muted">{t.bid_window}</span>, csv: (t) => t.bid_window },
  { key: 'lead_months', label: 'Runway (mo)', num: true, def: true,
    val: (t) => t.lead_months,
    cell: (t) => <span className="exp-num" style={{ color: t.lead_months >= 12 ? 'var(--amber)' : 'var(--text-mute)' }}>{t.lead_months}</span>,
    csv: (t) => t.lead_months },
]
const COL_BY_KEY = Object.fromEntries(COLS.map((c) => [c.key, c]))

/* -- live data hook -- */
function useTenderData() {
  const [s, setS] = useState({ loading: true, error: false, targets: [], meta: null })
  const [nonce, setNonce] = useState(0)
  useEffect(() => {
    let alive = true
    setS((x) => ({ ...x, loading: true, error: false }))
    getTenderClock()
      .then((d) => { if (alive) setS({ loading: false, error: false, targets: adaptTargets(d), meta: d.meta || null }) })
      .catch(() => { if (alive) setS({ loading: false, error: true, targets: [], meta: null }) })
    return () => { alive = false }
  }, [nonce])
  return [s, () => setNonce((n) => n + 1)]
}

function exportCsv(rows, cols) {
  const esc = (v) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s }
  const head = cols.map((c) => esc(c.label)).join(',')
  const body = rows.map((t) => cols.map((c) => esc(c.csv(t))).join(',')).join('\n')
  const blob = new Blob(['﻿' + head + '\n' + body], { type: 'text/csv;charset=utf-8;' })
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
  a.download = 'tender-clock-explore.csv'; document.body.appendChild(a); a.click()
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove() }, 100)
}

/* -- detail drawer -- */
function TenderDetail({ t, open, onClose }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    const html = document.documentElement; const prev = html.style.overflow; html.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey); html.style.overflow = prev }
  }, [open, onClose])
  if (!t) return null
  const m = cohortMeaning(t.cohort)
  const start = m.mode === 'start'
  const diff = diffOf(t.mfr_difficulty)
  const runwayPct = Math.max(6, Math.min(100, (t.lead_months / 18) * 100))
  return (
    <>
      <div className={'exp-drawer-overlay' + (open ? ' open' : '')} onClick={onClose} />
      <aside className={'exp-drawer' + (open ? ' open' : '')} role="dialog" aria-modal="true">
        <div className="exp-drawer-head">
          <button className="exp-drawer-close" onClick={onClose} aria-label="Close">{I.close}</button>
          <span className="exp-drawer-tg">{t.tg1}</span>
          <h2 className="exp-drawer-chem">{t.chemical}</h2>
          <p className="exp-drawer-supplier">
            {t.hold_status === 'opaque' ? <span style={{ color: 'var(--text-mute)', fontStyle: 'italic' }}>Supplier unmapped - not in WS1</span> : t.supplier ? <>Held by <b>{t.supplier}</b></> : <span style={{ color: 'var(--text-mute)', fontStyle: 'italic' }}>Supplier unconfirmed</span>}
          </p>
          <span className={'exp-drawer-cohort ' + (start ? 'start' : 'defend')}>{start ? I.bolt : I.shield}{start ? 'Start BD now' : m.mode === 'closed' ? 'Closing / closed' : m.mode === 'review' ? 'Review pending' : 'Defend only'} - {t.cohort} cohort</span>
        </div>
        <div className="exp-drawer-body">
          <div className="exp-drawer-sec">
            <h3 className="exp-drawer-sec-t">The clock</h3>
            <div className="exp-dk"><span className="exp-dk-lab">Exclusivity expiry</span><span className="exp-dk-val mono">{fmtDate(t.exclusivity_end)}</span></div>
            <div className="exp-dk"><span className="exp-dk-lab">Re-tender ITT</span><span className="exp-dk-val mono">{t.re_tender_itt}</span></div>
            <div className="exp-dk"><span className="exp-dk-lab">Bid window</span><span className="exp-dk-val mono">{t.bid_window}</span></div>
          </div>
          <div className="exp-drawer-sec">
            <h3 className="exp-drawer-sec-t">Runway you have</h3>
            <div className="exp-runway-bar"><div className="exp-runway-fill" style={{ width: runwayPct + '%' }} /></div>
            <div className="exp-dk"><span className="exp-dk-lab">Lead time to bid</span><span className="exp-dk-val mono">~{t.lead_months} months</span></div>
            <div className="exp-dk"><span className="exp-dk-lab">Manufacturing difficulty</span><span className="exp-dk-val"><span className={'exp-diff ' + diff.cls}>{diff.label}</span></span></div>
            <div className="exp-dk"><span className="exp-dk-lab">Held by</span><span className="exp-dk-val"><span className={'exp-hold ' + t.hold_status}>{t.hold_status === 'opaque' ? I.help : <span className="d" />}{HOLD[t.hold_status] || t.hold_status}</span></span></div>
          </div>
          <div className="exp-drawer-note">
            {I.info}
            <p>{t.lead_months >= 12
              ? <><b>~{t.lead_months} months is enough runway</b> to develop a new local dossier before the bid window - the cohort where starting now can pay off.</>
              : <><b>~{t.lead_months} months is short</b> - likely too tight to build a new dossier; defend a product you already have registered, or pass.</>}
              {' '}Expiry is not a guaranteed re-tender: PHARMAC may roll over, bundle, or defer any contract.</p>
          </div>
        </div>
      </aside>
    </>
  )
}

function freshFilters() {
  return { q: '', hold: new Set(), diff: new Set(), tg1: new Set(), cohort: new Set(), excludeLocal: false }
}

/* -- main -- */
export default function TenderExplore() {
  const [{ loading, error, targets, meta }, retry] = useTenderData()

  const [filters, setFilters] = useState(freshFilters)
  const [sort, setSort] = useState({ key: 'lead_months', dir: 'desc' })
  const [visCols, setVisCols] = useState(() => new Set(COLS.filter((c) => c.def).map((c) => c.key)))
  const [openPop, setOpenPop] = useState(null)
  const [sel, setSel] = useState(null)
  const [panelOpen, setPanelOpen] = useState(false)

  const openDetail = (t) => { setSel(t); setTimeout(() => setPanelOpen(true), 20) }
  const closeDetail = () => { setPanelOpen(false); setTimeout(() => setSel(null), 320) }

  const set = (patch) => setFilters((f) => ({ ...f, ...patch }))
  const toggleIn = (key) => (v) => setFilters((f) => { const n = new Set(f[key]); n.has(v) ? n.delete(v) : n.add(v); return { ...f, [key]: n } })

  const tg1Opts = useMemo(() => {
    const c = {}; targets.forEach((t) => c[t.tg1] = (c[t.tg1] || 0) + 1)
    return Object.keys(c).sort().map((v) => ({ value: v, label: v, n: c[v] }))
  }, [targets])
  const holdOpts = useMemo(() => {
    const c = {}; targets.forEach((t) => c[t.hold_status] = (c[t.hold_status] || 0) + 1)
    return Object.keys(c).map((v) => ({ value: v, label: HOLD[v] || v, n: c[v], sw: v === 'competitor' ? 'var(--blue)' : v === 'local' ? 'var(--green)' : 'var(--text-mute)' }))
  }, [targets])
  const cohortOpts = useMemo(() => {
    const c = {}; targets.forEach((t) => c[t.cohort] = (c[t.cohort] || 0) + 1)
    return Object.keys(c).sort().map((v) => { const m = cohortMeaning(v); return { value: v, label: `${v} · ${m.word}`, n: c[v], sw: m.mode === 'start' ? 'var(--amber)' : 'var(--text-mute)' } })
  }, [targets])

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase()
    let list = targets.filter((t) => {
      if (q && !((t.chemical + ' ' + t.tg1 + ' ' + (t.supplier || '')).toLowerCase().includes(q))) return false
      if (filters.excludeLocal && t.hold_status === 'local') return false
      if (filters.hold.size && !filters.hold.has(t.hold_status)) return false
      if (filters.diff.size && !filters.diff.has(t.mfr_difficulty)) return false
      if (filters.tg1.size && !filters.tg1.has(t.tg1)) return false
      if (filters.cohort.size && !filters.cohort.has(t.cohort)) return false
      return true
    })
    const col = COL_BY_KEY[sort.key]; const dir = sort.dir === 'asc' ? 1 : -1
    list = [...list].sort((a, b) => { const va = col.val(a), vb = col.val(b); if (va < vb) return -dir; if (va > vb) return dir; return 0 })
    return list
  }, [targets, filters, sort])

  const cols = COLS.filter((c) => visCols.has(c.key))
  const clickSort = (key) => setSort((s) => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: COL_BY_KEY[key].num ? 'desc' : 'asc' })

  const chips = []
  const mkSet = (key, label, fmt) => { if (filters[key].size) chips.push({ id: key, k: label, v: [...filters[key]].map(fmt || ((x) => x)).join(', '), clear: () => set({ [key]: new Set() }) }) }
  mkSet('hold', 'Held', (x) => HOLD[x] || x); mkSet('diff', 'Difficulty', (x) => diffOf(x).label); mkSet('tg1', 'TG1'); mkSet('cohort', 'Cohort')
  if (filters.excludeLocal) chips.push({ id: 'exloc', k: 'Exclude', v: 'Local incumbents', clear: () => set({ excludeLocal: false }) })
  const activeCount = chips.length

  const filterRef = useOutside(useCallback(() => setOpenPop((p) => p === 'filter' ? null : p), []))
  const colsRef = useOutside(useCallback(() => setOpenPop((p) => p === 'cols' ? null : p), []))

  const coverage = meta?.funnel?.supplier_coverage || null

  return (
    <section className="exp e2" style={{ marginTop: 8 }}>
      <div className="exp-head">
        <div className="exp-head-text">
          <div className="an-eyebrow">Explore - all targets</div>
          <h2 className="exp-title">Every sole-supply slot, your way.</h2>
          <p className="exp-sub">
            The same targets the Story view funnels to - here as a table you can sort by runway, filter to
            your portfolio, and export. Use Held-by to separate contestable white-space (competitor / opaque)
            from local-held contracts, and the cohort filter for timing.
          </p>
        </div>
        <button className="exp-csv" onClick={() => exportCsv(filtered, cols)} disabled={loading || !filtered.length}>{I.csv} Export CSV</button>
      </div>

      <div className="exp-toolbar">
        <div className="exp-search">{I.search}
          <input type="text" placeholder="Search chemical, area, supplier..." value={filters.q} onChange={(e) => set({ q: e.target.value })} />
        </div>
        <div className="exp-pop-wrap" ref={filterRef}>
          <button className={'exp-btn' + (activeCount ? ' on' : '')} onClick={() => setOpenPop((p) => p === 'filter' ? null : 'filter')} aria-expanded={openPop === 'filter'}>
            {I.filter} Filters {activeCount > 0 && <span className="exp-btn-n">{activeCount}</span>}
            <span className={'exp-caret' + (openPop === 'filter' ? ' up' : '')}>{I.caret}</span>
          </button>
          {openPop === 'filter' && (
            <div className="exp-pop left wide">
              <div className="exp-pop-head"><span className="exp-pop-title">Filter targets</span>
                {activeCount > 0 && <div className="exp-pop-acts"><button onClick={() => setFilters(freshFilters())}>Reset all</button></div>}
              </div>
              <div className="exp-pop-scroll">
                <SegMulti label="Cohort" options={cohortOpts} selected={filters.cohort} onToggle={toggleIn('cohort')} />
                <SegMulti label="Held by" options={holdOpts} selected={filters.hold} onToggle={toggleIn('hold')} />
                <SegMulti label="Manufacturing difficulty" options={[{ value: 'small_molecule_generic', label: 'Small-molecule generic', sw: 'var(--green)' }, { value: 'complex', label: 'Complex formulation', sw: 'var(--amber)' }]} selected={filters.diff} onToggle={toggleIn('diff')} />
                <div className="exp-fgroup">
                  <span className="exp-fgroup-lab">Local incumbents</span>
                  <div className="exp-seg"><button className={filters.excludeLocal ? 'on' : ''} onClick={() => set({ excludeLocal: !filters.excludeLocal })}><span className="sw" style={{ background: 'var(--green)' }} />Exclude local-held</button></div>
                </div>
                <div className="exp-fgroup">
                  <span className="exp-fgroup-lab">Therapeutic area - TG1</span>
                  <div className="exp-checks">
                    {tg1Opts.map((o) => { const on = filters.tg1.has(o.value); return (
                      <label key={o.value} className={'exp-check' + (on ? ' on' : '')}>
                        <input type="checkbox" checked={on} onChange={() => toggleIn('tg1')(o.value)} />
                        <span className="cb">{on ? I.check : null}</span><span className="ck-name">{o.label}</span><span className="ck-n">{o.n}</span>
                      </label>) })}
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
              <div className="exp-pop-scroll"><div className="exp-cols">
                {COLS.map((c) => { const on = visCols.has(c.key); return (
                  <label key={c.key} className={'exp-col-opt' + (on ? ' on' : '') + (c.sticky ? ' locked' : '')}>
                    <input type="checkbox" checked={on} disabled={c.sticky} onChange={() => setVisCols((s) => { const n = new Set(s); n.has(c.key) ? n.delete(c.key) : n.add(c.key); return n })} />
                    <span className="cb">{on ? I.check : null}</span><span className="ck-name">{c.label}</span>{c.sticky && <span className="lock">pinned</span>}
                  </label>) })}
              </div></div>
            </div>
          )}
        </div>
        <div className="exp-tools-spacer" />
      </div>

      <div className="exp-active">
        <span className="exp-count">{loading ? 'Loading...' : <><b>{filtered.length}</b> of {targets.length} targets</>}</span>
        {chips.length > 0 && <span className="exp-active-sep" />}
        {chips.map((c) => (<span key={c.id} className="exp-chip"><span className="chip-k">{c.k}</span>{c.v}<button className="exp-chip-x" onClick={c.clear} aria-label={'Clear ' + c.k}>{I.x}</button></span>))}
        {chips.length > 0 && <button className="exp-reset" onClick={() => setFilters(freshFilters())}>{I.reset} Reset all</button>}
      </div>

      {error ? (
        <div className="exp-table-wrap"><div className="exp-empty"><div className="exp-empty-title">Data unavailable</div><div className="exp-empty-sub">Couldn't reach the tender source.</div><button onClick={retry}>Retry</button></div></div>
      ) : (
        <div className="exp-table-wrap">
          <table className="exp-table">
            <thead><tr>
              {cols.map((c) => { const sorted = sort.key === c.key; return (
                <th key={c.key} className={'col-' + c.key + (sorted ? ' sorted' : '')}>
                  <button className={'exp-th-btn' + (c.num ? ' num' : '')} onClick={() => clickSort(c.key)}>{c.label}<span className="exp-th-arrow">{sorted ? (sort.dir === 'asc' ? I.sortAsc : I.sortDesc) : I.sortDesc}</span></button>
                </th>) })}
            </tr></thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (<tr key={i} className="exp-skel-row">{cols.map((c) => <td key={c.key} className={'col-' + c.key}><div className="exp-skel-bar" style={{ width: c.num ? '44%' : '72%', marginLeft: c.num ? 'auto' : 14 }} /></td>)}</tr>))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={cols.length}><div className="exp-empty"><div className="exp-empty-ic">{I.empty}</div><div className="exp-empty-title">No targets match these filters</div><div className="exp-empty-sub">Loosen a filter or reset to see all {targets.length}.</div><button onClick={() => setFilters(freshFilters())}>Reset all filters</button></div></td></tr>
              ) : (
                filtered.map((t, i) => (<tr key={t.chemical + '-' + i} onClick={() => openDetail(t)}>{cols.map((c) => <td key={c.key} className={'col-' + c.key + (c.num ? ' exp-num' : '')}>{c.cell(t)}</td>)}</tr>))
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="exp-foot">{I.info}
        <p><b>Read this as a forecast, not a guarantee.</b> An expiring exclusivity opens the door to a re-tender, but PHARMAC may roll a contract over, bundle it, or defer it. Opaque rows have an unmapped supplier - carried as white-space honestly, not padding. {coverage && <>Supplier coverage {coverage}.</>}</p>
      </div>

      {sel && <TenderDetail t={sel} open={panelOpen} onClose={closeDetail} />}
    </section>
  )
}
