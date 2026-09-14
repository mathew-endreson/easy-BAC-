import { useTheme } from '../contexts/ThemeContext.jsx'
import { useLang } from '../contexts/LangContext.jsx'

// Sun/moon theme toggle. Theme-aware surfaces + accessible label.
export default function ThemeToggle({ className = '' }) {
  const { isDark, toggle } = useTheme()
  const { t } = useLang()
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t('theme-toggle')}
      title={t('theme-toggle')}
      className={`flex items-center justify-center w-9 h-9 rounded-[10px]
                  text-ink bg-surface-muted border border-border-soft
                  hover:bg-bg-card hover:border-border-card
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60
                  transition-colors ${className}`}
    >
      {isDark ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  )
}
