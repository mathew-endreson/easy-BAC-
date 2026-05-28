import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../contexts/LangContext.jsx'
import LangToggle from './LangToggle.jsx'

export default function LandingNavbar() {
  const { t } = useLang()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <nav className="fixed top-0 border-b border-border-soft w-full flex justify-center z-[1000]">
        <div className="w-full flex items-center justify-between px-[26px] max-md:px-4 max-md:h-20 max-md:border max-md:border-white/30 bg-white/60 backdrop-blur-[12px] rounded-[20px]">
          <div className="flex items-center gap-[140px] max-md:gap-5">
            <div className="logo">
              <Link to="/">
                <img src="/assets/images/logo.svg" alt="EZ Bac Logo" loading="lazy" className="h-[100px] max-md:h-[55px] w-auto block" />
              </Link>
            </div>
            <div className="flex gap-8 max-md:hidden">
              <Link to="/" className="no-underline text-ink font-medium text-[1.1rem]" style={{ color: '#AB1017', fontWeight: 600 }}>{t('home')}</Link>
              <Link to="/games" className="no-underline text-ink font-medium hover:text-primary">{t('courses')}</Link>
              <a href="#faq" className="no-underline text-ink font-medium hover:text-primary">{t('faq')}</a>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <LangToggle />
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
        <div className="flex flex-col gap-[30px]">
          <Link to="/" onClick={() => setMobileOpen(false)} className="no-underline text-[1.4rem] font-bold text-primary">{t('home')}</Link>
          <Link to="/games" onClick={() => setMobileOpen(false)} className="no-underline text-[1.4rem] font-bold text-ink">{t('courses')}</Link>
          <a href="#faq" onClick={() => setMobileOpen(false)} className="no-underline text-[1.4rem] font-bold text-ink">{t('faq')}</a>
          <div className="mt-auto pt-[30px]">
            <Link
              to="/home"
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
