# NZ BD Compass — CLAUDE.md

> Read this first when starting a Claude Code session on this repo.
> See `~/.claude/CLAUDE.md` for cross-project context (Han, the 3-tool system,
> CC/CD/Claude roles, CD-output caveats). Don't duplicate that here.
> Last updated: 2026-06 / after Explore + Methodology + Guide + Admin + v4-E.

---

## Project overview

NZ pharmaceutical **business-development analysis** front-end. Two "engines" over
public PHARMAC / AU PBS data, framed for a BD audience. **No backend of its own** —
it calls the **pharmac-tracker** API cross-origin.

- **Live**: https://nz-bd-compass.onrender.com  (Render static site)
- **GitHub**: https://github.com/hanbitkang-dev/nz-bd-compass
- **Backend**: pharmac-tracker (`VITE_API_BASE`; default `http://localhost:3002`,
  prod `https://pharmac-tracker.onrender.com`). All data fetching goes through
  `src/api.js`.
- **Dev port**: 5175 (Vite). Stack: React 18 + Vite 6 + react-router-dom v7, ESM.
  Hanken Grotesk / JetBrains Mono. Teal = Engine 1, amber = Engine 2.

---

## Structure (actual)

```
src/
├── App.jsx              # router shell + header nav + dark-mode toggle
├── api.js               # API_BASE + fetch helpers (getGapEnriched, getReferencePricing,
│                        #   getTenderClock, getDrugDetail) + useEndpoint hook
├── pages/
│   ├── Home.jsx         # Compass hub — headline numbers + Methodology deep-link
│   ├── InLicensing.jsx  # Engine 1 page: EngineModes(Story|Explore) + BdDetailPanel host
│   ├── BdOpportunities.jsx / InLicensingTracks.jsx   # Engine 1 Story
│   ├── BdExplore.jsx    # Engine 1 Explore (table: filter/sort/columns/CSV + RiskCell/AuUtilCell popovers)
│   ├── TenderClockPage.jsx # Engine 2 page: EngineModes + TenderClockStory (funnel)
│   ├── TenderExplore.jsx   # Engine 2 Explore (table + detail drawer)
│   ├── BdDetailPanel.jsx   # Engine 1 row → slide-in detail
│   ├── EngineModes.jsx     # Story | Explore switcher (teal e1 / amber e2)
│   ├── Guide.jsx        # /guide — how to operate the screens
│   ├── Methodology.jsx  # /methodology — provenance / reduction / limits (canonical)
│   └── AdminPage.jsx    # /admin (UNLINKED) — BD Score config, calls pharmac-tracker
└── *.css                # compass / explore / methodology / guide / index (+ legacy bd-*, tender-clock)
```

---

## Nav & routes

`Home (Compass) · In-Licensing · Tender Clock · Guide · Methodology` — **no "Why"
page** (Home absorbed it). `/admin` exists but is **not in the nav** (internal tool).

```
/              Home          /guide         Guide
/in-licensing  Engine 1      /methodology   Methodology
/tender-clock  Engine 2      /admin         AdminPage (unlinked)
```

---

## Content-separation principle — apply BEFORE adding any page/section

Each screen answers **exactly one** question. Do not blur these:

| Screen | Answers | Must NOT contain |
|--------|---------|------------------|
| **Home** | "what are the headline numbers?" | full reduction ladders, calc detail → deep-link to Methodology instead |
| **Story** (per engine) | "what's the curated result?" | the full dataset (that's Explore) |
| **Explore** (per engine) | "let me work the full data" | curated narrative |
| **Guide** | "how do I operate the screens?" | calculation logic / why a number is trustworthy (that's Methodology) |
| **Methodology** | "can I trust this number — sources, reduction, limits?" — the **single canonical** home for the full reduction ladder, provenance, and known limits | how-to-operate instructions (that's Guide) |

When adding a new page or moving content, decide which one question it serves and
keep everything else out. Cross-link instead of duplicating (e.g. Home →
`/methodology#reduction-ladder`, Guide → `/methodology#honesty-devices`).

---

## Admin (/admin, unlinked)

BD Priority Score configuration, rehosted from pharmac-tracker. Calls the
pharmac-tracker score-config API **cross-origin** (`API_BASE`) with the
`x-admin-password` header — **password entered at runtime, never in the bundle**.
The write endpoint is origin-whitelisted server-side (see pharmac-tracker
CLAUDE.md → CORS hardening).

---

## CD design integration — repeated caveat

CD deliverables arrive as Babel-in-browser + UMD-global + mock-API stacks (NOT our
Vite/ESM repo), regardless of any "wired into app.jsx" claim. Every CD handoff
(Explore, Methodology, Guide) followed this pattern. **Always port to the real ESM
structure, wire to the live API, strip the mock, and verify figures against the
live data** before trusting the numbers.

---

## v4-E — AU utilization column (DONE)

BdExplore has an optional **"AU utilization (raw, not NZ-scaled)"** column (in the
column picker) reading `gap.au_utilization` from the live API — the Track C signal
(no BD Score). Substance vs class/combination grain shown via an `AuUtilCell` hover
popover (reuses the RiskCell portal pattern). **78% coverage is a floor**; the
12-month upgrade is impossible for memory reasons — details + the confirmed Engine 2
number system live in **pharmac-tracker CLAUDE.md** (don't duplicate the figures here).

---

## Conventions

- All data via `src/api.js` (`API_BASE`); never hardcode the backend URL elsewhere.
- Reductions / figures are owned by the backend; the UI must match what the live
  API returns (verify, don't restate stale numbers).
- Data neutrality: no company names in filters/columns/defaults (see global CLAUDE.md).
- Dark mode is token-based (`index.css` `:root` / `.theme-dark`); new CSS must use
  the shared `var(--…)` tokens so both themes resolve.

---

## Local run

```bash
cd nz-bd-compass
npm install
npm run dev      # http://localhost:5175  (needs pharmac-tracker on :3002 for data)
npm run build
```
