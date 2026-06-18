// InLicensingTracks.jsx — NZ BD Compass · /in-licensing
// Classifies the 523 AU-funded gaps into three in-licensing tracks by data
// availability and commercial profile. Calls pharmac-tracker API.
import '../in-licensing-tracks.css'
import { useEndpoint, API_BASE } from '../api.js'

const TRACK_META = {
  A: {
    cls: 'a',
    label: 'Track A',
    name: 'Global small-molecule',
    countSub: 'BD-scored gaps',
    scored: true,
    signals: ['Global revenue', 'Patent expiry', 'AU access level', 'OFI momentum'],
  },
  B: {
    cls: 'b',
    label: 'Track B',
    name: 'Global biologic / antibody',
    countSub: 'BD-scored gaps',
    scored: true,
    riskNote: 'Single-brand switch candidates — high risk, high return.',
    signals: ['Global revenue', 'Patent expiry', 'AU access level', 'OFI momentum'],
  },
  C: {
    cls: 'c',
    label: 'Track C',
    name: 'Local generic (off-patent)',
    countSub: 'local generic opportunities',
    scored: false,
    caveatNote: 'No global revenue or patent data — unmatched to the pharma-intel originator DB. Scored on AU listing, ATC class, and dosage form only.',
    signals: ['AU PBS listing', 'ATC class', 'Dosage form'],
  },
}

const AlertIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
    <path d="M12 9v4M12 17h.01" />
  </svg>
)

function TrackCard({ id, track }) {
  const meta = TRACK_META[id]
  if (!meta) return null
  const count = track?.count ?? 0
  const complexNote = track?.complex_excluded != null
    ? ` · ${track.complex_excluded} complex-form flagged`
    : ''

  return (
    <div className={`ilt-card ${meta.cls}`}>
      <div className="ilt-track-id">{meta.label}</div>
      <div className="ilt-name">{meta.name}</div>

      <div className="ilt-count">{count}</div>
      <div className="ilt-count-sub">{meta.countSub}{complexNote}</div>

      <div className="ilt-divider" />

      <div className="ilt-badge-row">
        {meta.scored
          ? <span className="ilt-chip scored">BD-scored</span>
          : <span className="ilt-chip unscored">Not BD-scored</span>}
        {id === 'B' && <span className="ilt-chip risk">High risk / return</span>}
      </div>

      <div className="ilt-signals">
        {meta.signals.map(sig => (
          <div key={sig} className="ilt-signal-row">
            <span className={`ilt-dot${meta.scored ? '' : ' off'}`} />
            {sig}
          </div>
        ))}
      </div>

      {meta.riskNote && (
        <div className="ilt-note warn">{meta.riskNote}</div>
      )}
      {meta.caveatNote && (
        <div className="ilt-note">{meta.caveatNote}</div>
      )}
    </div>
  )
}

export default function InLicensingTracks() {
  const [{ loading, error, data }, retry] = useEndpoint(`${API_BASE}/api/cross-ref/tracks`)

  const e1 = data?.engine1 || {}
  const total = data?.total ?? 0
  const matchedAB = (e1.A?.count ?? 0) + (e1.B?.count ?? 0)
  const matchedOther = data?.matched_other_modality ?? 0
  const matchedTotal = matchedAB + matchedOther
  const ub = data?.unmatched_breakdown || {}
  const unmatched_medicine = ub.medicine ?? 0
  const excluded = (ub.extemp || 0) + (ub.device || 0) + (ub.other || 0) + (ub.no_atc || 0)

  return (
    <section className="an-section">
      <div className="an-sec-head">
        <div className="an-eyebrow">In-licensing tracks</div>
        <h2>Three paths to NZ market access</h2>
        <p>
          {total || 'These'} AU-funded medicines are not yet on the PHARMAC Schedule —
          classified into three in-licensing tracks by data availability and commercial profile.
        </p>
      </div>

      {loading && (
        <div className="ilt-skel-grid">
          {[0, 1, 2].map(i => (
            <div key={i} className="an-skel" style={{ height: 230, borderRadius: 12 }} />
          ))}
        </div>
      )}

      {error && (
        <div className="an-error">
          <div className="er-icon"><AlertIcon /></div>
          <div className="er-title">Data unavailable</div>
          <div className="er-sub">Couldn't reach the tracks endpoint — try again in a moment.</div>
          <button className="er-retry" onClick={retry}>Retry</button>
        </div>
      )}

      {!loading && !error && data && (
        <>
          <div className="ilt-meta-strip">
            <div className="ilt-meta-item">
              <span className="ilt-meta-val">{total}</span>
              <span>total AU gaps</span>
            </div>
            <div className="ilt-meta-item">
              <span className="ilt-meta-val">{matchedTotal}</span>
              <span>pharma-intel matched (A+B{matchedOther > 0 ? `+${matchedOther}` : ''})</span>
            </div>
            <div className="ilt-meta-item">
              <span className="ilt-meta-val">{unmatched_medicine}</span>
              <span>unmatched medicine (Track C: {e1.C?.count ?? 0} simple · {e1.C?.complex_excluded ?? 0} complex)</span>
            </div>
            {excluded > 0 && (
              <div className="ilt-meta-item">
                <span className="ilt-meta-val">{excluded}</span>
                <span>extemp / device / other (excluded)</span>
              </div>
            )}
          </div>

          <div className="ilt-grid">
            {['A', 'B', 'C'].map(k => (
              <TrackCard key={k} id={k} track={e1[k]} />
            ))}
          </div>

          {data.caveats?.length > 0 && (
            <div className="ilt-caveats">
              {data.caveats.map((c, i) => <span key={i}>· {c}</span>)}
            </div>
          )}
        </>
      )}
    </section>
  )
}
