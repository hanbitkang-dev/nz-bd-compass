// Guide.jsx - NZ BD Compass - Guide (how to drive the screens).
// Sits one layer above Methodology: Methodology answers "can I trust this
// number?"; Guide answers "how do I actually work this thing?". Reuses the
// .mth-* page scaffold + honesty-device mocks from methodology.css, adds the
// mode-compare, the annotated Explore toolbar and the per-engine workflow rails
// from guide.css. CD design integration, ported from the UMD/Babel handoff to
// Vite/ESM. The §2 toolbar mock is matched 1:1 to the live BdExplore UI.
import { useNavigate } from 'react-router-dom'
import '../compass.css'
import '../methodology.css'
import '../guide.css'

const I = {
  story:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20"/></svg>,
  explore: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 9v11"/></svg>,
  horizon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 16h18"/><path d="m7 16 3-5 3 3 4-7"/><circle cx="20" cy="7" r="1.4" fill="currentColor" stroke="none"/></svg>,
  clock:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>,
  compass: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5 5-2z" fill="currentColor" stroke="none"/></svg>,
  check:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12.5 9 17.5 20 6.5"/></svg>,
  search:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.4-3.4"/></svg>,
  filter:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5h18l-7 8v6l-4 2v-8L3 5z"/></svg>,
  columns: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16M15 4v16"/></svg>,
  csv:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12m0 0 4-4m-4 4-4-4"/><path d="M5 21h14"/></svg>,
  x:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6 6 18"/></svg>,
  sortDesc:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>,
  arrow:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>,
  info:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.5"/></svg>,
  book:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
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

/* a workflow field/control chip: name + optional operator suffix */
function Field({ children, op }) {
  return <span className="gd-field">{children}{op && <span className="op"> · {op}</span>}</span>
}

export default function Guide() {
  const navigate = useNavigate()
  return (
    <div className="view-enter mth">

      {/* Hero */}
      <section className="mth-hero">
        <div className="mth-hero-inner">
          <span className="mth-hero-eyebrow gd-hero-eyebrow"><span className="dot" />Guide · driving the compass</span>
          <h1 className="mth-hero-title">From the question to the shortlist.</h1>
          <p className="mth-hero-lede">
            Two engines, two modes, one workbench. This guide is the operating manual: when to read the
            <b> Story</b>, when to switch to <b>Explore</b>, how to work the filters — and the exact field-by-field
            path each engine takes from a whole market down to a handful of names worth a meeting.
          </p>
          <div className="mth-hero-chips">
            <span className="mth-hero-chip">{I.story}Story = read the case</span>
            <span className="mth-hero-chip">{I.explore}Explore = work the data</span>
            <span className="mth-hero-chip amber">{I.compass}Then act</span>
          </div>
        </div>
      </section>

      <div className="mth-body">

        {/* §1 - Story vs Explore */}
        <section className="mth-section">
          <Head
            eyebrow="Two modes · per engine"
            title="Story to understand it. Explore to work it."
            sub={<>Every engine opens in <b>Story</b> — a curated walk through the case it's making. Flip to <b>Explore</b> when you want to stop reading and start slicing. Same data underneath; different job.</>}
          />
          <div className="gd-modes">
            <article className="gd-mode story">
              <div className="gd-mode-top">
                <span className="gd-mode-ic">{I.story}</span>
                <div><div className="gd-mode-name">Story</div><div className="gd-mode-kind">Curated · view mode</div></div>
              </div>
              <p className="gd-mode-lead">The engine's argument, laid out: the reduction, the headline targets, the "why this many" — read top to bottom, no controls needed.</p>
              <ul className="gd-mode-when">
                <li className="gd-mode-when-h">Use it when</li>
                <li>{I.check}<span>You're <b>new to the engine</b> and want the shape of the opportunity first.</span></li>
                <li>{I.check}<span>You need to <b>brief someone</b> — it reads like a memo.</span></li>
                <li>{I.check}<span>You want the curated shortlist, not the full universe.</span></li>
              </ul>
            </article>
            <article className="gd-mode explore">
              <div className="gd-mode-top">
                <span className="gd-mode-ic">{I.explore}</span>
                <div><div className="gd-mode-name">Explore</div><div className="gd-mode-kind">All data · work mode</div></div>
              </div>
              <p className="gd-mode-lead">The full table behind the Story: every scored row, multi-filtered, sorted on any column, columns you choose, exported when you're done.</p>
              <ul className="gd-mode-when">
                <li className="gd-mode-when-h">Use it when</li>
                <li>{I.check}<span>You have <b>your own criteria</b> — a therapeutic area, a portfolio fit, a timeline.</span></li>
                <li>{I.check}<span>You want to <b>rank by a different axis</b> than the curated one.</span></li>
                <li>{I.check}<span>You're <b>pulling a list</b> to take into a spreadsheet or a meeting.</span></li>
              </ul>
            </article>
            <div className="gd-modes-foot">{I.info}<span>The Story / Explore toggle sits at the top of each engine — switching never changes the underlying data, only how much of it you see.</span></div>
          </div>
        </section>

        <div className="mth-rule" />

        {/* §2 - Explore controls (toolbar matched 1:1 to live BdExplore) */}
        <section className="mth-section">
          <Head
            eyebrow="Explore · the controls"
            title="Four controls run the whole table."
            sub={<>Search to jump, Filters to narrow, Columns to choose what you see, Export to take it with you — plus click any header to sort. Here's the toolbar, annotated.</>}
          />
          <div className="gd-mock">
            <div className="gd-mock-bar">
              <span className="gd-mock-search">{I.search}Search chemical, brand, area...</span>
              <span className="gd-mock-btn on">{I.filter}Filters <span className="n">3</span></span>
              <span className="gd-mock-btn">{I.columns}Columns <span className="n gray">9</span></span>
              <span className="gd-mock-btn csv">{I.csv}Export CSV</span>
            </div>
            <div className="gd-mock-chips">
              <span className="gd-mock-count"><b>41</b> of 523 medicines</span>
              <span className="gd-mock-chip"><span className="ck">TG1</span>Cardiovascular<span className="xx">{I.x}</span></span>
              <span className="gd-mock-chip"><span className="ck">Risk</span>High<span className="xx">{I.x}</span></span>
              <span className="gd-mock-chip"><span className="ck">Rev</span>$2-12B<span className="xx">{I.x}</span></span>
            </div>
            <span className="gd-mock-sort">{I.sortDesc}Sorted by Revenue, descending <span className="rest">· click any header to change</span></span>
          </div>
          <div className="gd-callouts">
            <div className="gd-callout"><span className="gd-callout-n">1</span><div><div className="gd-callout-t">Filters · narrow on any axis</div><div className="gd-callout-b">Stack as many as you like — track, risk grade, <code>revenue</code> range, modality, area. The badge counts active filters; each shows as a chip you can clear one at a time or <b>Reset all</b>.</div></div></div>
            <div className="gd-callout"><span className="gd-callout-n">2</span><div><div className="gd-callout-t">Columns · choose what shows</div><div className="gd-callout-b">Open the picker to add hidden fields (<code>atc_l3</code>, <code>atc_l4</code>, <code>class_funded_count</code>) or drop ones you don't need. The Chemical column stays pinned.</div></div></div>
            <div className="gd-callout"><span className="gd-callout-n">3</span><div><div className="gd-callout-t">Sort · click a header</div><div className="gd-callout-b">Click once to sort, again to flip direction. Numeric columns start high-to-low. The count above the table always reflects what's currently filtered in.</div></div></div>
            <div className="gd-callout"><span className="gd-callout-n">4</span><div><div className="gd-callout-t">Export CSV · take it with you</div><div className="gd-callout-b">Exports exactly what you've shaped — current filters, current columns, current sort. What you see is what lands in the file.</div></div></div>
          </div>
        </section>

        <div className="mth-rule" />

        {/* §3 - Reading the honesty devices (interpretation only) */}
        <section className="mth-section">
          <Head
            eyebrow="Reading the honesty devices"
            title="Two markers you'll meet — and how to read them."
            sub={<>These aren't calculations to learn; they're labels to interpret correctly at a glance. The <i>why</i> behind the numbers lives in Methodology.</>}
          />
          <div className="mth-devices">
            {/* reference-pricing popover - interpretation */}
            <article className="mth-device">
              <span className="mth-device-tag">reference_pricing_risk</span>
              <h3 className="mth-device-ttl">Hover the grade — read it as negotiation difficulty.</h3>
              <p className="mth-device-desc">
                The popover shows the ATC class the grade was read from and <b>class_funded_count</b> — how many
                in-class medicines NZ already funds. Read it plainly: more funded substitutes = a stronger price
                anchor = a <b>harder</b> funded-price negotiation. It's a direction, not a dollar figure.
              </p>
              <div className="mth-device-stage">
                <div className="mth-rp-anchor">
                  <span className="mth-rp-key">reference_pricing_risk</span>
                  <span className="mth-rp-badge"><span className="dot" />HIGH</span>
                </div>
                <div className="mth-rp-pop">
                  <div className="mth-rp-pop-h">Why this grade</div>
                  <div className="mth-rp-line"><span className="k">ATC L4</span><span className="v">C09AA</span></div>
                  <div className="mth-rp-line"><span className="k">class_funded_count</span><span className="v">11</span></div>
                  <div className="mth-rp-because">Read as: <b>harder</b> to win a high funded price.</div>
                </div>
                <div className="mth-stage-cap">Hover any grade to see its basis.</div>
              </div>
            </article>
            {/* substance vs class ATC - interpretation */}
            <article className="mth-device">
              <span className="mth-device-tag">atc_grain</span>
              <h3 className="mth-device-ttl">Check the grain before you trust a count.</h3>
              <p className="mth-device-desc">
                A <b>substance</b> badge means the number is about one molecule. A <b>class</b> badge means it's
                shared across every drug in the group — so don't read a class-level funded count as if it were
                per-drug. The badge tells you which, every time.
              </p>
              <div className="mth-device-stage">
                <div className="mth-atc">
                  <div className="mth-atc-row">
                    <span className="mth-atc-code">C10AA05</span>
                    <span className="mth-atc-meta"><b>Atorvastatin</b><br/>read as one drug</span>
                    <span className="mth-atc-tier sub">substance</span>
                  </div>
                  <div className="mth-atc-row cls">
                    <span className="mth-atc-code">C10AA</span>
                    <span className="mth-atc-meta"><b>Statins</b> · shared by 6<br/>don't read as one drug</span>
                    <span className="mth-atc-tier class">class</span>
                  </div>
                </div>
                <div className="mth-stage-cap">Badge = the grain the row is counted at.</div>
              </div>
            </article>
          </div>
          <p className="mth-sub" style={{ marginTop: 18 }}>
            The <b>NZ Registration</b> column reads the same way: a coloured dot per medicine —
            <b> registered</b> (active consent), <b>registered (inactive)</b> (lapsed / not available),
            <b> not registered</b> (INN + brand both checked), or <b>not yet checked</b> (outside the snapshot).
            Hover for the Medsafe meaning + sponsor. It's a dated snapshot, not a live lookup.
          </p>
          <div className="gd-readlink">
            <span>Want the calculation behind a grade, not just how to read it?</span>
            <button className="gd-readlink-btn" onClick={() => navigate('/methodology#honesty-devices')}>{I.book}See it in Methodology{I.arrow}</button>
          </div>
        </section>

        <div className="mth-rule" />

        {/* §4 - Workflows (the core) */}
        <section className="mth-section">
          <Head
            eyebrow="Workflows · in practice"
            title="The path each engine takes to a shortlist."
            sub={<>The field-by-field route from the full table to a handful of names. Follow it as written, or branch off wherever your own criteria take over.</>}
          />
          <div className="gd-flow">
            {/* Engine 1 */}
            <div className="gd-flow-col il">
              <div className="gd-flow-h">
                <span className="gd-flow-ic">{I.horizon}</span>
                <div><div className="gd-flow-eyebrow">Engine 01 · In-Licensing</div><div className="gd-flow-ttl">Funding gaps → in-licensing candidates</div></div>
              </div>
              <div className="gd-steps">
                <div className="gd-step">
                  <span className="gd-step-n">1</span>
                  <div className="gd-step-card">
                    <div className="gd-step-t">Narrow to the area you sell into</div>
                    <div className="gd-step-fields"><Field>tg1</Field></div>
                    <div className="gd-step-b">Filter by therapeutic area first — there's no point ranking molecules you'd never carry.</div>
                  </div>
                </div>
                <div className="gd-step">
                  <span className="gd-step-n">2</span>
                  <div className="gd-step-card">
                    <div className="gd-step-t">First-pass priority by size &amp; runway</div>
                    <div className="gd-step-fields"><Field op="sort ↓">revenue</Field><Field>patent_expiry</Field></div>
                    <div className="gd-step-b">Sort by global <b>revenue</b> for the prize, read <b>patent_expiry</b> for whether the window is open. Big &amp; off-patent rises to the top.</div>
                  </div>
                </div>
                <div className="gd-step">
                  <span className="gd-step-n">3</span>
                  <div className="gd-step-card">
                    <div className="gd-step-t">Weigh negotiation difficulty</div>
                    <div className="gd-step-fields"><Field>reference_pricing_risk</Field></div>
                    <div className="gd-step-b"><b>High</b> = many funded in-class substitutes = a harder funded-price fight. Hover for the basis; trade it off against the prize.</div>
                  </div>
                </div>
                <div className="gd-step">
                  <span className="gd-step-n">4</span>
                  <div className="gd-step-card">
                    <div className="gd-step-t">Compress to final candidates</div>
                    <div className="gd-step-fields"><Field>au_restriction</Field><Field>modality</Field></div>
                    <div className="gd-step-b">Drop modalities you can't make and AU restrictions that won't translate. What's left is your meeting list.</div>
                  </div>
                </div>
              </div>
              <div className="gd-aside">
                {I.info}
                <p>This flow assumes a <b>BD Score</b> — it works for <b>Track A &amp; B</b>. The 197 <b>Track C</b> local generics have no score, so rank them another way: an <span className="soon">AU raw utilization</span> column is coming to give Track C its own signal.</p>
              </div>
            </div>

            {/* Engine 2 */}
            <div className="gd-flow-col tc">
              <div className="gd-flow-h">
                <span className="gd-flow-ic">{I.clock}</span>
                <div><div className="gd-flow-eyebrow">Engine 02 · Tender Clock</div><div className="gd-flow-ttl">Sole-supply slots → a timed play</div></div>
              </div>
              <div className="gd-steps">
                <div className="gd-step">
                  <span className="gd-step-n">1</span>
                  <div className="gd-step-card">
                    <div className="gd-step-t">Branch on who holds it now</div>
                    <div className="gd-branch">
                      <div className="gd-branch-row"><span className="gd-branch-pill competitor"><span className="d" />competitor</span><span><b>Attack candidate</b> — a slot you could contest</span></div>
                      <div className="gd-branch-row"><span className="gd-branch-pill local"><span className="d" />local</span><span><b>Defend</b> — you may already hold this</span></div>
                      <div className="gd-branch-row"><span className="gd-branch-pill opaque"><span className="d" />opaque</span><span><b>Investigate</b> — supplier unmapped</span></div>
                    </div>
                    <div className="gd-step-b">Filter <b>hold_status</b> first — it decides whether you're playing offence, defence, or doing homework.</div>
                  </div>
                </div>
                <div className="gd-step">
                  <span className="gd-step-n">2</span>
                  <div className="gd-step-card">
                    <div className="gd-step-t">Set the timing strategy</div>
                    <div className="gd-step-fields"><Field>cohort</Field><Field>lead_months</Field></div>
                    <div className="gd-step-b"><b>2028 = start BD now</b> — enough runway to build a dossier before the bid window. <b>2027 = defend only</b> — too short to start fresh. Sort <b>lead_months</b> to see who has room.</div>
                  </div>
                </div>
                <div className="gd-step">
                  <span className="gd-step-n">3</span>
                  <div className="gd-step-card">
                    <div className="gd-step-t">Pre-filter by buildability</div>
                    <div className="gd-step-fields"><Field>mfr_difficulty</Field></div>
                    <div className="gd-step-b">Drop <b>complex</b> formulations you can't realistically make in time. Small-molecule generics are the cleanest plays — sieve them out before you commit.</div>
                  </div>
                </div>
              </div>
              <div className="gd-aside" style={{ borderLeftColor: 'var(--amber)' }}>
                {I.info}
                <p>Expiry is <b>not</b> a guaranteed re-tender — PHARMAC may roll over, bundle, or defer. Treat every slot as a forecast, and confirm the clock in the row's detail drawer.</p>
              </div>
            </div>
          </div>
        </section>

        <div className="mth-rule" />

        {/* §5 - First-time path */}
        <section className="mth-section tight">
          <Head
            eyebrow="New here?"
            title="The five-step path the first time through."
            sub={<>If you only remember one thing, remember this order.</>}
          />
          <div className="gd-path">
            <div className="gd-path-step">
              <div className="gd-path-row"><span className="gd-path-num">01</span><span className="gd-path-ic">{I.compass}</span></div>
              <div className="gd-path-t">Start at the Compass</div>
              <div className="gd-path-b">The hub frames the two engines and the kind of opening each one finds.</div>
            </div>
            <span className="gd-path-arrow">{I.arrow}</span>
            <div className="gd-path-step il">
              <div className="gd-path-row"><span className="gd-path-num">02</span><span className="gd-path-ic">{I.horizon}</span></div>
              <div className="gd-path-t">Pick an engine</div>
              <div className="gd-path-b">In-Licensing for the pipeline play, Tender Clock for the time-sensitive one.</div>
            </div>
            <span className="gd-path-arrow">{I.arrow}</span>
            <div className="gd-path-step">
              <div className="gd-path-row"><span className="gd-path-num">03</span><span className="gd-path-ic">{I.story}</span></div>
              <div className="gd-path-t">Read the Story</div>
              <div className="gd-path-b">Get the shape of the opportunity and the reduction behind it.</div>
            </div>
            <span className="gd-path-arrow">{I.arrow}</span>
            <div className="gd-path-step">
              <div className="gd-path-row"><span className="gd-path-num">04</span><span className="gd-path-ic">{I.explore}</span></div>
              <div className="gd-path-t">Switch to Explore</div>
              <div className="gd-path-b">Apply your own criteria, sort, and pull the shortlist that fits you.</div>
            </div>
            <span className="gd-path-arrow">{I.arrow}</span>
            <div className="gd-path-step tc">
              <div className="gd-path-row"><span className="gd-path-num">05</span><span className="gd-path-ic">{I.book}</span></div>
              <div className="gd-path-t">Check Methodology</div>
              <div className="gd-path-b">When a number matters, confirm where it came from and what it leaves out.</div>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
