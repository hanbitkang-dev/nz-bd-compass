// InLicensing.jsx — NZ BD Compass · Engine 1
// Composes BD Opportunities (BD-scored gaps) + In-Licensing Tracks (3-track classification).
// Both sections call pharmac-tracker.onrender.com as external API.
import '../analytics.css'
import BdOpportunities from './BdOpportunities.jsx'
import InLicensingTracks from './InLicensingTracks.jsx'

const PHARMAC = 'https://pharmac-tracker.onrender.com'

function handleNavigate({ tab, q }) {
  if (tab === 'methodology') {
    window.open(`${PHARMAC}/methodology`, '_blank', 'noopener')
  } else {
    window.open(PHARMAC, '_blank', 'noopener')
  }
}

export default function InLicensing() {
  return (
    <div className="content-wrap">
      <BdOpportunities onNavigate={handleNavigate} />
      <InLicensingTracks />
    </div>
  )
}
