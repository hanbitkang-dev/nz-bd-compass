// ExploreTable.jsx — NZ BD Compass · generic sortable table for Explore mode.
// columns: [{ key, label, align?, get(row), render?(row) }]
// Clicking a header toggles sort; clicking a row fires onRowClick(row).
const SortCaret = ({ state }) => (
  <span className={`xp-caret${state ? ' on' : ''}`} aria-hidden="true">
    {state === 'asc' ? '▲' : state === 'desc' ? '▼' : '↕'}
  </span>
)

export default function ExploreTable({ columns, rows, sort, onToggleSort, onRowClick, rowKey }) {
  return (
    <div className="xp-tablewrap" role="region" aria-label="Results table" tabIndex={0}>
      <table className="xp-table">
        <thead>
          <tr>
            {columns.map(c => {
              const state = sort?.key === c.key ? sort.dir : null
              return (
                <th
                  key={c.key}
                  className={`${c.align === 'right' ? 'r' : ''}${state ? ' sorted' : ''}`}
                  onClick={() => onToggleSort(c.key)}
                  aria-sort={state === 'asc' ? 'ascending' : state === 'desc' ? 'descending' : 'none'}
                >
                  <span className="xp-th-in">{c.label}<SortCaret state={state} /></span>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={rowKey ? rowKey(r, i) : i}
              className={onRowClick ? 'clickable' : ''}
              onClick={onRowClick ? () => onRowClick(r) : undefined}
            >
              {columns.map(c => (
                <td key={c.key} className={c.align === 'right' ? 'r' : ''}>
                  {c.render ? c.render(r) : (c.get(r) ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
