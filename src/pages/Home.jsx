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
          {/* Engine 1 honesty card — headline reduction only; full breakdown lives in Methodology */}
          <div className="cmp-hon-card il">
            <div className="cmp-hon-card-head">
              <div className="cmp-hon-card-ic">{IcHorizon}</div>
              <div>
                <div className="cmp-hon-card-kicker">Engine 01 · In-Licensing</div>
                <div className="cmp-hon-card-title">523 → 339 classified → 3 tracks</div>
              </div>
            </div>
            <p className="cmp-hon-note">
              Track C (197 local generics) carries no global revenue or patent data —
              classified by ATC class and dosage form alone. This caveat is always shown in the UI.
            </p>
          </div>

          {/* Engine 2 honesty card — 2028 cohort, the actionable window. The all-years
              139 → 93 @ 52% reduction is kept as secondary context in Methodology. */}
          <div className="cmp-hon-card tc">
            <div className="cmp-hon-card-head">
              <div className="cmp-hon-card-ic">{IcClock}</div>
              <div>
                <div className="cmp-hon-card-kicker">Engine 02 · Tender Clock · 2028 cohort</div>
                <div className="cmp-hon-card-title">195 → 46 → 34 → 8 white-space</div>
              </div>
            </div>
            <p className="cmp-hon-note">
              The 2028 cohort is the only window with enough runway to start a new dossier now: 8 white-space
              slots (6 competitor-held + 2 opaque) at 94% supplier coverage (32/34). Opaque rows are counted as
              white-space and flagged — never silently excluded.
            </p>
          </div>
        </div>

        <button className="cmp-honesty-link" onClick={() => navigate('/methodology#reduction-ladder')}>
          How were these numbers derived? {IcArrow}
        </button>
      </section>
    </div>
  )
}
