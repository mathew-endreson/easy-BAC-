import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../contexts/LangContext.jsx'
import LanguageSelector from './LanguageSelector.jsx'
import ThemeToggle from './ThemeToggle.jsx'
import UserMenu from './UserMenu.jsx'
import Icon from './ui/Icon.jsx'

export default function LandingNavbar() {
  const { t } = useLang()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Match the video modal's behavior: lock background scroll while the drawer
  // is open, and let Escape close it (a real modal/drawer, not just a panel
  // that happens to slide over unscrollable-looking content).
  useEffect(() => {
    if (!mobileOpen) return
    document.body.style.overflow = 'hidden'
    const onKey = (e) => e.key === 'Escape' && setMobileOpen(false)
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKey)
    }
  }, [mobileOpen])

  return (
    <>
      <nav className="fixed top-0 border-b border-border-soft w-full flex justify-center z-[1000]">
        <div className="w-full flex items-center justify-between px-[26px] max-md:px-4 max-md:h-20 max-md:border max-md:border-border-soft/40 bg-bg-soft/70 backdrop-blur-[12px] rounded-[20px]">
          <div className="flex items-center gap-[140px] max-md:gap-5">
            <div className="logo">
              <Link to="/">
                <img src="/assets/images/logo.svg" alt="EZ Bac Logo" loading="lazy" className="h-[100px] max-md:h-[55px] w-auto block" />
              </Link>
            </div>
            <div className="flex gap-8 max-md:hidden">
              <Link to="/" className="no-underline font-semibold text-lg text-primary">{t('home')}</Link>
              <Link to="/courses" className="no-underline text-ink font-medium hover:text-primary">{t('courses')}</Link>
              <a href="#faq" className="no-underline text-ink font-medium hover:text-primary">{t('faq')}</a>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LanguageSelector />
            <ThemeToggle />
            <div className="max-md:hidden"><UserMenu /></div>
            <button
              type="button"
              aria-label={t('open-menu')}
              aria-expanded={mobileOpen}
              className="hidden max-md:flex flex-col items-center justify-center gap-[5px] w-10 h-10 z-[2001]"
              onClick={() => setMobileOpen(true)}
            >
              <span className="w-6 h-[2px] bg-ink rounded-full" />
              <span className="w-6 h-[2px] bg-ink rounded-full" />
              <span className="w-6 h-[2px] bg-ink rounded-full" />
            </button>
          </div>
        </div>
      </nav>

      {/* Backdrop — dims + blocks the page behind the drawer, and doubles as
          a click-outside-to-close target (consistent with the video modal). */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] transition-opacity duration-300
                    ${mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      <div className={`mobile-nav ${mobileOpen ? 'active' : ''}`} role="dialog" aria-modal="true" aria-label={t('open-menu')}>
        <div className="flex justify-between items-center mb-10">
          <img src="/assets/images/logo.svg" alt="EZ Bac" className="h-11" />
          <button
            type="button"
            aria-label={t('close')}
            onClick={() => setMobileOpen(false)}
            className="w-10 h-10 flex items-center justify-center rounded-full text-primary hover:bg-surface-muted transition-colors -me-1.5"
          >
            <Icon name="close" className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>
        <div className="flex-1 flex flex-col gap-7">
          <Link to="/" onClick={() => setMobileOpen(false)} className="no-underline text-2xl font-bold text-primary">{t('home')}</Link>
          <Link to="/courses" onClick={() => setMobileOpen(false)} className="no-underline text-2xl font-bold text-ink">{t('courses')}</Link>
          <a href="#faq" onClick={() => setMobileOpen(false)} className="no-underline text-2xl font-bold text-ink">{t('faq')}</a>
          <div className="mt-auto pt-8">
            <Link
              to="/library"
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
