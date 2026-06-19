import { useNavigate } from 'react-router-dom'
import './compass.css'

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
const IcBack = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5m6-6-6 6 6 6"/>
  </svg>
)
const IcArrow = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14m-6-6 6 6-6 6"/>
  </svg>
)

const META = {
  'in-licensing': {
    tone: 'il',
    icon: IcHorizon,
    kind: 'Engine 01 · In-Licensing Gaps',
    line: 'What Australia funds that New Zealand doesn\'t — the mid-to-long-horizon pipeline play.',
    otherPath: '/tender-clock',
    otherIcon: IcClock,
    otherLabel: 'Tender Clock',
    otherKind: 'Engine 02 · near-term, time-sensitive play',
  },
  'tender-clock': {
    tone: 'tc',
    icon: IcClock,
    kind: 'Engine 02 · Tender Clock',
    line: 'Sole-supply contracts about to unlock — the short-horizon, time-sensitive play.',
    otherPath: '/in-licensing',
    otherIcon: IcHorizon,
    otherLabel: 'In-Licensing',
    otherKind: 'Engine 01 · longer-horizon pipeline play',
  },
}

export default function EngineContext({ which }) {
  const navigate = useNavigate()
  const meta = META[which]
  if (!meta) return null

  return (
    <div className={`cmp-ctx ${meta.tone}`}>
      <div className="cmp-ctx-inner">
        <button className="cmp-ctx-back" onClick={() => navigate('/')}>
          {IcBack}
          <span>Compass</span>
        </button>

        <span className="cmp-ctx-id">
          <span className="cmp-ctx-ic">{meta.icon}</span>
          {meta.kind}
        </span>

        <p className="cmp-ctx-line">{meta.line}</p>

        <button className="cmp-ctx-switch" onClick={() => navigate(meta.otherPath)}>
          <span className="cmp-ctx-switch-ic">{meta.otherIcon}</span>
          <span className="cmp-ctx-switch-tx">
            <span className="s1">Switch engine</span>
            <span className="s2">{meta.otherLabel} — {meta.otherKind}</span>
          </span>
          {IcArrow}
        </button>
      </div>
    </div>
  )
}
