// Engine1Explore.jsx — NZ BD Compass · Engine 1 "Explore" (Table) mode.
// Architecture: one full fetch of gap-enriched (all 523) + reference-pricing,
// joined client-side by chemical → useState filter/sort store → useMemo derived
// rows. No server round-trips on filter/sort. Row click reuses BdDetailPanel.
import { useState, useEffect, useMemo, useCallback } from 'react'
import ExploreTable from './ExploreTable'
import BdDetailPanel from './BdDetailPanel'
import { getGapEnriched, getReferencePricing } from '../api.js'
import { useSort, downloadCSV } from '../explore-utils.js'

const IcDownload = (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>)
const IcCols = (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18"/></svg>)

const yearOf = pe => { const m = String(pe ?? '').match(/20\d{2}/); return m ? +m[0] : null }
const revOf = g => g.pharma_intel?.revenue_usd_b ?? null
const revFmt = v => (v == null ? '—' : `$${Number(v).toFixed(2).replace(/\.?0+$/, '')}B`)

const TrackTag = ({ t }) => <span className={`xp-tag track-${t || 'null'}`}>{t || '—'}</span>
const RiskTag  = ({ r }) => <span className={`xp-tag risk-${r || 'unknown'}`}>{r || 'unknown'}</span>

// All columns. `core: true` = shown by default. Optional ones toggle via picker.
const ALL_COLUMNS = [
  { key: 'chemical',  label: 'Chemical', core: true, get: g => g.name, render: g => <span className="xp-chem">{g.name}</span> },
  { key: 'track',     label: 'Track',    core: true, get: g => g.track, render: g => <TrackTag t={g.track} /> },
  { key: 'tg1',       label: 'TG1',      core: true, get: g => g.tg1 || '' },
  { key: 'bd_score',  label: 'BD score', core: true, align: 'right', get: g => g.bd_score, sortVal: g => g.bd_score },
  { key: 'revenue',   label: 'Revenue',  core: true, align: 'right', get: g => revFmt(revOf(g)), sortVal: revOf, csv: g => revOf(g) ?? '' },
  { key: 'patent',    label: 'Patent expiry', core: true, get: g => g.pharma_intel?.patent_expiry || '—', sortVal: g => yearOf(g.pharma_intel?.patent_expiry), csv: g => g.pharma_intel?.patent_expiry || '' },
  { key: 'au',        label: 'AU restriction', core: true, get: g => g.au_restriction || '—', csv: g => g.au_restriction || '' },
  { key: 'risk',      label: 'Ref-pricing risk', core: true, get: g => g.reference_pricing_risk, render: g => <RiskTag r={g.reference_pricing_risk} />, csv: g => g.reference_pricing_risk || '' },
  { key: 'class_cnt', label: 'Class funded #', core: true, align: 'right', get: g => g.class_funded_count ?? '—', sortVal: g => g.class_funded_count, csv: g => g.class_funded_count ?? '' },
  { key: 'ofi',       label: 'OFI pending', core: true, get: g => (g.ofiPending ? 'Yes' : 'No'), render: g => g.ofiPending ? <span className="xp-yes">Yes</span> : <span className="xp-no">No</span>, sortVal: g => (g.ofiPending ? 1 : 0) },
  // optional extras (we have the data — show on demand)
  { key: 'atc_l4',    label: 'ATC L4',   core: false, get: g => g.atc_l4 || '—', csv: g => g.atc_l4 || '' },
  { key: 'modality',  label: 'Modality', core: false, get: g => g.pharma_intel?.modality || '—', csv: g => g.pharma_intel?.modality || '' },
  { key: 'brand',     label: 'Brand',    core: false, get: g => g.pharma_intel?.brand_name || g.brand || '—', csv: g => g.pharma_intel?.brand_name || g.brand || '' },
]

const TRACKS = ['A', 'B', 'C']
const RISKS = ['high', 'medium', 'low', 'unknown']

const num = v => (v === '' || v == null ? null : Number(v))

export default function Engine1Explore({ onNavigate }) {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState(false)

  // filter store
  const [tracks, setTracks] = useState(new Set())
  const [risks, setRisks] = useState(new Set())
  const [tg1, setTg1] = useState('')
  const [modality, setModality] = useState('')
  const [au, setAu] = useState('')
  const [ofiOnly, setOfiOnly] = useState(false)
  const [bd, setBd] = useState({ min: '', max: '' })
  const [rev, setRev] = useState({ min: '', max: '' })
  const [pe, setPe] = useState({ min: '', max: '' })

  // column visibility
  const [visKeys, setVisKeys] = useState(() => new Set(ALL_COLUMNS.filter(c => c.core).map(c => c.key)))
  const [colMenu, setColMenu] = useState(false)

  // detail panel
  const [sel, setSel] = useState(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const openPanel = useCallback(g => { setSel(g); setTimeout(() => setPanelOpen(true), 20) }, [])
  const closePanel = useCallback(() => { setPanelOpen(false); setTimeout(() => setSel(null), 320) }, [])

  useEffect(() => {
    let alive = true
    Promise.all([getGapEnriched(), getReferencePricing()])
      .then(([gapData, rp]) => {
        if (!alive) return
        const rpByChem = new Map()
        for (const it of (rp.items || [])) rpByChem.set(it.chemical.toLowerCase(), it)
        const joined = (gapData.gaps || []).map(g => {
          const r = rpByChem.get(g.name.toLowerCase())
          return { ...g, atc_l3: r?.atc_l3 || '', atc_l4: r?.atc_l4 || '', class_funded_count: r?.class_funded_count ?? null, basis: r?.basis || '' }
        })
        setRows(joined)
      })
      .catch(() => { if (alive) setError(true) })
    return () => { alive = false }
  }, [])

  const modalities = useMemo(() => {
    if (!rows) return []
    return [...new Set(rows.map(g => g.pharma_intel?.modality).filter(Boolean))].sort()
  }, [rows])
  const auLevels = useMemo(() => {
    if (!rows) return []
    return [...new Set(rows.map(g => g.au_restriction).filter(Boolean))].sort()
  }, [rows])

  const filtered = useMemo(() => {
    if (!rows) return []
    const q = tg1.trim().toLowerCase()
    const bdMin = num(bd.min), bdMax = num(bd.max)
    const revMin = num(rev.min), revMax = num(rev.max)
    const peMin = num(pe.min), peMax = num(pe.max)
    return rows.filter(g => {
      if (tracks.size && !tracks.has(g.track)) return false
      if (risks.size && !risks.has(g.reference_pricing_risk || 'unknown')) return false
      if (q && !(g.tg1 || '').toLowerCase().includes(q)) return false
      if (modality && g.pharma_intel?.modality !== modality) return false
      if (au && g.au_restriction !== au) return false
      if (ofiOnly && !g.ofiPending) return false
      const score = g.bd_score
      if (bdMin != null && score < bdMin) return false
      if (bdMax != null && score > bdMax) return false
      const r = revOf(g)
      if (revMin != null && (r == null || r < revMin)) return false
      if (revMax != null && (r == null || r > revMax)) return false
      const y = yearOf(g.pharma_intel?.patent_expiry)
      if (peMin != null && (y == null || y < peMin)) return false
      if (peMax != null && (y == null || y > peMax)) return false
      return true
    })
  }, [rows, tracks, risks, tg1, modality, au, ofiOnly, bd, rev, pe])

  const columns = useMemo(() => ALL_COLUMNS.filter(c => visKeys.has(c.key)), [visKeys])
  const { sorted, sort, toggle } = useSort(filtered, columns, { key: 'bd_score', dir: 'desc' })

  const toggleSetItem = (setter) => (val) =>
    setter(prev => { const n = new Set(prev); n.has(val) ? n.delete(val) : n.add(val); return n })
  const toggleTrack = toggleSetItem(setTracks)
  const toggleRisk = toggleSetItem(setRisks)
  const toggleCol = key => setVisKeys(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n })

  const reset = () => {
    setTracks(new Set()); setRisks(new Set()); setTg1(''); setModality(''); setAu('')
    setOfiOnly(false); setBd({ min: '', max: '' }); setRev({ min: '', max: '' }); setPe({ min: '', max: '' })
  }
  const exportCSV = () => downloadCSV(`engine1-explore-${sorted.length}.csv`, sorted, columns)

  if (error) return <div className="xp-empty">Couldn't reach the cross-reference source. Try again shortly.</div>
  if (!rows) return <div className="xp"><div className="xp-skel" /></div>

  return (
    <div className="xp">
      <div className="xp-toolbar">
        <div className="xp-field">
          <span className="xp-field-lab">Track</span>
          <div className="xp-chips">
            {TRACKS.map(t => (
              <button key={t} className={`xp-chip${tracks.has(t) ? ' on' : ''}`} onClick={() => toggleTrack(t)}>{t}</button>
            ))}
          </div>
        </div>
        <div className="xp-field">
          <span className="xp-field-lab">Ref-pricing risk</span>
          <div className="xp-chips">
            {RISKS.map(r => (
              <button key={r} className={`xp-chip${risks.has(r) ? ' on' : ''}`} onClick={() => toggleRisk(r)}>{r}</button>
            ))}
          </div>
        </div>
        <div className="xp-field">
          <span className="xp-field-lab">TG1 contains</span>
          <input className="xp-input" placeholder="e.g. oncology" value={tg1} onChange={e => setTg1(e.target.value)} style={{ width: 150 }} />
        </div>
        <div className="xp-field">
          <span className="xp-field-lab">Modality</span>
          <select className="xp-select" value={modality} onChange={e => setModality(e.target.value)}>
            <option value="">Any</option>
            {modalities.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="xp-field">
          <span className="xp-field-lab">AU restriction</span>
          <select className="xp-select" value={au} onChange={e => setAu(e.target.value)}>
            <option value="">Any</option>
            {auLevels.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="xp-field">
          <span className="xp-field-lab">BD score</span>
          <div className="xp-range">
            <input className="xp-input" type="number" placeholder="min" value={bd.min} onChange={e => setBd(s => ({ ...s, min: e.target.value }))} />
            <span>–</span>
            <input className="xp-input" type="number" placeholder="max" value={bd.max} onChange={e => setBd(s => ({ ...s, max: e.target.value }))} />
          </div>
        </div>
        <div className="xp-field">
          <span className="xp-field-lab">Revenue ($B)</span>
          <div className="xp-range">
            <input className="xp-input" type="number" placeholder="min" value={rev.min} onChange={e => setRev(s => ({ ...s, min: e.target.value }))} />
            <span>–</span>
            <input className="xp-input" type="number" placeholder="max" value={rev.max} onChange={e => setRev(s => ({ ...s, max: e.target.value }))} />
          </div>
        </div>
        <div className="xp-field">
          <span className="xp-field-lab">Patent expiry (yr)</span>
          <div className="xp-range">
            <input className="xp-input" type="number" placeholder="from" value={pe.min} onChange={e => setPe(s => ({ ...s, min: e.target.value }))} />
            <span>–</span>
            <input className="xp-input" type="number" placeholder="to" value={pe.max} onChange={e => setPe(s => ({ ...s, max: e.target.value }))} />
          </div>
        </div>
        <div className="xp-field">
          <span className="xp-field-lab">&nbsp;</span>
          <button className={`xp-toggle${ofiOnly ? ' on' : ''}`} onClick={() => setOfiOnly(v => !v)} aria-pressed={ofiOnly}>
            {ofiOnly && <span className="dot" />}OFI pending
          </button>
        </div>

        <div className="xp-actions">
          <button className="xp-btn" onClick={reset}>Reset</button>
          <div className="xp-colpick">
            <button className="xp-btn" onClick={() => setColMenu(o => !o)}>{IcCols} Columns</button>
            {colMenu && (
              <div className="xp-colpick-menu">
                {ALL_COLUMNS.map(c => (
                  <label key={c.key} className="xp-colpick-opt">
                    <input type="checkbox" checked={visKeys.has(c.key)} onChange={() => toggleCol(c.key)} />
                    {c.label}
                  </label>
                ))}
              </div>
            )}
          </div>
          <button className="xp-btn primary" onClick={exportCSV} disabled={!sorted.length}>{IcDownload} Export CSV</button>
        </div>
      </div>

      <p className="xp-count">
        <b>{sorted.length}</b> of <b>{rows.length}</b> gaps · click a row for full BD detail
      </p>

      {sorted.length === 0 ? (
        <div className="xp-empty">No gaps match these filters. <button className="xp-btn" onClick={reset} style={{ marginLeft: 8 }}>Reset</button></div>
      ) : (
        <ExploreTable
          columns={columns}
          rows={sorted}
          sort={sort}
          onToggleSort={toggle}
          onRowClick={openPanel}
          rowKey={g => g.name}
        />
      )}

      <BdDetailPanel
        gap={sel}
        open={panelOpen}
        onClose={closePanel}
        onSearch={() => { closePanel(); onNavigate?.({ tab: 'compare', q: sel?.name }) }}
        onMethodology={() => { closePanel(); onNavigate?.({ tab: 'methodology' }) }}
      />
    </div>
  )
}
