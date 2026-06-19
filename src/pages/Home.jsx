import { useNavigate } from 'react-router-dom'
import '../compass.css'

const IcHorizon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 16h18"/><path d="m7 16 3-5 3 3 4-7"/>
    <circle cx="20" cy="7" r="1.4" fill="currentColor" stroke="none"/>
  </svg>
)
const IcClock = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>
  </svg>
)
const IcArrow = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14m-6-6 6 6-6 6"/>
  </svg>
)

const COMPARE = [
  {
    q: 'The question',
    il: 'What should NZ add to the Schedule?',
    tc: 'What sole-supply contract can a local maker contest?',
  },
  {
    q: 'Opportunity type',
    il: 'Bring a new medicine in from AU',
    tc: 'Contest a supply slot at re-tender',
  },
  {
    q: 'Time horizon',
    il: 'Mid-to-long — pipeline planning',
    tc: 'Short — exclusivity clock already running',
  },
  {
    q: 'Data source',
    il: 'AU PBS × PHARMAC Schedule gap analysis',
    tc: 'PHARMAC PSS sole-supply contracts',
  },
  {
    q: 'Risk character',
    il: 'Market &amp; clinical development risk',
    tc: 'Timing risk — expiry date ≠ re-tender date',
  },
  {
    q: 'When to move',
    il: 'While shaping a 3–5 year portfolio',
    tc: 'Inside your dossier lead time (≥17 months for 2028)',
  },
]

function ReduceLadder({ rows, cuts, tone }) {
  const combined = []
  rows.forEach((r, i) => {
    combined.push({ type: 'row', ...r })
    if (cuts[i]) combined.push({ type: 'cut', ...cuts[i] })
  })
  return (
    <div className="cmp-redux">
      {combined.map((item, i) =>
        item.type === 'cut' ? (
          <div key={i} className="cmp-redux-cut">
            <span className="cmp-redux-cut-n">−{item.n}</span>
            <span>{item.label}</span>
          </div>
        ) : (
          <div key={i} className="cmp-redux-row">
            <div className="cmp-redux-n">{item.n}</div>
            <div className="cmp-redux-meta">
              <div className="cmp-redux-label">{item.label}</div>
              {item.sub && <div className="cmp-redux-sub">{item.sub}</div>}
              <div className="cmp-redux-bar-wrap">
                {item.tracks ? (
                  <div className="cmp-redux-bar tracks" style={{ width: `${item.pct}%` }}>
                    <div className="t-a" style={{ flex: item.tracks.a }} />
                    <div className="t-b" style={{ flex: item.tracks.b }} />
                    <div className="t-c" style={{ flex: item.tracks.c }} />
                  </div>
                ) : (
                  <div className="cmp-redux-bar" style={{ width: `${item.pct}%` }} />
                )}
              </div>
            </div>
          </div>
        )
      )}
    </div>
  )
}

function EngineCard({ which, navigate }) {
  const il = which === 'il'
  const path = il ? '/in-licensing' : '/tender-clock'

  return (
    <div className={`cmp-engine ${which}`} onClick={() => navigate(path)} role="button" tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') navigate(path) }}>
      <div>
        <div className="cmp-engine-motif">{il ? IcHorizon : IcClock}</div>
      </div>

      {il ? (
        <>
          <div>
            <div className="cmp-engine-q">Engine 01 · In-Licensing Gaps</div>
            <div className="cmp-engine-headline">
              <span className="n">523</span> funding gaps
            </div>
            <div className="cmp-engine-chips">
              <span className="cmp-engine-chip">130 BD-scored (Track A)</span>
              <span className="cmp-engine-chip">12 biologics (Track B)</span>
              <span className="cmp-engine-chip">197 local generics (Track C)</span>
            </div>
          </div>

          <div className="cmp-engine-ladder">
            <ReduceLadder
              tone="il"
              rows={[
                { n: 523, label: 'Total AU gaps', sub: 'Medicines on the PBS, not on the PHARMAC Schedule', pct: 100 },
                { n: 339, label: '3-track sorted', sub: 'A (130) · B (12) · C (197)', pct: 65,
                  tracks: { a: 130, b: 12, c: 197 } },
              ]}
              cuts={[
                { n: 184, label: 'extemp, device, no ATC code — named but not BD-classified' },
                null,
              ]}
            />
          </div>
        </>
      ) : (
        <>
          <div>
            <div className="cmp-engine-q">Engine 02 · Tender Clock</div>
            <div className="cmp-engine-headline">
              <span className="n">93</span> white-space slots
            </div>
            <div className="cmp-engine-chips">
              <span className="cmp-engine-chip">2028 cohort · 34 targets</span>
              <span className="cmp-engine-chip">2027 cohort · 58 targets</span>
              <span className="cmp-engine-chip gray">94% supplier-confirmed (2028)</span>
            </div>
          </div>

          <div className="cmp-engine-ladder">
            <ReduceLadder
              tone="tc"
              rows={[
                { n: 195, label: 'Sole-supply contracts', sub: 'PSS chemicals — one funded brand', pct: 100 },
                { n: 139, label: 'After filter', sub: 'Small-molecule + complex · local brands removed', pct: 71 },
                { n: 93,  label: 'White-space', sub: 'Competitor-held + opaque, all expiry years', pct: 48 },
              ]}
              cuts={[
                { n: 56, label: 'vaccines, biologics, devices + ANZ-local brands' },
                { n: 46, label: 'already held by an ANZ-local manufacturer' },
                null,
              ]}
            />
          </div>
        </>
      )}

      <button className="cmp-engine-cta">
        Open engine {IcArrow}
      </button>
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="cmp-home view-enter">

      {/* ── Hero ── */}
      <section className="cmp-hero">
        <div className="cmp-hero-inner">
          <div className="an-eyebrow">NZ BD Compass</div>
          <h1 className="cmp-hero-title">
            One market.<br />
            Two kinds of <em>opening</em>.
          </h1>
          <p className="cmp-hero-sub">
            <b>In-Licensing:</b> 523 medicines Australia funds that NZ doesn't — BD-scored on
            global revenue, patent runway, AU access, and OFI momentum.
            <br /><br />
            <b>Tender Clock:</b> 93 sole-supply contracts whose exclusivity lock is about to lift
            — mapped to the ITT calendar with WS1 supplier intelligence.
          </p>
          <div className="cmp-hero-jump">
            <button className="cmp-hero-btn il" onClick={() => navigate('/in-licensing')}>
              {IcHorizon} In-Licensing Gaps
            </button>
            <button className="cmp-hero-btn tc" onClick={() => navigate('/tender-clock')}>
              {IcClock} Tender Clock
            </button>
          </div>
        </div>
      </section>

      {/* ── Engine cards ── */}
      <section className="cmp-engines">
        <EngineCard which="il" navigate={navigate} />
        <EngineCard which="tc" navigate={navigate} />
      </section>

      {/* ── Comparison table ── */}
      <section className="cmp-compare">
        <div className="cmp-compare-head">
          <div>
            <div className="an-eyebrow">Side by side</div>
            <div className="cmp-compare-title">Which engine fits your question?</div>
            <div className="cmp-compare-sub">
              Both engines draw from verified public sources. Use the one that matches your timeline.
            </div>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="cmp-compare-table">
            <thead>
              <tr>
                <th></th>
                <th className="h-il">In-Licensing Gaps · Engine 01</th>
                <th className="h-tc">Tender Clock · Engine 02</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE.map(row => (
                <tr key={row.q}>
                  <td>{row.q}</td>
                  <td dangerouslySetInnerHTML={{ __html: row.il }} />
                  <td dangerouslySetInnerHTML={{ __html: row.tc }} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── We show our work ── */}
      <section className="cmp-honesty">
        <div className="cmp-honesty-head">
          <div className="an-eyebrow">We show our work</div>
          <div className="cmp-honesty-title">Every number comes with its reduction ladder.</div>
          <div className="cmp-honesty-sub">
            No headline figure is presented without showing what was removed and why.
            The total always closes — and the caveat is always shown.
          </div>
        </div>

        <div className="cmp-honesty-grid">
          {/* Engine 1 honesty card */}
          <div className="cmp-hon-card il">
            <div className="cmp-hon-card-head">
              <div className="cmp-hon-card-ic">{IcHorizon}</div>
              <div>
                <div className="cmp-hon-card-kicker">Engine 01 · In-Licensing</div>
                <div className="cmp-hon-card-title">523 → 339 → 3 tracks</div>
              </div>
            </div>
            <div className="cmp-redux-sm">
              <ReduceLadder
                tone="il"
                rows={[
                  { n: 523, label: 'Total AU-funded gaps', pct: 100 },
                  { n: 339, label: '3-track sorted', sub: 'A 130 · B 12 · C 197', pct: 65,
                    tracks: { a: 130, b: 12, c: 197 } },
                ]}
                cuts={[
                  { n: 184, label: 'extemp, devices, no ATC code' },
                  null,
                ]}
              />
            </div>
            <p className="cmp-hon-note">
              Track C (197 local generics) carries no global revenue or patent data —
              classified by ATC class and dosage form alone. This caveat is always shown in the UI.
            </p>
          </div>

          {/* Engine 2 honesty card */}
          <div className="cmp-hon-card tc">
            <div className="cmp-hon-card-head">
              <div className="cmp-hon-card-ic">{IcClock}</div>
              <div>
                <div className="cmp-hon-card-kicker">Engine 02 · Tender Clock</div>
                <div className="cmp-hon-card-title">195 → 139 → 93 white-space</div>
              </div>
            </div>
            <div className="cmp-redux-sm">
              <ReduceLadder
                tone="tc"
                rows={[
                  { n: 195, label: 'Sole-supply contracts', pct: 100 },
                  { n: 139, label: 'After filter', pct: 71 },
                  { n: 93,  label: 'White-space', sub: 'Competitor + opaque, all years', pct: 48 },
                ]}
                cuts={[
                  { n: 56, label: 'vaccines, biologics, devices + ANZ-local brands' },
                  { n: 46, label: 'already held by ANZ-local manufacturer' },
                  null,
                ]}
              />
            </div>
            <p className="cmp-hon-note">
              94% of the 2028 cohort supplier-confirmed (32/34) via WS1 notifications.
              Opaque rows are counted as white-space and flagged — never silently excluded.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
