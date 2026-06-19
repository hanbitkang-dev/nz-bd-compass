import { useState, useCallback } from 'react'
import '../analytics.css'
import '../compass.css'
import '../explore.css'
import BdOpportunities from './BdOpportunities.jsx'
import InLicensingTracks from './InLicensingTracks.jsx'
import BdExplore from './BdExplore.jsx'
import BdDetailPanel from './BdDetailPanel.jsx'
import EngineModes from './EngineModes.jsx'
import EngineContext from '../EngineContext.jsx'

const PHARMAC = 'https://pharmac-tracker.onrender.com'

function handleNavigate({ tab } = {}) {
  if (tab === 'methodology') {
    window.open(`${PHARMAC}/methodology`, '_blank', 'noopener')
  } else {
    window.open(PHARMAC, '_blank', 'noopener')
  }
}

export default function InLicensing() {
  const [mode, setMode] = useState('story')

  // page-level detail panel for Explore mode (Story mode's cards open their own)
  const [sel, setSel] = useState(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const openDetail = useCallback((g) => { setSel(g); setTimeout(() => setPanelOpen(true), 20) }, [])
  const closeDetail = useCallback(() => { setPanelOpen(false); setTimeout(() => setSel(null), 320) }, [])

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
            patent runway, AU access level, and OFI momentum. Read the curated story, or switch
            to <b>Explore</b> to slice the full dataset your own way.
          </p>
        </div>

        <EngineModes mode={mode} setMode={setMode} accent="e1" />

        {mode === 'story' ? (
          <>
            <BdOpportunities onNavigate={handleNavigate} />
            <InLicensingTracks />
          </>
        ) : (
          <BdExplore onOpenDetail={openDetail} />
        )}
      </div>

      <BdDetailPanel
        gap={sel}
        open={panelOpen}
        onClose={closeDetail}
        onSearch={() => { closeDetail(); handleNavigate({ tab: 'compare' }) }}
        onMethodology={() => { closeDetail(); handleNavigate({ tab: 'methodology' }) }}
      />
    </div>
  )
}
