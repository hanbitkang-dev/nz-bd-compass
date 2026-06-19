// Engine2Explore.jsx — NZ BD Compass · Engine 2 "Explore" (Table) mode.
// One full fetch of tender-clock (all 139 targets) → client filter/sort store.
// Filters (hold_status, exclude_local, difficulty, tg1, cohort) run client-side.
import { useState, useEffect, useMemo } from 'react'
import ExploreTable from './ExploreTable'
import { getTenderClock } from '../api.js'
import { useSort, downloadCSV } from '../explore-utils.js'

const IcDownload = (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>)

const HOLD = ['competitor', 'opaque', 'local', 'estimated']
const cohortOf = t => String(t.exclusivity_end || '').slice(0, 4)
const HoldTag = ({ h }) => <span className={`xp-tag hold-${h || 'estimated'}`}>{h || '—'}</span>
const diffLabel = d => (d === 'complex' ? 'Complex' : d === 'small_molecule_generic' ? 'Small-molecule' : (d || '—'))

const COLUMNS = [
  { key: 'chemical', label: 'Chemical', get: t => t.chemical, render: t => <span className="xp-chem">{t.chemical}</span> },
  { key: 'tg1', label: 'TG1', get: t => t.tg1 || '' },
  { key: 'exclusivity_end', label: 'Exclusivity end', get: t => t.exclusivity_end || '—', csv: t => t.exclusivity_end || '' },
  { key: 'supplier', label: 'Supplier', get: t => t.supplier || (t.hold_status === 'opaque' ? '(unknown)' : '—'), csv: t => t.supplier || '' },
  { key: 'hold_status', label: 'Hold status', get: t => t.hold_status, render: t => <HoldTag h={t.hold_status} />, csv: t => t.hold_status || '' },
  { key: 'mfr_difficulty', label: 'Mfr difficulty', get: t => diffLabel(t.mfr_difficulty), csv: t => t.mfr_difficulty || '' },
  { key: 're_tender_itt', label: 'Re-tender ITT', get: t => t.re_tender_itt || '—', csv: t => t.re_tender_itt || '' },
  { key: 'lead_months', label: 'Lead months', align: 'right', get: t => t.lead_months, sortVal: t => t.lead_months },
]

export default function Engine2Explore() {
  const [targets, setTargets] = useState(null)
  const [error, setError] = useState(false)

  const [holds, setHolds] = useState(new Set())
  const [excludeLocal, setExcludeLocal] = useState(false)
  const [difficulty, setDifficulty] = useState('')
  const [tg1, setTg1] = useState('')
  const [cohort, setCohort] = useState('')

  useEffect(() => {
    let alive = true
    getTenderClock()
      .then(d => { if (alive) setTargets(d.targets || []) })
      .catch(() => { if (alive) setError(true) })
    return () => { alive = false }
  }, [])

  const cohorts = useMemo(() => {
    if (!targets) return []
    return [...new Set(targets.map(cohortOf).filter(Boolean))].sort()
  }, [targets])

  const filtered = useMemo(() => {
    if (!targets) return []
    const q = tg1.trim().toLowerCase()
    return targets.filter(t => {
      if (excludeLocal && t.hold_status === 'local') return false
      if (holds.size && !holds.has(t.hold_status)) return false
      if (difficulty && t.mfr_difficulty !== difficulty) return false
      if (cohort && cohortOf(t) !== cohort) return false
      if (q && !(t.tg1 || '').toLowerCase().includes(q)) return false
      return true
    })
  }, [targets, holds, excludeLocal, difficulty, tg1, cohort])

  const { sorted, sort, toggle } = useSort(filtered, COLUMNS, { key: 'exclusivity_end', dir: 'asc' })

  const toggleHold = h => setHolds(prev => { const n = new Set(prev); n.has(h) ? n.delete(h) : n.add(h); return n })
  const reset = () => { setHolds(new Set()); setExcludeLocal(false); setDifficulty(''); setTg1(''); setCohort('') }
  const exportCSV = () => downloadCSV(`engine2-tender-clock-${sorted.length}.csv`, sorted, COLUMNS)

  if (error) return <div className="xp-empty">Couldn't reach the tender-clock source. Try again shortly.</div>
  if (!targets) return <div className="xp"><div className="xp-skel" /></div>

  return (
    <div className="xp">
      <div className="xp-toolbar">
        <div className="xp-field">
          <span className="xp-field-lab">Hold status</span>
          <div className="xp-chips">
            {HOLD.map(h => (
              <button key={h} className={`xp-chip tc${holds.has(h) ? ' on' : ''}`} onClick={() => toggleHold(h)}>{h}</button>
            ))}
          </div>
        </div>
        <div className="xp-field">
          <span className="xp-field-lab">Cohort (yr)</span>
          <select className="xp-select" value={cohort} onChange={e => setCohort(e.target.value)}>
            <option value="">Any</option>
            {cohorts.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="xp-field">
          <span className="xp-field-lab">Difficulty</span>
          <select className="xp-select" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
            <option value="">Any</option>
            <option value="small_molecule_generic">Small-molecule</option>
            <option value="complex">Complex</option>
          </select>
        </div>
        <div className="xp-field">
          <span className="xp-field-lab">TG1 contains</span>
          <input className="xp-input" placeholder="e.g. nervous" value={tg1} onChange={e => setTg1(e.target.value)} style={{ width: 150 }} />
        </div>
        <div className="xp-field">
          <span className="xp-field-lab">&nbsp;</span>
          <button className={`xp-toggle${excludeLocal ? ' on' : ''}`} onClick={() => setExcludeLocal(v => !v)} aria-pressed={excludeLocal}>
            {excludeLocal && <span className="dot" />}Exclude local
          </button>
        </div>

        <div className="xp-actions">
          <button className="xp-btn" onClick={reset}>Reset</button>
          <button className="xp-btn primary" onClick={exportCSV} disabled={!sorted.length}>{IcDownload} Export CSV</button>
        </div>
      </div>

      <p className="xp-count"><b>{sorted.length}</b> of <b>{targets.length}</b> sole-supply targets</p>

      {sorted.length === 0 ? (
        <div className="xp-empty">No targets match these filters. <button className="xp-btn" onClick={reset} style={{ marginLeft: 8 }}>Reset</button></div>
      ) : (
        <ExploreTable
          columns={COLUMNS}
          rows={sorted}
          sort={sort}
          onToggleSort={toggle}
          rowKey={(t, i) => `${t.chemical}-${i}`}
        />
      )}
    </div>
  )
}
