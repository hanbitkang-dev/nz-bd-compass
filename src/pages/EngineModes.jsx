// EngineModes.jsx - Story | Explore mode switcher (CD design).
// "View mode" (curated) vs "work mode" (all data) of one engine. Teal on
// Engine 1, amber on Engine 2 (accent="e1" | "e2"). Replaces the earlier ModeTabs.
const ICON = {
  story:   (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20"/></svg>),
  explore: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 9v11"/></svg>),
}

export default function EngineModes({ mode, setMode, accent }) {
  return (
    <div className={'eng-modes' + (accent === 'e2' ? ' e2' : '')} role="tablist">
      <button role="tab" aria-selected={mode === 'story'} className={'eng-mode' + (mode === 'story' ? ' active' : '')} onClick={() => setMode('story')}>
        {ICON.story}Story<span className="em-sub">curated</span>
      </button>
      <button role="tab" aria-selected={mode === 'explore'} className={'eng-mode' + (mode === 'explore' ? ' active' : '')} onClick={() => setMode('explore')}>
        {ICON.explore}Explore<span className="em-sub">all data</span>
      </button>
    </div>
  )
}
