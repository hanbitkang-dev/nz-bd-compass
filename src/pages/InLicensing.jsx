import '../analytics.css'
import '../compass.css'
import BdOpportunities from './BdOpportunities.jsx'
import InLicensingTracks from './InLicensingTracks.jsx'
import EngineContext from '../EngineContext.jsx'

const PHARMAC = 'https://pharmac-tracker.onrender.com'

function handleNavigate({ tab }) {
  if (tab === 'methodology') {
    window.open(`${PHARMAC}/methodology`, '_blank', 'noopener')
  } else {
    window.open(PHARMAC, '_blank', 'noopener')
  }
}

export default function InLicensing() {
  return (
    <div className="view-enter">
      <EngineContext which="in-licensing" />
      <div className="cmp-page">
        <div className="cmp-page-head il">
          <div className="an-eyebrow">Engine 01 · In-Licensing Gaps</div>
          <h1 className="cmp-page-title">
            Where Australia funds and New Zealand <span className="accent">doesn't</span> — yet.
          </h1>
          <p className="cmp-page-sub">
            523 AU-PBS medicines not on the PHARMAC Schedule, BD-scored on global revenue,
            patent runway, AU access level, and OFI momentum. Sorted into 3 tracks by
            data availability.
          </p>
        </div>
        <BdOpportunities onNavigate={handleNavigate} />
        <InLicensingTracks />
      </div>
    </div>
  )
}
