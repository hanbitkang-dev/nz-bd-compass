// AdminPage.jsx — NZ BD Compass · /admin (unlinked, direct-URL only).
// BD Priority Score configuration — rehosted from pharmac-tracker, which kept
// the score-config API + adminAuth. This static site calls that API cross-origin
// (API_BASE). Auth = shared password sent as the x-admin-password header (entered
// at runtime — never stored in the bundle). Internal operating tool, not a
// user-facing feature, so it is not in the nav. Reuses the teal/Hanken tokens.
import { useState, useEffect } from 'react'
import { API_BASE } from '../api.js'
import '../compass.css'

const WEIGHT_FIELDS = [
  { key: 'revenue',     label: 'Revenue Impact',  hint: 'Global sales scale' },
  { key: 'au_access',   label: 'AU Access Level',  hint: 'Australian PBS restriction level' },
  { key: 'ofi',         label: 'OFI Application',  hint: 'On the NZ OFI funding queue' },
  { key: 'patent',      label: 'Patent Timeline',  hint: 'Time to patent expiry' },
  { key: 'gap_density', label: 'Gap Density',      hint: 'Gaps in the same therapeutic area' },
]
const THRESHOLD_FIELDS = [
  { key: 'revenue_high_b',      label: 'Revenue High (B USD)' },
  { key: 'revenue_mid_b',       label: 'Revenue Mid (B USD)' },
  { key: 'revenue_low_b',       label: 'Revenue Low (B USD)' },
  { key: 'patent_urgent_years', label: 'Patent Urgent (years)' },
  { key: 'patent_near_years',   label: 'Patent Near (years)' },
  { key: 'patent_medium_years', label: 'Patent Medium (years)' },
]
const DEFAULT_CONFIG = {
  weights: { revenue: 30, au_access: 25, ofi: 20, patent: 15, gap_density: 10 },
  thresholds: {
    revenue_high_b: 10, revenue_mid_b: 5, revenue_low_b: 1,
    patent_urgent_years: 2, patent_near_years: 5, patent_medium_years: 10,
  },
}

const card = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24, boxShadow: 'var(--shadow-card)' }

export default function AdminPage() {
  const [pw, setPw]           = useState('')
  const [authed, setAuthed]   = useState(false)
  const [authErr, setAuthErr] = useState('')
  const [weights, setWeights] = useState(DEFAULT_CONFIG.weights)
  const [thresholds, setThresholds] = useState(DEFAULT_CONFIG.thresholds)
  const [meta, setMeta]       = useState({ last_modified: null })
  const [stats, setStats]     = useState(null)
  const [msg, setMsg]         = useState(null)   // { type:'ok'|'err', text }
  const [busy, setBusy]       = useState(false)

  const total = WEIGHT_FIELDS.reduce((s, f) => s + (Number(weights[f.key]) || 0), 0)
  const valid = total === 100

  // load current config + cache status (public GET, no auth)
  useEffect(() => {
    fetch(`${API_BASE}/api/cross-ref/score-config`).then(r => r.ok ? r.json() : null).then(c => {
      if (c?.weights) { setWeights(c.weights); setThresholds(c.thresholds); setMeta({ last_modified: c.last_modified }) }
    }).catch(() => {})
    fetch(`${API_BASE}/api/cross-ref/stats`).then(r => r.ok ? r.json() : null).then(s => s && setStats(s)).catch(() => {})
  }, [])

  async function verify() {
    setAuthErr(''); setBusy(true)
    try {
      // validate the password by attempting an (idempotent) save of the current config
      const r = await fetch(`${API_BASE}/api/cross-ref/score-config`, {
        method: 'PUT',
        headers: { 'x-admin-password': pw, 'Content-Type': 'application/json' },
        body: JSON.stringify({ weights, thresholds }),
      })
      if (r.ok) setAuthed(true)
      else setAuthErr('Incorrect password')
    } catch { setAuthErr('Network error') }
    finally { setBusy(false) }
  }

  async function save() {
    if (!valid) return
    setMsg(null); setBusy(true)
    try {
      const r = await fetch(`${API_BASE}/api/cross-ref/score-config`, {
        method: 'PUT',
        headers: { 'x-admin-password': pw, 'Content-Type': 'application/json' },
        body: JSON.stringify({ weights, thresholds }),
      })
      const data = await r.json().catch(() => ({}))
      if (r.ok) { setMsg({ type: 'ok', text: 'Saved. Scores recalculate on the next data refresh.' }); setMeta({ last_modified: data.config?.last_modified }) }
      else setMsg({ type: 'err', text: data.error || `Save failed (${r.status})` })
    } catch { setMsg({ type: 'err', text: 'Network error' }) }
    finally { setBusy(false) }
  }

  function resetDefault() {
    setWeights({ ...DEFAULT_CONFIG.weights })
    setThresholds({ ...DEFAULT_CONFIG.thresholds })
    setMsg(null)
  }

  // ── password gate ──
  if (!authed) {
    return (
      <div className="view-enter" style={{ maxWidth: 420, margin: '0 auto', padding: '0 22px' }}>
        <div style={{ padding: '80px 0' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.16em', color: 'var(--accent)', marginBottom: 14 }}>Admin · internal tool</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.025em', color: 'var(--text)', margin: '0 0 8px' }}>BD Score Configuration</h1>
          <p style={{ fontSize: 13.5, color: 'var(--text-dim)', margin: '0 0 20px', lineHeight: 1.55 }}>
            Tunes the Engine 1 (In-Licensing) BD Priority Score weights on the pharmac-tracker backend.
          </p>
          <div style={card}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-dim)' }}>Admin password</label>
            <input
              type="password" value={pw} autoFocus
              onChange={e => setPw(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && verify()}
              style={{ width: '100%', marginTop: 8, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-strong)', background: 'var(--surface-2)', color: 'var(--text)', fontFamily: 'inherit', fontSize: 14 }}
            />
            {authErr && <div style={{ color: 'var(--red)', fontSize: 12.5, marginTop: 8 }}>{authErr}</div>}
            <button onClick={verify} disabled={busy || !pw} style={{ width: '100%', marginTop: 14, padding: '10px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: busy || !pw ? 'default' : 'pointer', opacity: busy || !pw ? 0.6 : 1 }}>
              {busy ? 'Checking…' : 'Enter'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── config screen ──
  return (
    <div className="view-enter" style={{ maxWidth: 720, margin: '0 auto', padding: '0 22px' }}>
      <div style={{ padding: '40px 0 80px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.16em', color: 'var(--accent)', marginBottom: 10 }}>Admin · internal tool</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.025em', color: 'var(--text)', margin: '0 0 6px' }}>BD Priority Score Configuration</h1>
        <p style={{ fontSize: 14, color: 'var(--text-dim)', margin: '0 0 24px' }}>Adjust weights to match your BD priorities. Total must equal 100.</p>

        {/* weights */}
        <div style={{ ...card, marginBottom: 18 }}>
          {WEIGHT_FIELDS.map(f => (
            <div key={f.key} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>{f.label} <span style={{ color: 'var(--text-mute)', fontWeight: 400, fontSize: 12 }}>· {f.hint}</span></span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>{weights[f.key] ?? 0}</span>
              </div>
              <input type="range" min="0" max="100" value={weights[f.key] ?? 0}
                onChange={e => setWeights({ ...weights, [f.key]: Number(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--accent)' }} />
            </div>
          ))}
          <div style={{ marginTop: 8, paddingTop: 12, borderTop: '1px solid var(--border)', fontSize: 14, fontWeight: 700, color: valid ? 'var(--green)' : 'var(--red)' }}>
            {valid ? 'Total: 100 ✓' : `Total: ${total} — must equal 100`}
          </div>
        </div>

        {/* thresholds */}
        <div style={{ ...card, marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>Thresholds</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {THRESHOLD_FIELDS.map(f => (
              <label key={f.key} style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>
                {f.label}
                <input type="number" value={thresholds[f.key] ?? 0}
                  onChange={e => setThresholds({ ...thresholds, [f.key]: Number(e.target.value) })}
                  style={{ width: '100%', marginTop: 4, padding: '7px 10px', borderRadius: 7, border: '1px solid var(--border-strong)', background: 'var(--surface-2)', color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: 13 }} />
              </label>
            ))}
          </div>
        </div>

        {/* actions */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={save} disabled={!valid || busy} style={{ padding: '10px 18px', borderRadius: 8, border: 'none', background: valid ? 'var(--accent)' : 'var(--border-strong)', color: '#fff', fontWeight: 700, fontSize: 13.5, cursor: valid && !busy ? 'pointer' : 'default', opacity: busy ? 0.6 : 1 }}>
            {busy ? 'Saving…' : 'Save Configuration'}
          </button>
          <button onClick={resetDefault} style={{ padding: '10px 18px', borderRadius: 8, border: '1px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--text)', fontWeight: 600, fontSize: 13.5, cursor: 'pointer' }}>
            Reset to Default
          </button>
          {msg && <span style={{ fontSize: 12.5, fontWeight: 600, color: msg.type === 'ok' ? 'var(--green)' : 'var(--red)' }}>{msg.text}</span>}
        </div>

        {/* preview */}
        <div style={{ ...card, marginTop: 24, background: 'var(--surface-2)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-mute)', marginBottom: 10 }}>Current settings</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 12.5, color: 'var(--text-dim)', lineHeight: 1.7 }}>
            {WEIGHT_FIELDS.map(f => <div key={f.key}>{f.label}: <b style={{ color: 'var(--text)' }}>{weights[f.key]}</b></div>)}
            <div style={{ marginTop: 8, color: 'var(--text-mute)' }}>last modified: {meta.last_modified || '—'}</div>
            <div style={{ color: 'var(--text-mute)' }}>
              pharma-intel cache: {stats ? `${stats.cache_drug_count} drugs / last updated: ${stats.cache_last_updated || '—'}` : '…'}
            </div>
            {stats && <div style={{ color: 'var(--text-mute)' }}>gap match: {stats.gap_matched}/{stats.gap_total} ({stats.match_rate})</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
