import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardNavbar from '../components/DashboardNavbar.jsx'
import FavoriteButton from '../components/FavoriteButton.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useFavorites } from '../contexts/FavoritesContext.jsx'
import { useLang } from '../contexts/LangContext.jsx'
import { getContentById } from '../services/content.js'
import { PageHeader, EmptyState, Spinner, StatusBadge } from '../components/ui/kit.jsx'
import Icon from '../components/ui/Icon.jsx'

const TYPE_META = {
  resource: { icon: 'folder', labelKey: 'resources' },
  quiz: { icon: 'quiz', labelKey: 'quizzes' },
  flashcard: { icon: 'cards', labelKey: 'flashcards' },
  teacher: { icon: 'teacher', labelKey: 'teachers' }
}
const FILTERS = ['all', 'resource', 'quiz', 'flashcard', 'teacher']

export default function Favorites() {
  const navigate = useNavigate()
  const { stream } = useAuth()
  const { favorites, loading, toggleFavorite } = useFavorites()
  const { t, dir } = useLang()
  const [filter, setFilter] = useState('all')

  const visible = useMemo(
    () => (filter === 'all' ? favorites : favorites.filter((f) => f.type === filter)),
    [favorites, filter]
  )

  async function open(fav) {
    if (fav.type === 'quiz') {
      localStorage.setItem('selectedQuizId', fav.contentId)
      navigate('/quiz')
    } else if (fav.type === 'resource') {
      const res = await getContentById('resources', fav.contentId, stream)
      if (res?.url) window.open(res.url, '_blank', 'noopener')
    } else if (fav.type === 'teacher') {
      navigate('/teachers')
    } else if (fav.unitId) {
      navigate(`/library/unit/${fav.unitId}`)
    }
  }

  return (
    <div dir={dir}>
      <DashboardNavbar />
      <div className="max-w-container mx-auto px-5 mt-[110px] max-md:mt-6 pb-16">
        <PageHeader title={t('nav-favorites')} />

        <div className="flex flex-wrap gap-2 mb-6">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`h-9 px-4 rounded-[12px] text-sm transition ${filter === f ? 'bg-primary-soft text-primary-strong dark:bg-primary/15 dark:text-primary-glow' : 'border border-border-soft bg-surface text-ink hover:bg-surface-muted'}`}>
              {f === 'all' ? t('all') : t(TYPE_META[f].labelKey)}
            </button>
          ))}
        </div>

        {loading ? <Spinner label={t('loading')} />
          : visible.length === 0 ? (
            <EmptyState
              icon={<Icon name="star" />}
              title={t('no-favorites-title')}
              description={t('no-favorites-desc')}
              action={<button onClick={() => navigate('/library')} className="px-5 py-2.5 rounded-pill bg-primary text-white font-semibold hover:bg-primary-strong transition-colors">{t('explore-library')}</button>}
            />
          ) : (
            <div className="stagger-children grid grid-cols-3 gap-4 max-md:grid-cols-2 max-[520px]:grid-cols-1">
              {visible.map((fav) => {
                const meta = TYPE_META[fav.type] || { icon: 'book', labelKey: 'content' }
                return (
                  <div key={fav.id} className="flex flex-col bg-surface border border-border-soft rounded-2xl p-4">
                    <div className="flex items-start justify-between">
                      <span className="w-9 h-9 rounded-lg bg-surface-muted flex items-center justify-center text-ink-muted"><Icon name={meta.icon} className="w-[18px] h-[18px]" /></span>
                      <FavoriteButton item={{ type: fav.type, contentId: fav.contentId, title: fav.title, subjectId: fav.subjectId, unitId: fav.unitId, stream: fav.stream }} />
                    </div>
                    <StatusBadge tone="primary">{t(meta.labelKey)}</StatusBadge>
                    <h4 className="mt-2 font-heading font-bold text-ink line-clamp-2 flex-1">{fav.title || t('content')}</h4>
                    <button onClick={() => open(fav)} className="mt-3 text-sm font-semibold text-primary hover:underline text-start">{t('start')} →</button>
                  </div>
                )
              })}
            </div>
          )}
      </div>
    </div>
  )
}
