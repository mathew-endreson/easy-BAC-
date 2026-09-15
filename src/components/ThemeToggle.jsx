import { useTheme } from '../contexts/ThemeContext.jsx'
import { useLang } from '../contexts/LangContext.jsx'
import Icon from './ui/Icon.jsx'

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
      className={`flex items-center justify-center w-10 h-10 rounded-[10px]
                  text-ink bg-surface-muted border border-border-soft
                  hover:bg-bg-card hover:border-border-card
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60
                  transition-colors ${className}`}
    >
      <Icon name={isDark ? 'sun' : 'moon'} className="w-[18px] h-[18px]" />
    </button>
  )
}
