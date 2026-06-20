// Methodology.jsx - NZ BD Compass - Methodology.
// "We show our work." Traces every headline back to its public source, shows how
// the numbers reduce (cuts named, not hidden), explains the in-product honesty
// devices, and states the limits plainly. Teal = Engine 1, amber = Engine 2.
// CD design integration, ported from the UMD/Babel handoff to Vite/ESM.
// All figures are static and verified against the live API (see commit notes).
import { useEffect } from 'react'
import '../compass.css'
import '../methodology.css'

/* icons */
const I = {
  horizon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 16h18"/><path d="m7 16 3-5 3 3 4-7"/><circle cx="20" cy="7" r="1.4" fill="currentColor" stroke="none"/></svg>,
  clock: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>,
  warn: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 2 20h20L12 3z"/><path d="M12 10v4M12 17.5v.5"/></svg>,
  info: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.5"/></svg>,
  trace: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4v16M4 8h11l-2.5-2.5M4 8l11 0 -2.5 2.5"/><circle cx="19" cy="18" r="2"/><path d="M4 18h13"/></svg>,
  scale: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v18M5 7h14M5 7l-3 6a3 3 0 0 0 6 0l-3-6zM19 7l-3 6a3 3 0 0 0 6 0l-3-6z"/></svg>,
  eye: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12z"/><circle cx="12" cy="12" r="3"/></svg>,
  compass: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5 5-2z" fill="currentColor" stroke="none"/></svg>,
  lock: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>,
  github: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49 0-.24-.01-.88-.01-1.73-2.78.62-3.37-1.37-3.37-1.37-.46-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.36-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.27 2.75 1.05a9.36 9.36 0 0 1 5 0c1.91-1.32 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.48-.01 2.82 0 .27.18.6.69.49A10.03 10.03 0 0 0 22 12.25C22 6.58 17.52 2 12 2z"/></svg>,
}

/* reused motifs (compact) */
function HorizonMotif() {
  return (
    <svg className="cmp-motif" viewBox="0 0 240 70" fill="none" aria-hidden="true">
      <line x1="0" y1="56" x2="240" y2="56" stroke="var(--border-strong)" strokeWidth="1.5" />
      {[40, 90, 140, 190].map((x) => <line key={x} x1={x} y1="52" x2={x} y2="60" stroke="var(--border-strong)" strokeWidth="1.5" />)}
      <path d="M6 50 L52 42 L96 44 L140 28 L188 22 L232 12" stroke="var(--accent)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="232" cy="12" r="5" fill="var(--accent)" />
      <circle cx="232" cy="12" r="10" fill="none" stroke="var(--accent)" strokeWidth="1.4" opacity="0.4" />
    </svg>
  )
}
function ClockMotif() {
  return (
    <svg className="cmp-motif" viewBox="0 0 240 70" fill="none" aria-hidden="true">
      <line x1="0" y1="56" x2="240" y2="56" stroke="var(--border-strong)" strokeWidth="1.5" />
      {[40, 90, 140, 190].map((x) => <line key={x} x1={x} y1="52" x2={x} y2="60" stroke="var(--border-strong)" strokeWidth="1.5" />)}
      <line x1="18" y1="18" x2="18" y2="62" stroke="var(--amber)" strokeWidth="2" strokeDasharray="3 3" opacity="0.8" />
      <rect x="18" y="38" width="150" height="13" rx="6.5" fill="var(--amber-soft)" stroke="var(--amber)" strokeWidth="1.4" />
      <text x="93" y="47.5" className="cmp-motif-run" textAnchor="middle">runway</text>
      <line x1="168" y1="18" x2="168" y2="62" stroke="var(--amber)" strokeWidth="2.4" />
      <path d="M168 18 l-5 5 m5 -5 l5 5" stroke="var(--amber)" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}

function Head({ eyebrow, amber, title, sub }) {
  return (
    <div className="mth-head">
      <span className={'mth-eyebrow' + (amber ? ' amber' : '')}>{eyebrow}</span>
      <h2 className="mth-title">{title}</h2>
      {sub && <p className="mth-sub">{sub}</p>}
    </div>
  )
}

export default function Methodology() {
  // Land on the right section when arrived at via /methodology#reduction-ladder
  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (!hash) return
    const el = document.getElementById(hash)
    if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60)
  }, [])

  return (
    <div className="view-enter mth">

      {/* Hero */}
      <section className="mth-hero">
        <div className="mth-hero-inner">
          <span className="mth-hero-eyebrow"><span className="dot" />Methodology · how the compass is built</span>
          <h1 className="mth-hero-title">We show our work.</h1>
          <p className="mth-hero-lede">
            Every headline in NZ BD Compass traces back to a public source, and to the exact cuts that took it
            from a raw count to a defensible one. Where a number shrinks, <b>we name what we set aside</b>. Where
            the data runs out, we say so — rather than estimate past it.
          </p>
          <div className="mth-hero-chips">
            <span className="mth-hero-chip">{I.trace}Public sources only</span>
            <span className="mth-hero-chip">{I.scale}Σ buckets = total</span>
            <span className="mth-hero-chip amber">{I.eye}Caveats beside the answer</span>
          </div>
        </div>
      </section>

      <div className="mth-body">

        {/* §1 - Two engines, where the data comes from */}
        <section className="mth-section">
          <Head
            eyebrow="Two engines · one compass"
            title="Different sources, different clocks — pointed at one market."
            sub={<>The compass runs two independent analyses over public PHARMAC and PBS data. Each reads its own sources; neither shares a number with the other. Here's what feeds each one.</>}
          />
          <div className="mth-prov">
            {/* Engine 1 */}
            <article className="mth-prov-card il">
              <div className="mth-prov-head">
                <span className="mth-prov-tag"><span className="mth-prov-ic">{I.horizon}</span>Engine 01 · In-Licensing Gaps</span>
                <p className="mth-prov-q">What does Australia fund that New Zealand doesn't — yet?</p>
              </div>
              <div className="mth-prov-motif"><HorizonMotif /></div>
              <div className="mth-prov-srclab">Sources</div>
              <ul className="mth-src">
                <li>
                  <div>
                    <div className="mth-src-name">PHARMAC Schedule · <code>CPSReporting.xlsx</code></div>
                    <div className="mth-src-desc">The funded baseline — what NZ already pays for. Direct parse, no manual step.</div>
                  </div>
                  <div className="mth-src-meta"><b>XLSX</b>weekly</div>
                </li>
                <li>
                  <div>
                    <div className="mth-src-name">Australian PBS</div>
                    <div className="mth-src-desc">The comparison shelf — what a near-peer system funds that NZ doesn't.</div>
                  </div>
                  <div className="mth-src-meta"><b>Public</b>monthly</div>
                </li>
                <li>
                  <div>
                    <div className="mth-src-name">pharma-intel link</div>
                    <div className="mth-src-desc">Revenue band, patent horizon &amp; modality — joined in to score the matched gaps.</div>
                  </div>
                  <div className="mth-src-meta"><b>Joined</b>on match</div>
                </li>
              </ul>
            </article>
            {/* Engine 2 */}
            <article className="mth-prov-card tc">
              <div className="mth-prov-head">
                <span className="mth-prov-tag"><span className="mth-prov-ic">{I.clock}</span>Engine 02 · Tender Clock</span>
                <p className="mth-prov-q">What's locked under sole supply now, but opening at re-tender?</p>
              </div>
              <div className="mth-prov-motif"><ClockMotif /></div>
              <div className="mth-prov-srclab">Sources</div>
              <ul className="mth-src">
                <li>
                  <div>
                    <div className="mth-src-name">PHARMAC tender notifications</div>
                    <div className="mth-src-desc">The expiry clock — sole-supply award &amp; end dates, parsed from the public notice HTML.</div>
                  </div>
                  <div className="mth-src-meta"><b>HTML</b>on notice</div>
                </li>
                <li>
                  <div>
                    <div className="mth-src-name">PHARMAC Schedule · <code>CPSReporting.xlsx</code></div>
                    <div className="mth-src-desc">Funded status &amp; supplier of record — confirms a contract is live and who holds it.</div>
                  </div>
                  <div className="mth-src-meta"><b>XLSX</b>weekly</div>
                </li>
              </ul>
            </article>
          </div>
        </section>

        <div className="mth-rule" />

        {/* §2 - Engine 1 reduction + two axes (Home links here) */}
        <section className="mth-section" id="reduction-ladder" style={{ scrollMarginTop: '80px' }}>
          <Head
            eyebrow="Engine 01 · the reduction"
            title="How 523 funding gaps become 3 in-licensing tracks."
            sub={<>523 medicines sit on the Australian PBS but not on the PHARMAC Schedule. That total splits <b>two different ways</b> depending on the question you're asking — and the two splits don't reconcile, by design.</>}
          />

          {/* two-axes diagram */}
          <div className="mth-axes">
            <div className="mth-axes-total">
              <b className="mono">523</b>
              <span>funding gaps · medicines on the AU PBS, not on the PHARMAC&nbsp;Schedule</span>
            </div>

            <div style={{ position: 'relative' }}>
              <div className="mth-axes-bridge" style={{ left: '27.72%', width: '37.67%', top: '26px', bottom: '0' }}>
                <span className="mth-axes-bridge-lab">shared by both views</span>
              </div>

              {/* Axis A - by scope */}
              <div className="mth-axis">
                <div className="mth-axis-lab">By scope <span className="q">— how far could we analyse it?</span></div>
                <div className="mth-bar">
                  <div className="mth-seg matched" style={{ width: '27.72%' }}><span className="sn">145</span><span className="sl">matched to AU</span></div>
                  <div className="mth-seg trackC" style={{ width: '37.67%' }}><span className="sn">197</span><span className="sl">Track C · local generics</span></div>
                  <div className="mth-seg oos" style={{ width: '34.61%' }}><span className="sn">181</span><span className="sl">out of scope</span></div>
                </div>
              </div>

              {/* Axis B - by track */}
              <div className="mth-axis">
                <div className="mth-axis-lab">By in-licensing track <span className="q">— what kind of play is it?</span></div>
                <div className="mth-bar">
                  <div className="mth-seg trackA" style={{ width: '24.86%' }}><span className="sn">130</span><span className="sl">Track A</span></div>
                  <div className="mth-seg trackB" style={{ width: '2.29%' }}><span className="sn">12</span><span className="sl">B</span></div>
                  <div className="mth-seg other" style={{ width: '0.57%' }}><span className="sn">3</span><span className="sl"></span></div>
                  <div className="mth-seg trackC" style={{ width: '37.67%' }}><span className="sn">197</span><span className="sl">Track C</span></div>
                  <div className="mth-seg oos" style={{ width: '34.61%' }}><span className="sn">181</span><span className="sl">no track</span></div>
                </div>
              </div>
            </div>

            <div className="mth-axes-eq">
              <div className="mth-eq">
                <span className="mth-eq-math">145 + 197 + 181 <span className="ok">= 523</span></span>
                <span className="mth-eq-cap">By scope · matched + Track C + out-of-scope</span>
              </div>
              <div className="mth-eq">
                <span className="mth-eq-math">130 + 12 + 197 <span className="ok">= 339</span></span>
                <span className="mth-eq-cap">By track · A + B + C, the classified universe</span>
              </div>
            </div>

            <div className="mth-axes-warn">
              {I.warn}
              <p>
                Both totals are correct. They count along <b>different axes</b>, so we never add a number from one
                to a number from the other: <span className="no">145 + 339</span> is meaningless. The only bucket
                the two views share is <b>Track C (197)</b> — local generics that exist on the PBS but never
                matched a global record. The matched&nbsp;145 also carries 3 lines that fall in no track at all.
              </p>
            </div>
          </div>

          {/* the three tracks */}
          <div className="mth-ladder-grid" style={{ marginTop: 22 }}>
            <div className="mth-ladder il">
              <div className="mth-ladder-head">
                <span className="mth-ladder-ic">{I.horizon}</span>
                <span className="mth-ladder-ttl">The three tracks <span>· 339 classified gaps</span></span>
              </div>
              <div className="cmp-redux">
                <div className="cmp-redux-row"><span className="cmp-redux-n mono">130</span><span className="cmp-redux-bar" style={{ width: '67%' }} /><span className="cmp-redux-l"><b>Track A</b> — matched, global revenue + patent data present</span></div>
                <div className="cmp-redux-row"><span className="cmp-redux-n mono">12</span><span className="cmp-redux-bar" style={{ width: '8%' }} /><span className="cmp-redux-l"><b>Track B</b> — matched, partial data</span></div>
                <div className="cmp-redux-row end"><span className="cmp-redux-n mono">197</span><span className="cmp-redux-bar" style={{ width: '100%' }} /><span className="cmp-redux-l"><b>Track C</b> — unmatched local generics, classified from ATC + dosage form alone</span></div>
              </div>
              <p className="mth-ladder-note">{I.warn}<span>Track C carries <b>no global data and no BD Score</b> — we classify it, but we don't rank it. Saying so is the honest move; implying a priority we can't compute is not.</span></p>
            </div>
          </div>
        </section>

        <div className="mth-rule" />

        {/* §3 - Engine 2 reduction + coverage */}
        <section className="mth-section">
          <Head
            eyebrow="Engine 02 · the reduction"
            amber
            title="How 195 sole-supply contracts narrow to 8 white-space slots."
            sub={<>One axis, four honest cuts. Each step is a filter you can name — expiry window, manufacturability, who already holds supply — not a black box. (Shown for the 2028 cohort, the one with near-complete supplier mapping.)</>}
          />
          <div className="mth-ladder tc">
            <div className="mth-ladder-head">
              <span className="mth-ladder-ic">{I.clock}</span>
              <span className="mth-ladder-ttl">195 → 8 <span>· the 2028 cohort</span></span>
            </div>
            <div className="cmp-redux">
              <div className="cmp-redux-row"><span className="cmp-redux-n mono">195</span><span className="cmp-redux-bar tc" style={{ width: '100%' }} /><span className="cmp-redux-l">sole-supply contracts — the core universe</span></div>
              <div className="cmp-redux-cut">cut to the cohort whose exclusivity lifts in the 2028 window</div>
              <div className="cmp-redux-row"><span className="cmp-redux-n mono">46</span><span className="cmp-redux-bar tc" style={{ width: '24%' }} /><span className="cmp-redux-l">expiring in the 2028 cohort</span></div>
              <div className="cmp-redux-cut">drop lines that aren't realistically manufacturable / on-portfolio</div>
              <div className="cmp-redux-row"><span className="cmp-redux-n mono">34</span><span className="cmp-redux-bar tc" style={{ width: '17%' }} /><span className="cmp-redux-l">manufacturable &amp; on-portfolio</span></div>
              <div className="cmp-redux-cut">map who already holds supply — keep only genuine openings</div>
              <div className="cmp-redux-row end"><span className="cmp-redux-n mono">8</span><span className="cmp-redux-bar tc" style={{ width: '9%' }} /><span className="cmp-redux-l">white-space · <b>6 competitor-held + 2 opaque</b></span></div>
            </div>

            <div className="mth-cov">
              <div className="mth-cov-row">
                <span className="mth-cov-lab">2028 cohort coverage</span>
                <span className="mth-cov-track"><span className="mth-cov-fill" style={{ width: '94%' }} /></span>
                <span className="mth-cov-val">94% <small>· 32/34</small></span>
              </div>
              <div className="mth-cov-row">
                <span className="mth-cov-lab">All years coverage</span>
                <span className="mth-cov-track"><span className="mth-cov-fill" style={{ width: '52%', opacity: 0.55 }} /></span>
                <span className="mth-cov-val">52% <small>· white-space 93</small></span>
              </div>
            </div>

            <p className="mth-ladder-note">{I.info}<span>We headline the <b>2028 cohort</b> because its supplier mapping is 94% complete. Across <b>all years</b> the same method yields 93 white-space slots at only 52% coverage — a bigger number we trust less, shown here rather than buried. The 2 opaque rows are carried as white-space and flagged unverified, never as padding.</span></p>
          </div>
        </section>

        <div className="mth-rule" />

        {/* §4 - Honesty devices (in-product) */}
        <section className="mth-section">
          <Head
            eyebrow="Honesty devices · in the product"
            title="The caveats aren't in a footnote. They're in the interface."
            sub={<>Two patterns you'll meet while using the compass. Both exist to keep a grade or a count honest at the moment you read it — not three clicks away.</>}
          />
          <div className="mth-devices">
            {/* device 1 - reference-pricing popover */}
            <article className="mth-device">
              <span className="mth-device-tag">reference_pricing_risk</span>
              <h3 className="mth-device-ttl">Hover a risk grade, see why it's that grade.</h3>
              <p className="mth-device-desc">
                Reference-pricing risk is a directional flag, not a price. So the grade carries its own evidence:
                hovering reveals the ATC class it was read from and how many products in that class PHARMAC
                already funds — the actual basis for the call.
              </p>
              <div className="mth-device-stage">
                <div className="mth-rp-anchor">
                  <span className="mth-rp-key">reference_pricing_risk</span>
                  <span className="mth-rp-badge"><span className="dot" />HIGH</span>
                </div>
                <div className="mth-rp-pop">
                  <div className="mth-rp-pop-h">Why this grade</div>
                  <div className="mth-rp-line"><span className="k">ATC L3</span><span className="v">C09A</span></div>
                  <div className="mth-rp-line"><span className="k">ATC L4</span><span className="v">C09AA</span></div>
                  <div className="mth-rp-line"><span className="k">class_funded_count</span><span className="v">11</span></div>
                  <div className="mth-rp-because">11 funded substitutes in-class — strong reference anchor — <b>high</b> pricing-pressure risk.</div>
                </div>
                <div className="mth-stage-cap">Illustrative — the live popover on a grade.</div>
              </div>
            </article>

            {/* device 2 - substance vs class ATC */}
            <article className="mth-device">
              <span className="mth-device-tag">atc_grain</span>
              <h3 className="mth-device-ttl">Substance-level vs class-level — marked, never merged.</h3>
              <p className="mth-device-desc">
                Some ATC codes resolve to a single substance; others group a whole class, so several medicines
                share one funded count. We mark which grain a row is read at, so a class-level number is never
                mistaken for a per-drug one.
              </p>
              <div className="mth-device-stage">
                <div className="mth-atc">
                  <div className="mth-atc-row">
                    <span className="mth-atc-code">C10AA05</span>
                    <span className="mth-atc-meta"><b>Atorvastatin</b><br/>one substance</span>
                    <span className="mth-atc-tier sub">substance</span>
                  </div>
                  <div className="mth-atc-row cls">
                    <span className="mth-atc-code">C10AA</span>
                    <span className="mth-atc-meta"><b>Statins</b> · class-level<br/>count shared by 6 drugs</span>
                    <span className="mth-atc-tier class">class</span>
                  </div>
                </div>
                <div className="mth-stage-cap">A class-level count is a property of the class, not the drug.</div>
              </div>
            </article>
          </div>
        </section>

        <div className="mth-rule" />

        {/* §5 - Known limits + Where the map ends */}
        <section className="mth-section">
          <Head
            eyebrow="Known limits · stated plainly"
            title="What the compass can't show — and won't pretend to."
            sub={<>These are boundaries of public data and of this tool's scope. They're documented here so a missing number is never mistaken for a hidden one.</>}
          />
          <div className="mth-limits">
            {[
              { t: 'No NZ market size or value estimate', b: 'The compass sizes opportunities by funding gaps and supply clocks, not by dollars. There is no NZ revenue or volume model behind any figure.', why: 'out of scope' },
              { t: 'Price & margin are directional flags only', b: "Reference-pricing risk is graded high / medium / low — there is no actual $ figure. PHARMAC's real negotiated prices are commercial-in-confidence and permanently undisclosed, so no honest price model is possible.", why: 'commercial-in-confidence', locked: true },
              { t: 'No Medsafe registration status', b: "We can't yet distinguish a medicine that is unregistered in NZ from one that is registered but unfunded. Both read the same way in the gap list.", why: 'not yet joined' },
              { t: 'Track C (197) has no BD Score', b: 'Unmatched local generics are classified from ATC and dosage form alone, with no global revenue or patent data — so they can\'t be ranked, only listed.', why: 'no data to rank' },
              { t: 'OFI wait time is a snapshot', b: "The Options-for-Investment queue position is current-state only. There is no history, so you can't see whether an item is moving up the queue or stalling.", why: 'no time series' },
              { t: 'No cross-engine search', b: "The two engines don't share an index. A molecule of interest in In-Licensing won't surface its Tender Clock status, or vice versa — you check each engine separately.", why: 'by design, for now' },
            ].map((l, i) => (
              <div className="mth-limit" key={i}>
                <span className="mth-limit-n">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <div className="mth-limit-t">{l.t}</div>
                  <div className="mth-limit-b">{l.b}</div>
                </div>
                <span className={'mth-limit-why' + (l.locked ? ' locked' : '')}>{l.locked && I.lock}{l.why}</span>
              </div>
            ))}
          </div>

          {/* where the map ends */}
          <div className="mth-mapend">
            <div className="mth-mapend-eyebrow">{I.compass}Where the map ends</div>
            <h3 className="mth-mapend-ttl">Partner intent and relationships live off the public map — and that's the point.</h3>
            <p className="mth-mapend-b">
              Who already has a quiet conversation with PHARMAC, which supplier will actually defend a contract,
              whether a manufacturer wants the NZ slot at all — none of that is in public data, and the compass
              doesn't guess at it. <b>That edge isn't a gap in the tool; it's where BD judgment begins.</b> The
              compass gets you to the right doors faster and tells you why they're worth knocking. Reading the
              room behind them is the job.
            </p>
          </div>
        </section>

        <div className="mth-rule" />

        {/* Feedback */}
        <section className="mth-section tight">
          <div className="mth-feedback">
            <span className="mth-eyebrow">Feedback</span>
            <h2>Found an error? A gap mis-tracked? A source we missed?</h2>
            <p>
              NZ BD Compass is an independent business-development analysis tool, not affiliated with PHARMAC or
              the PBS, and not a regulatory determination. Corrections and additions are welcome on GitHub — the
              same place the reduction logic lives.
            </p>
            <a className="mth-feedback-link" href="https://github.com/hanbitkang-dev/nz-bd-compass/issues" target="_blank" rel="noreferrer">
              {I.github}github.com/hanbitkang-dev/nz-bd-compass/issues
            </a>
          </div>
        </section>

      </div>
    </div>
  )
}
