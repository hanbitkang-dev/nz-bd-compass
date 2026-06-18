import { Routes, Route, NavLink, Link } from 'react-router-dom';
import Home from './pages/Home.jsx';
import InLicensing from './pages/InLicensing.jsx';
import TenderClockPage from './pages/TenderClockPage.jsx';

function Logo() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="10" stroke="currentColor" strokeWidth="2"/>
      <path d="M6 11 L11 6 L16 11 L11 16 Z" fill="currentColor" opacity=".35"/>
      <circle cx="11" cy="11" r="3" fill="currentColor"/>
    </svg>
  );
}

function Header() {
  return (
    <header className="header">
      <Link to="/" className="header-logo">
        <Logo />
        <span className="header-name">NZ BD Compass</span>
      </Link>

      <div className="header-divider" />

      <nav className="nav">
        <NavLink
          to="/in-licensing"
          className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
        >
          <span className="nav-label">In-Licensing Gaps</span>
          <span className="nav-sub">Engine 1 · 523 AU gaps</span>
        </NavLink>

        <NavLink
          to="/tender-clock"
          className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
        >
          <span className="nav-label">Tender Clock</span>
          <span className="nav-sub">Engine 2 · re-tender white-space</span>
        </NavLink>
      </nav>
    </header>
  );
}

export default function App() {
  return (
    <div className="shell">
      <Header />
      <Routes>
        <Route path="/"              element={<Home />} />
        <Route path="/in-licensing" element={<InLicensing />} />
        <Route path="/tender-clock" element={<TenderClockPage />} />
      </Routes>
    </div>
  );
}
