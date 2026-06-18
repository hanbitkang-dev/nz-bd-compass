import { useState } from 'react';
import { getTenderClock, API_BASE } from '../api.js';

function ApiProbe() {
  const [state, setState] = useState('idle');
  const [info, setInfo]   = useState(null);
  const [err, setErr]     = useState(null);

  function runProbe() {
    setState('loading');
    setErr(null);
    getTenderClock()
      .then(d => {
        setInfo({
          total:       d.meta?.filtered ?? d.targets?.length,
          whiteSpace:  d.meta?.funnel?.white_space,
          coverage:    d.meta?.funnel?.supplier_coverage,
          firstTarget: d.targets?.[0]?.chemical ?? '—',
        });
        setState('ok');
      })
      .catch(e => { setErr(String(e)); setState('error'); });
  }

  return (
    <div className="probe">
      <h2 className="probe-title">API connectivity check</h2>
      <p className="probe-endpoint">
        <span className="probe-label">Endpoint</span>
        <code>{API_BASE}/api/tender-clock</code>
      </p>
      <button className="probe-btn" onClick={runProbe} disabled={state === 'loading'}>
        {state === 'loading' ? 'Calling…' : 'Run probe'}
      </button>
      {state === 'ok' && (
        <div className="probe-result ok">
          <span className="probe-dot ok" /> CORS OK — data received
          <table className="probe-table"><tbody>
            <tr><td>Total targets</td><td>{info.total}</td></tr>
            <tr><td>White-space slots</td><td>{info.whiteSpace}</td></tr>
            <tr><td>Supplier coverage</td><td>{info.coverage}</td></tr>
            <tr><td>First target</td><td>{info.firstTarget}</td></tr>
          </tbody></table>
        </div>
      )}
      {state === 'error' && (
        <div className="probe-result error">
          <span className="probe-dot error" /> Failed
          <pre className="probe-err">{err}</pre>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <div className="content-wrap">
      <section className="hero">
        <p className="hero-label">BD opportunity intelligence</p>
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
    </div>
  );
}
