import { useEffect, useRef, useState } from 'react'
import { useLang } from '../contexts/LangContext.jsx'

// Accessible, theme-aware language dropdown. Replaces the old LangToggle, which
// hardcoded light-only colors (bg-slate-100) and broke in dark mode. Every
// surface/text/border here uses theme tokens + dark: variants, and the menu is
// direction-aware so it opens on the correct side in RTL.
export default function LanguageSelector() {
  const { lang, setLang, languages, dir, t } = useLang()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const current = languages.find((l) => l.code === lang) || languages[0]

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('language')}
        title={t('language')}
        className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-sm font-semibold
                   text-ink bg-surface-muted border border-border-soft
                   hover:bg-bg-card hover:border-border-card
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60
                   transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <span>{current.short}</span>
      </button>

      {open && (
        <ul
          role="listbox"
          className={`absolute top-full mt-2 min-w-[150px] py-1.5 z-[2000]
                      rounded-xl border border-border-soft bg-surface shadow-lg shadow-black/10
                      ${dir === 'rtl' ? 'left-0' : 'right-0'}`}
        >
          {languages.map((l) => {
            const active = l.code === lang
            return (
              <li key={l.code} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => { setLang(l.code); setOpen(false) }}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-2 text-sm text-start
                              transition-colors
                              ${active
                                ? 'text-primary font-semibold bg-primary-soft/60 dark:bg-primary/15'
                                : 'text-ink hover:bg-surface-muted'}`}
                >
                  <span>{l.label}</span>
                  <span className="text-xs text-ink-muted font-medium">{l.short}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
