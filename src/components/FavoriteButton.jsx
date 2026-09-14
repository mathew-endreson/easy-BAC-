import { useFavorites } from '../contexts/FavoritesContext.jsx'
import { useLang } from '../contexts/LangContext.jsx'

// Icon-only favorite toggle with an accessible label. `item` must carry at least
// { type, contentId }; extra fields (title/subjectId/unitId/stream) are stored so
// the Favorites page can render and re-locate the content.
export default function FavoriteButton({ item, className = '' }) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const { t } = useLang()
  const active = isFavorite(item.type, item.contentId)

  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); e.preventDefault(); toggleFavorite(item) }}
      aria-pressed={active}
      aria-label={active ? t('saved') : t('favorite')}
      title={active ? t('saved') : t('favorite')}
      className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors
                  ${active ? 'text-primary' : 'text-ink-muted hover:text-primary'}
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${className}`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  )
}
