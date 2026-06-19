// ModeTabs.jsx — Story / Explore switch shared by both Engine pages.
export default function ModeTabs({ mode, setMode, exploreLabel = 'Explore' }) {
  return (
    <div className="xp-modebar">
      <div className="xp-tabs" role="tablist">
        <button role="tab" aria-selected={mode === 'story'}
          className={`xp-tab${mode === 'story' ? ' active' : ''}`} onClick={() => setMode('story')}>
          Story
        </button>
        <button role="tab" aria-selected={mode === 'explore'}
          className={`xp-tab${mode === 'explore' ? ' active' : ''}`} onClick={() => setMode('explore')}>
          {exploreLabel}
        </button>
      </div>
    </div>
  )
}
