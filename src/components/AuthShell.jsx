import { Link } from 'react-router-dom'
import { useLang } from '../contexts/LangContext.jsx'
import LanguageSelector from './LanguageSelector.jsx'
import ThemeToggle from './ThemeToggle.jsx'
import Icon from './ui/Icon.jsx'

// Shared layout for all authentication screens (login / register / onboarding).
// Two columns on desktop (brand panel + form); stacks to a single column with a
// compact brand header on mobile. Fully theme-aware and RTL-aware.
export default function AuthShell({ title, subtitle, children, footer }) {
  const { t, dir } = useLang()
  return (
    <div className="min-h-screen flex bg-bg-page text-ink">
      {/* Brand panel */}
      <aside className="hidden lg:flex w-[42%] max-w-[560px] relative flex-col justify-between p-12
                        bg-gradient-to-br from-primary via-primary-strong to-primary-deep text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none"
             style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,.35), transparent 40%), radial-gradient(circle at 80% 70%, rgba(255,255,255,.25), transparent 45%)' }} />
        <div className="relative">
          <Link to="/" className="inline-flex items-center gap-2 text-white no-underline">
            <span className="text-2xl font-heading font-bold tracking-tight">EZBAC</span>
          </Link>
        </div>
        <div className="relative">
          <h2 className="text-4xl font-heading font-bold leading-tight mb-4">{t('hero-title')}</h2>
          <p className="text-white/80 text-lg max-w-sm">{t('search-title')}</p>
        </div>
        <div className="relative text-white/60 text-sm">© {new Date().getFullYear()} EZBAC</div>
      </aside>

      {/* Form area */}
      <main className="flex-1 flex flex-col">
        <header className="flex items-center justify-between gap-3 p-4 sm:p-6">
          <Link to="/" className="inline-flex items-center gap-2 no-underline text-ink lg:invisible">
            <span className="text-xl font-heading font-bold text-primary">EZBAC</span>
          </Link>
          <div className="flex items-center gap-2" dir="ltr">
            <LanguageSelector />
            <ThemeToggle />
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center px-5 pb-10">
          <div className="w-full max-w-md" dir={dir}>
            <div className="mb-8 text-center sm:text-start">
              <h1 className="text-3xl font-heading font-bold mb-2">{title}</h1>
              {subtitle && <p className="text-ink-muted">{subtitle}</p>}
            </div>
            {children}
            {footer && <div className="mt-6 text-center text-sm text-ink-muted">{footer}</div>}
            <div className="mt-8 text-center">
              <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-primary transition-colors no-underline">
                <Icon name="arrowLeft" className="w-3.5 h-3.5" /> {t('auth-back-home')}
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
