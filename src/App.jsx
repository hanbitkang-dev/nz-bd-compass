import { useState, useEffect } from 'react'
import { Routes, Route, NavLink, Link } from 'react-router-dom'
import Home from './pages/Home.jsx'
import InLicensing from './pages/InLicensing.jsx'
import TenderClockPage from './pages/TenderClockPage.jsx'
import './compass.css'

function LogoMark() {
  return (
    <span className="cmp-logo-mark" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="#fff" strokeWidth="1.6"/>
        <path d="M12 12 16.5 6.5 13.2 12.8 12 12z" fill="#fff"/>
        <path d="M12 12 7.5 17.5 10.8 11.2 12 12z" fill="#fff" opacity="0.5"/>
        <circle cx="12" cy="12" r="1.8" fill="#fff"/>
      </svg>
    </span>
  )
}

const IcSun = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4.5"/>
    <path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/>
  </svg>
)
const IcMoon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z"/>
  </svg>
)

function Header({ dark, onToggleDark }) {
  return (
    <header className="cmp-header">
      <div className="cmp-header-inner">
        <Link to="/" className="cmp-logo" aria-label="NZ BD Compass — home">
          <LogoMark />
          <span className="cmp-logo-text">NZ <b>BD Compass</b></span>
        </Link>

        <span className="cmp-header-sub">NZ pharmaceutical BD intelligence</span>

        <nav className="cmp-nav">
          <NavLink to="/" end className={({ isActive }) => `cmp-nav-link${isActive ? ' active' : ''}`}>
            Compass
          </NavLink>
          <NavLink to="/in-licensing" className={({ isActive }) => `cmp-nav-link${isActive ? ' active' : ''}`}>
            In-Licensing
          </NavLink>
          <NavLink to="/tender-clock" className={({ isActive }) => `cmp-nav-link${isActive ? ' active' : ''}`}>
            Tender Clock
          </NavLink>
        </nav>

        <div className="cmp-header-meta">
          <span className="cmp-live">
            <span className="dot" />
            Live · as of <b>Jun 2026</b>
          </span>
          <button className="cmp-theme" onClick={onToggleDark} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
            {dark ? IcSun : IcMoon}
          </button>
        </div>
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer className="cmp-footer">
      <div className="cmp-footer-inner">
        <span className="cmp-footer-brand">
          <LogoMark />
          NZ BD Compass
        </span>
        <span className="cmp-footer-note">
          A business-development analysis tool, not a regulatory determination. Figures are
          cross-referenced from public PHARMAC &amp; AU PBS sources. As of June 2026.
        </span>
      </div>
    </footer>
  )
}

export default function App() {
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem('cmp-theme') === 'dark' } catch { return false }
  })

  useEffect(() => {
    document.documentElement.classList.toggle('theme-dark', dark)
    document.body.classList.toggle('theme-dark', dark)
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
    try { localStorage.setItem('cmp-theme', dark ? 'dark' : 'light') } catch {}
  }, [dark])

  return (
    <div className="cmp-app">
      <Header dark={dark} onToggleDark={() => setDark(d => !d)} />
      <main>
        <Routes>
          <Route path="/"              element={<Home />} />
          <Route path="/in-licensing" element={<InLicensing />} />
          <Route path="/tender-clock" element={<TenderClockPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
