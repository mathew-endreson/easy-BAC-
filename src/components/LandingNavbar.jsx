import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../contexts/LangContext.jsx'
import LangToggle from './LangToggle.jsx'

const navLinks = [
  { to: '/', key: 'home' },
  { to: '/courses', key: 'courses' },
  { to: '#faq', key: 'contact-us' }
]

export default function LandingNavbar() {
  const { t } = useLang()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <nav className="fixed top-0 border-b border-black/10 w-full flex justify-center z-[1000]">
        <div className="ez-container w-full flex items-center justify-between h-[105px] px-[26px] max-md:px-4 max-md:h-20 bg-white/60 backdrop-blur-[25px]">
          <div className="flex items-center gap-[60px] max-md:gap-5">
            <div className="logo">
              <Link to="/">
                <img src="/assets/images/logo.svg" alt="EZ Bac Logo" loading="lazy" className="h-[70px] max-md:h-[48px] w-auto block" />
              </Link>
            </div>
            <div className="flex gap-10 max-md:hidden font-heading">
              {navLinks.map((l, i) =>
                l.to.startsWith('#') ? (
                  <a key={l.key} href={l.to} className="no-underline text-ink text-[18px] hover:text-primary">{t(l.key)}</a>
                ) : (
                  <Link
                    key={l.key}
                    to={l.to}
                    className="no-underline text-[18px] hover:text-primary"
                    style={i === 0 ? { color: '#AB1017', fontWeight: 600 } : { color: '#141219', fontWeight: 400 }}
                  >
                    {t(l.key)}
                  </Link>
                )
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <LangToggle />
            <Link
              to="/register"
              className="max-md:hidden inline-flex items-center justify-center bg-primary text-white rounded-pill font-semibold px-8 py-4 no-underline hover:shadow-[0_10px_25px_rgba(171,16,23,0.3)]"
            >
              {t('register-now')}
            </Link>
            <div
              className="hidden max-md:flex flex-col gap-[6px] cursor-pointer p-[10px] z-[2001]"
              onClick={() => setMobileOpen(true)}
            >
              <span className="w-7 h-[3px] bg-ink rounded" />
              <span className="w-7 h-[3px] bg-ink rounded" />
              <span className="w-7 h-[3px] bg-ink rounded" />
            </div>
          </div>
        </div>
      </nav>

      <div className={`mobile-nav ${mobileOpen ? 'active' : ''}`}>
        <div className="flex justify-between items-center mb-[50px]">
          <img src="/assets/images/logo.svg" alt="EZ Bac" className="h-[50px]" />
          <div
            className="text-[40px] cursor-pointer text-primary leading-none"
            onClick={() => setMobileOpen(false)}
          >
            &times;
          </div>
        </div>
        <div className="flex flex-col gap-[30px] font-heading">
          {navLinks.map((l) =>
            l.to.startsWith('#') ? (
              <a key={l.key} href={l.to} onClick={() => setMobileOpen(false)} className="no-underline text-[1.4rem] font-bold text-ink">{t(l.key)}</a>
            ) : (
              <Link key={l.key} to={l.to} onClick={() => setMobileOpen(false)} className="no-underline text-[1.4rem] font-bold text-ink">{t(l.key)}</Link>
            )
          )}
          <div className="mt-auto pt-[30px]">
            <Link
              to="/register"
              onClick={() => setMobileOpen(false)}
              className="inline-block bg-primary text-white px-8 py-4 rounded-pill no-underline font-medium"
            >
              {t('get-started')}
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
