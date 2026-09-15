import { useFavorites } from '../contexts/FavoritesContext.jsx'
import { useLang } from '../contexts/LangContext.jsx'
import Icon from './ui/Icon.jsx'

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
      className={`inline-flex items-center justify-center w-10 h-10 rounded-full transition-colors
                  ${active ? 'text-primary' : 'text-ink-muted hover:text-primary'}
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${className}`}
    >
      <Icon name="heart" className="w-[18px] h-[18px]" filled={active} />
    </button>
  )
}
