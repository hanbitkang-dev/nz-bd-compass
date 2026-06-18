import { useState, useEffect, useMemo } from 'react'
import '../tender-clock.css'

const API = import.meta.env.VITE_API_BASE || 'http://localhost:3002'

const Ic = {
  warn:   <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/></svg>,
  info:   <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>,
  clock:  <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
  zap:    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  shield: <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg>,
}

function adaptApiResponse(raw) {
  const fn = raw.meta?.funnel || {}
  const targets = (raw.targets || []).map(t => ({
    ...t,
    cohort: String(t.exclusivity_end || '').slice(0, 4),
    supplier_src: t.supplier_confirmed ? 'WS1' : null,
  }))

  const byYear = fn.by_year || {}
  const cohortFunnel = {}
  for (const yr of Object.keys(byYear)) {
    const ts = targets.filter(t => t.cohort === yr)
    const hold = { local: 0, competitor: 0, opaque: 0, estimated: 0 }
    for (const t of ts) if (hold[t.hold_status] !== undefined) hold[t.hold_status]++
    const confirmed = ts.filter(t => t.supplier_confirmed).length
    cohortFunnel[yr] = {
      raw: byYear[yr],
      after_filter: ts.length,
      removed_filter: byYear[yr] - ts.length,
      hold,
      white_space: hold.competitor + hold.opaque,
      confirmed,
      coverage_pct: ts.length ? Math.round(confirmed / ts.length * 100) : 0,
    }
  }

  return {
    asOf: new Date().toISOString().slice(0, 10),
    meta: {
      sole_total: fn.sole_total || 0,
      supplier_coverage: fn.supplier_coverage || '0%',
      caveat: raw.meta?.caveat || '',
      cohortFunnel,
      by_year: byYear,
      hold_total: fn.hold || {},
      white_space_total: fn.white_space || 0,
      cohortModes: {
        '2028': { mode: 'start',  leadMonths: 17, title: 'Start now',   note: '~17-month runway to the Nov 2027 bid window. Only cohort with enough lead time to build a new dossier before the ITT closes.' },
        '2027': { mode: 'defend', leadMonths: 5,  title: 'Defend only', note: '~5-month runway to the Nov 2026 bid. Too short for new development — defend what you already have registered in NZ.' },
      },
    },
    targets,
  }
}

const PAGE_SIZE = 9

// ── Timeline percentages ──────────────────────────────────────────
// Span: Jun 2026 → Dec 2028 = 30 months (origin = Jun 2026)
function pct(year, month) {
  const origin = 2026 + 5 / 12
  const span = 2.5
  return Math.round(((year + (month - 1) / 12) - origin) / span * 100)
}
const TL = {
  now:     pct(2026, 6),   // 0%
  bid2027: pct(2026, 11),  // ~17%
  exp2027: pct(2027, 6),   // 40%
  bid2028: pct(2027, 11),  // ~57%
  exp2028: pct(2028, 6),   // 80%
  years: [
    { label: '2026', pct: 0 },
    { label: '2027', pct: pct(2027, 1) },  // ~23%
    { label: '2028', pct: pct(2028, 1) },  // ~63%
  ],
}

// ── Year-header row — mirrors .tc-lane grid (132px | 1fr) ────────
// BUG FIX: original used className="tc-rail-years" (padding-left:132px
// with flex children) but the JSX renders absolute-positioned children
// with pct% — those % are relative to the full container width, not
// the track-only 1fr column. Fix: use the same 132px|1fr grid here so
// the absolute positions are within the track column.
function YearHeaders() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '132px 1fr', marginBottom: 8 }}>
      <div /> {/* spacer — matches .tc-lane-label column */}
      <div style={{ position: 'relative', height: 20 }}>
        {TL.years.map(y => (
          <div key={y.label} style={{
            position: 'absolute', left: `${y.pct}%`, top: 0,
            fontFamily: 'var(--mono)', fontSize: 11.5, fontWeight: 700,
            color: y.label === '2026' ? 'var(--accent)' : 'var(--text-mute)',
            transform: 'translateX(-50%)',
            userSelect: 'none',
          }}>
            {y.label === '2026' ? 'Now' : y.label}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function TenderClockPage() {
  const [raw, setRaw]         = useState(null)
  const [error, setError]     = useState(null)
  const [cohort, setCohort]   = useState('2028')
  const [showLocal, setShowLocal] = useState(false)
  const [filterTg1s, setFilterTg1s] = useState(new Set())
  const [filterDiff, setFilterDiff] = useState('')
  const [tg1Open, setTg1Open] = useState(false)
  const [page, setPage]       = useState(1)

  useEffect(() => {
    fetch(`${API}/api/tender-clock`)
      .then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e)))
      .then(d => setRaw(adaptApiResponse(d)))
      .catch(e => setError(e.error || e.message || 'Failed to load'))
  }, [])

  const data = raw

  const availableTg1s = useMemo(() => {
    if (!data) return []
    const seen = new Set()
    data.targets.filter(t => t.cohort === cohort).forEach(t => t.tg1 && seen.add(t.tg1))
    return [...seen].sort()
  }, [data, cohort])

  const filteredTargets = useMemo(() => {
    if (!data) return []
    let out = data.targets.filter(t => t.cohort === cohort)
    if (!showLocal)          out = out.filter(t => t.hold_status !== 'local')
    if (filterTg1s.size > 0) out = out.filter(t => filterTg1s.has(t.tg1))
    if (filterDiff)          out = out.filter(t => t.mfr_difficulty === filterDiff)
    return out
  }, [data, cohort, showLocal, filterTg1s, filterDiff])

  const shown = filteredTargets.slice(0, page * PAGE_SIZE)
  const hasMore = filteredTargets.length > shown.length
  const cf = data?.meta.cohortFunnel[cohort]
  const mode = data?.meta.cohortModes[cohort]

  function toggleTg1(tg) {
    setFilterTg1s(prev => { const n = new Set(prev); n.has(tg) ? n.delete(tg) : n.add(tg); return n })
    setPage(1)
  }
  function resetFilters() {
    setShowLocal(false); setFilterTg1s(new Set()); setFilterDiff(''); setTg1Open(false); setPage(1)
  }
  function changeCohort(yr) { setCohort(yr); setFilterTg1s(new Set()); setPage(1) }

  if (error) return (
    <div className="content-wrap tc">
      <div className="tc-intro">
        <div className="tc-chip caveat">{Ic.warn} <span>Failed to load: {error}</span></div>
      </div>
    </div>
  )

  if (!data) return (
    <div className="content-wrap tc">
      <div className="tc-skel tc-skel-block" style={{ height: 120, marginBottom: 16 }} />
      <div className="tc-skel-grid">
        {[0,1,2].map(i => <div key={i} className="tc-skel tc-skel-card" />)}
      </div>
    </div>
  )

  const m = data.meta
  const coveInt = parseInt(m.supplier_coverage)

  return (
    <div className="content-wrap tc">

      {/* ── Intro ── */}
      <div className="tc-intro">
        <div className="tc-eyebrow">
          <span className="tc-eyebrow-dot" />
          Tender Clock · PSS Sole-Supply Pipeline
        </div>
        <h1 className="tc-title">
          Which contracts are up for re-tender —<br />
          and <span className="em">who holds them now?</span>
        </h1>
        <p className="tc-sub">
          PHARMAC sole-supply exclusivities ending in 2027–28, mapped through
          the ITT calendar. White-space = competitor or unknown supplier —
          re-tender contestable by an ANZ local.
        </p>
        <div className="tc-meta-strip">
          <div className="tc-chip">
            {Ic.clock}
            <span className="tc-chip-n">{m.sole_total}</span>
            sole-supply contracts total
          </div>
          <div className="tc-chip accent">
            {Ic.zap}
            <span className="tc-chip-n">{m.white_space_total}</span>
            white-space slots (all years)
          </div>
          <div className="tc-chip" style={{ opacity: coveInt < 60 ? 1 : 0.8 }}>
            {Ic.info}
            <span className="tc-chip-n" style={{ color: coveInt < 60 ? 'var(--amber)' : 'var(--text)' }}>
              {m.supplier_coverage}
            </span>
            supplier coverage, all years (WS1)
          </div>
          <div className="tc-chip caveat">
            {Ic.warn}
            <span>{m.caveat}</span>
          </div>
        </div>
      </div>

      {/* ── Section 1: Funnel ── */}
      <div className="tc-section">
        <div className="tc-sec-head">
          <span className="tc-sec-kicker">01</span>
          <h2 className="tc-sec-title">How we get to white-space</h2>
          <span className="tc-sec-note">
            3-stage filter from raw PSS sole-supply contracts → re-tender opportunities
          </span>
        </div>
        {cf && (
          <div className="tc-panel tc-funnel">
            <div className="tc-fn-row">
              <div className="tc-fn-n">{cf.raw}</div>
              <div className="tc-fn-label">
                <div className="l">{cohort} cohort — PSS contracts expiring Jun {cohort}</div>
                <span className="s">Sole-supply exclusivity end-dated {parseInt(cohort)-1}/{cohort.slice(2)} ITT</span>
              </div>
              <div className="tc-fn-bar" style={{ width: '100%' }} />
            </div>
            <div className="tc-fn-cut">
              <div className="tc-fn-cut-body">
                <span className="tc-fn-cut-n">−{cf.removed_filter}</span>
                <span className="tc-fn-cut-line" />
                <span>vaccines, biologics, and devices excluded</span>
              </div>
            </div>
            <div className="tc-fn-row">
              <div className="tc-fn-n">{cf.after_filter}</div>
              <div className="tc-fn-label">
                <div className="l">Manufacturable {cohort} contracts</div>
                <span className="s">Small-molecule generic + complex form — dossier-buildable</span>
              </div>
              <div className="tc-fn-bar" style={{ width: `${Math.round(cf.after_filter / cf.raw * 100)}%` }} />
            </div>
            <div className="tc-fn-cut">
              <div className="tc-fn-cut-body">
                <span className="tc-fn-cut-n">−{cf.hold.local}</span>
                <span className="tc-fn-cut-line" />
                <span>already held by an ANZ-local supplier — no white-space</span>
              </div>
            </div>
            <div className="tc-fn-row terminal">
              <div className="tc-fn-n">{cf.white_space}</div>
              <div className="tc-fn-label">
                <div className="l">White-space — re-tender contestable</div>
                <span className="s">Competitor-held ({cf.hold.competitor}) + supplier unknown ({cf.hold.opaque})</span>
              </div>
              <div className="tc-fn-bar" style={{ width: `${Math.round(cf.white_space / cf.raw * 100)}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* ── Section 2: Hold-status split ── */}
      <div className="tc-section">
        <div className="tc-sec-head">
          <span className="tc-sec-kicker">02</span>
          <h2 className="tc-sec-title">Who holds the {cohort} contracts now</h2>
          <span className="tc-sec-note">
            {cf
              ? `${cf.coverage_pct}% of ${cohort} contracts supplier-confirmed (${cf.confirmed}/${cf.after_filter}) via WS1 notifications`
              : `${m.supplier_coverage} supplier-confirmed (all years)`}
          </span>
        </div>
        {cf && (
          <div className="tc-panel">
            <div className="tc-hold-head">
              <span className="h">{cf.after_filter} contracts after filter</span>
              <span className="s">· {cohort} cohort</span>
            </div>
            <div className="tc-hold-bar">
              <div className="tc-hold-seg local"      style={{ flex: cf.hold.local }}>
                <span className="seg-n">{cf.hold.local}</span>
                <span className="seg-l">Local</span>
              </div>
              <div className="tc-hold-seg competitor" style={{ flex: cf.hold.competitor }}>
                <span className="seg-n">{cf.hold.competitor}</span>
                <span className="seg-l">Competitor</span>
              </div>
              {cf.hold.opaque > 0 && (
                <div className="tc-hold-seg opaque"   style={{ flex: cf.hold.opaque }}>
                  <span className="seg-n">{cf.hold.opaque}</span>
                  <span className="seg-l">Opaque</span>
                </div>
              )}
            </div>
            {cf.white_space > 0 && (
              <>
                <div className="tc-ws-bracket">
                  <div className="spacer" style={{ width: `${Math.round(cf.hold.local / cf.after_filter * 100)}%` }} />
                  <div className="brace" data-label={`${cf.white_space} white-space`} />
                </div>
                <div className="tc-ws-cap" />
              </>
            )}
            <div className="tc-hold-legend">
              <div className="tc-hl local">
                <div className="sw" />
                <div>
                  <div className="hl-name">ANZ Local ({cf.hold.local})</div>
                  <div className="hl-desc">Already held by a NZ/AU local manufacturer or marketer. Not re-tender white-space.</div>
                </div>
              </div>
              <div className="tc-hl competitor">
                <div className="sw" />
                <div>
                  <div className="hl-name">Competitor ({cf.hold.competitor})</div>
                  <div className="hl-desc">Held by a global generic or originator. Contestable — a local can bid at ITT.</div>
                </div>
              </div>
              <div className="tc-hl opaque">
                <div className="sw" />
                <div>
                  <div className="hl-name">Opaque / Unknown ({cf.hold.opaque})</div>
                  <div className="hl-desc">Supplier not found in tender notification window. May be tender-exempt or under a direct arrangement.</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Section 3: Timeline runway ── */}
      <div className="tc-section">
        <div className="tc-sec-head">
          <span className="tc-sec-kicker">03</span>
          <h2 className="tc-sec-title">Runway to bid window</h2>
          <span className="tc-sec-note">ITT bid window opens ~Nov of the year before exclusivity ends</span>
        </div>
        <div className="tc-panel">
          {/* Year headers — FIXED: wrapped in same 132px|1fr grid as .tc-lane so pct%
              is relative to the track column, not the full container width */}
          <YearHeaders />

          {/* 2028 lane — start */}
          <div className="tc-lane start">
            <div className="tc-lane-label">
              <span className="mode">{Ic.zap} Start now</span>
              <span className="coh">2028 cohort</span>
              <span className="lead">17 mo runway</span>
            </div>
            <div className="tc-track">
              {TL.years.slice(1).map(y => (
                <div key={y.label} className="grid-line" style={{ left: `${y.pct}%` }} />
              ))}
              <div className="now-line" style={{ left: `${TL.now}%` }} />
              <div className="tc-runway start" style={{ left: `${TL.now}%`, right: `${100 - TL.bid2028}%` }}>
                17 months → bid window
              </div>
              <div className="tc-mark" style={{ left: `${TL.bid2028}%`, top: '50%', transform: 'translate(-50%, -50%)' }}>
                <div className="pin" />
                <span className="pin-lab">Nov 2027 bid</span>
              </div>
              <div className="tc-expiry" style={{ left: `${TL.exp2028}%`, top: '50%', transform: 'translate(-50%, -50%)' }}>
                <div className="dia" />
                <span className="ex-lab">Jun 2028</span>
              </div>
            </div>
          </div>

          {/* 2027 lane — defend */}
          <div className="tc-lane defend">
            <div className="tc-lane-label">
              <span className="mode">{Ic.shield} Defend only</span>
              <span className="coh">2027 cohort</span>
              <span className="lead">5 mo runway</span>
            </div>
            <div className="tc-track">
              {TL.years.slice(1).map(y => (
                <div key={y.label} className="grid-line" style={{ left: `${y.pct}%` }} />
              ))}
              <div className="now-line" style={{ left: `${TL.now}%` }} />
              <div className="tc-runway defend" style={{ left: `${TL.now}%`, right: `${100 - TL.bid2027}%` }}>
                5 mo
              </div>
              <div className="tc-mark" style={{ left: `${TL.bid2027}%`, top: '50%', transform: 'translate(-50%, -50%)' }}>
                <div className="pin" />
                <span className="pin-lab">Nov 2026 bid</span>
              </div>
              <div className="tc-expiry" style={{ left: `${TL.exp2027}%`, top: '50%', transform: 'translate(-50%, -50%)' }}>
                <div className="dia" />
                <span className="ex-lab">Jun 2027</span>
              </div>
            </div>
          </div>

          <div className="tc-rail-legend">
            <span className="rl"><span className="runway-sw" /> Dossier development runway</span>
            <span className="rl"><span className="pin-sw" /> ITT bid window opens</span>
            <span className="rl"><span className="dia-sw" style={{ display:'inline-block' }} /> PSS exclusivity end</span>
          </div>
        </div>
      </div>

      {/* ── Section 4: Target cards ── */}
      <div className="tc-section">
        <div className="tc-sec-head">
          <span className="tc-sec-kicker">04</span>
          <h2 className="tc-sec-title">White-space targets</h2>
        </div>

        <div className="tc-toolbar">
          <div className="tc-seg">
            <button className={cohort === '2028' ? 'active' : ''} onClick={() => changeCohort('2028')}>
              2028 <span className="pf">Start</span>
            </button>
            <button className={cohort === '2027' ? 'active' : ''} onClick={() => changeCohort('2027')}>
              2027 <span className="pf">Defend</span>
            </button>
          </div>
          <div className="tc-seg">
            <button className={!showLocal ? 'active' : ''} onClick={() => { setShowLocal(false); setPage(1) }}>White-space</button>
            <button className={showLocal ? 'active' : ''} onClick={() => { setShowLocal(true); setPage(1) }}>All</button>
          </div>
          <div className="tc-tg1-wrap">
            <button
              className={`tc-tg1-btn${tg1Open || filterTg1s.size > 0 ? ' active' : ''}`}
              onClick={() => setTg1Open(o => !o)}
            >
              {filterTg1s.size > 0 ? `${filterTg1s.size} area${filterTg1s.size > 1 ? 's' : ''}` : 'Therapy area'}
              <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2.5" fill="none" style={{ marginLeft: 5 }}><path d="m6 9 6 6 6-6"/></svg>
            </button>
            {tg1Open && (
              <div className="tc-tg1-dropdown">
                <div className="tc-tg1-header">
                  <span>Therapeutic area</span>
                  {filterTg1s.size > 0 && (
                    <button onClick={() => { setFilterTg1s(new Set()); setPage(1) }}>Clear</button>
                  )}
                </div>
                {availableTg1s.map(tg => (
                  <label key={tg} className={`tc-tg1-option${filterTg1s.has(tg) ? ' checked' : ''}`}>
                    <input type="checkbox" checked={filterTg1s.has(tg)} onChange={() => toggleTg1(tg)} />
                    <span>{tg}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <div className="tc-seg">
            <button className={filterDiff === '' ? 'active' : ''} onClick={() => { setFilterDiff(''); setPage(1) }}>Any</button>
            <button className={filterDiff === 'small_molecule_generic' ? 'active' : ''} onClick={() => { setFilterDiff('small_molecule_generic'); setPage(1) }}>Simple</button>
            <button className={filterDiff === 'complex' ? 'active' : ''} onClick={() => { setFilterDiff('complex'); setPage(1) }}>Complex</button>
          </div>
          <span className="tc-count"><b>{filteredTargets.length}</b> results</span>
        </div>

        {mode && (
          <div className={`tc-cohort ${mode.mode}`}>
            <div className="tc-cohort-head">
              <span className={`ch-mode ${mode.mode}`}>{mode.mode === 'start' ? Ic.zap : Ic.shield} {mode.title}</span>
              <span className="ch-title">{cohort} cohort</span>
              <span className="ch-meta"><b>{mode.leadMonths}</b> months to bid window</span>
            </div>
            <p className="tc-cohort-note">{mode.note}</p>
          </div>
        )}

        {filteredTargets.length === 0 ? (
          <div className="tc-chip" style={{ marginTop: 8 }}>
            {Ic.info} No targets match these filters.{' '}
            <button onClick={resetFilters} style={{ marginLeft: 8, background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>Reset</button>
          </div>
        ) : (
          <>
            <div className="tc-grid">
              {shown.map((t, i) => (
                <TargetCard key={`${t.chemical}-${t.cohort}-${i}`} t={t} cohort={cohort} />
              ))}
            </div>
            {hasMore && (
              <div className="tc-load-more">
                <button onClick={() => setPage(p => p + 1)}>
                  Show more <span className="ct">({filteredTargets.length - shown.length} remaining)</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Footer caveat ── */}
      <div className="tc-foot">
        {Ic.warn}
        <p>
          <b>Data confidence:</b> Exclusivity end dates from CPSReporting.xlsx (auto-refreshed weekly).
          Supplier data from PHARMAC tender award notifications (WS1).
          {' '}{100 - parseInt(m.supplier_coverage)}% of contracts have no confirmed supplier — classified as "opaque."
          Exclusivity end is <b>not a guaranteed re-tender</b> — PHARMAC may roll over or extend arrangements.
          This tool is for commercial planning only; verify directly with PHARMAC before any regulatory or tender submission.
        </p>
      </div>
    </div>
  )
}

function TargetCard({ t, cohort }) {
  const mode = cohort === '2028' ? 'start' : 'defend'
  const isOpaque = t.hold_status === 'opaque'

  return (
    <div className={`tc-card ${mode}`}>
      <div className="tc-card-head">
        <div className="tc-card-top">
          <span className="tc-tg" title={t.tg1}>{t.tg1 || '—'}</span>
          {t.hold_status !== 'local' && (
            <span className={`tc-hold-badge ${t.hold_status}`}>
              <span className="hb-dot" />
              {isOpaque ? 'Opaque' : 'Competitor'}
            </span>
          )}
        </div>
        <h3 className="tc-chem">{t.chemical}</h3>
        <div className="tc-card-supplier">
          {isOpaque ? (
            <span className="opaque-note">Supplier unknown — not in tender notification window</span>
          ) : t.supplier ? (
            <>currently: <b>{t.supplier}</b>{t.supplier_src && <span className="tc-src">{t.supplier_src}</span>}</>
          ) : (
            <span className="opaque-note">Supplier unconfirmed</span>
          )}
        </div>
      </div>

      <div className="tc-card-rows">
        <span className="tc-row-lab">Difficulty</span>
        <span className="tc-row-val">
          <span className={`tc-diff ${t.mfr_difficulty === 'complex' ? 'complex' : 'simple'}`}>
            {t.mfr_difficulty === 'complex' ? 'Complex' : 'Small-molecule'}
          </span>
        </span>
        <span className="tc-row-lab">ITT round</span>
        <span className="tc-row-val mono">{t.re_tender_itt}</span>
        <span className="tc-row-lab">Bid window</span>
        <span className="tc-row-val mono">{t.bid_window}</span>
      </div>

      <div className="tc-card-foot">
        {mode === 'start' ? Ic.zap : Ic.shield}
        <span>{mode === 'start' ? 'Start now' : 'Defend only'}</span>
        <span className="ld-tail">{t.lead_months}mo runway</span>
      </div>
    </div>
  )
}
