import { useState, useEffect } from 'react';

// In dev: set VITE_API_BASE in .env.local → http://localhost:3002
// In prod: set as Render env var  → https://pharmac-tracker.onrender.com
const API = import.meta.env.VITE_API_BASE || 'http://localhost:3002';

function ApiProbe() {
  const [state, setState] = useState('idle');
  const [info, setInfo]   = useState(null);
  const [err, setErr]     = useState(null);

  function runProbe() {
    setState('loading');
    setErr(null);
    fetch(`${API}/api/tender-clock`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(d => {
        setInfo({
          total:       d.meta?.filtered ?? d.targets?.length,
          whiteSpace:  d.meta?.funnel?.white_space,
          coverage:    d.meta?.funnel?.supplier_coverage,
          firstTarget: d.targets?.[0]?.chemical ?? '—',
        });
        setState('ok');
      })
      .catch(e => {
        setErr(String(e));
        setState('error');
      });
  }

  return (
    <div className="probe">
      <h2 className="probe-title">API connectivity check</h2>
      <p className="probe-endpoint">
        <span className="probe-label">Endpoint</span>
        <code>{API}/api/tender-clock</code>
      </p>

      <button className="probe-btn" onClick={runProbe} disabled={state === 'loading'}>
        {state === 'loading' ? 'Calling…' : 'Run probe'}
      </button>

      {state === 'ok' && (
        <div className="probe-result ok">
          <span className="probe-dot ok" /> CORS OK — data received
          <table className="probe-table">
            <tbody>
              <tr><td>Total targets</td><td>{info.total}</td></tr>
              <tr><td>White-space slots</td><td>{info.whiteSpace}</td></tr>
              <tr><td>Supplier coverage</td><td>{info.coverage}</td></tr>
              <tr><td>First target</td><td>{info.firstTarget}</td></tr>
            </tbody>
          </table>
        </div>
      )}

      {state === 'error' && (
        <div className="probe-result error">
          <span className="probe-dot error" /> Failed
          <pre className="probe-err">{err}</pre>
          <p className="probe-hint">
            If the error mentions CORS, pharmac-tracker needs an explicit
            <code>cors(&#123; origin: … &#125;)</code> config.<br />
            If it's a network error, the server may not be running locally.
          </p>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <div className="shell">
      <header className="header">
        <div className="header-logo">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M6 11 L11 6 L16 11 L11 16 Z" fill="currentColor" opacity=".35"/>
            <circle cx="11" cy="11" r="3" fill="currentColor"/>
          </svg>
          <span className="header-name">NZ BD Compass</span>
        </div>
        <span className="header-sub">BD opportunity intelligence for the New Zealand market</span>
      </header>

      <main className="main">
        <section className="hero">
          <p className="hero-label">Coming soon</p>
          <h1 className="hero-h1">
            Two engines.<br />
            One compass.
          </h1>
          <p className="hero-desc">
            <strong>Engine 1 — In-licensing gaps:</strong> 523 medicines funded in AU but not yet
            in NZ, BD-scored on global revenue, patent timeline, AU access level, and OFI momentum.
          </p>
          <p className="hero-desc">
            <strong>Engine 2 — Re-tender white-space:</strong> PHARMAC PSS sole-supply contracts
            expiring in 2027–28, filtered to contestable white-space and mapped to the ITT calendar.
          </p>
        </section>

        <ApiProbe />
      </main>
    </div>
  );
}
