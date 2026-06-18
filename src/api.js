// api.js — NZ BD Compass · shared API client
// Single source for API_BASE, common fetch wrapper, endpoint helpers,
// and the reusable useEndpoint React hook.
import { useState, useEffect } from 'react'

export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3002'

async function apiFetch(path) {
  const r = await fetch(`${API_BASE}${path}`)
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.json()
}

// Reactive hook: re-fetches whenever `url` changes.
// url must be a full URL already including API_BASE.
// Returns [{ loading, error, data }, retry].
export function useEndpoint(url) {
  const [s, setS] = useState({ loading: true, error: false, data: null })
  const [nonce, setNonce] = useState(0)
  useEffect(() => {
    let alive = true
    setS({ loading: true, error: false, data: null })
    fetch(url)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json() })
      .then(d => { if (alive) setS({ loading: false, error: false, data: d }) })
      .catch(() => { if (alive) setS({ loading: false, error: true, data: null }) })
    return () => { alive = false }
  }, [url, nonce])
  return [s, () => setNonce(n => n + 1)]
}

// One-shot async helpers — use inside useEffect or event handlers.
export const getTenderClock    = ()           => apiFetch('/api/tender-clock')
export const getCrossRefTracks = ()           => apiFetch('/api/cross-ref/tracks')
export const getDrugDetail     = (chemical)   => apiFetch(`/api/cross-ref/drug/${encodeURIComponent(chemical)}`)
export const getGapEnriched    = (params = {}) => {
  const qs = new URLSearchParams(params).toString()
  return apiFetch(`/api/cross-ref/gap-enriched${qs ? `?${qs}` : ''}`)
}
