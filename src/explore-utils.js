// explore-utils.js — NZ BD Compass · Explore mode shared helpers
// CSV export (no external lib) + a generic column-sort hook.
import { useState, useMemo } from 'react'

// ── CSV export ────────────────────────────────────────────────────
// rows: array of row objects · columns: [{ label, csv?(row)|get(row) }]
// Exports exactly the rows passed in (= current filtered+sorted set).
function csvCell(v) {
  const s = v == null ? '' : String(v)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
export function downloadCSV(filename, rows, columns) {
  const header = columns.map(c => csvCell(c.label)).join(',')
  const body = rows
    .map(r => columns.map(c => csvCell((c.csv || c.get)(r))).join(','))
    .join('\r\n')
  const csv = '﻿' + header + '\r\n' + body   // BOM → Excel reads UTF-8
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

// ── Sort hook ─────────────────────────────────────────────────────
// columns: [{ key, get, sortVal?, type? }] — nulls always sort last.
export function useSort(rows, columns, initial = null) {
  const [sort, setSort] = useState(initial)   // { key, dir: 'asc'|'desc' } | null

  const sorted = useMemo(() => {
    if (!sort?.key) return rows
    const col = columns.find(c => c.key === sort.key)
    if (!col) return rows
    const acc = col.sortVal || col.get
    const dir = sort.dir === 'desc' ? -1 : 1
    return [...rows].sort((a, b) => {
      const va = acc(a), vb = acc(b)
      const ea = va == null || va === ''
      const eb = vb == null || vb === ''
      if (ea && eb) return 0
      if (ea) return 1            // empties last, regardless of dir
      if (eb) return -1
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir
      return String(va).localeCompare(String(vb), undefined, { numeric: true }) * dir
    })
  }, [rows, columns, sort])

  const toggle = key =>
    setSort(s => (s?.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }))

  return { sorted, sort, toggle }
}
