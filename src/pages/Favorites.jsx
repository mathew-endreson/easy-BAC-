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
      navigate(`/teachers/${fav.contentId}`)
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
                if (fav.type === 'teacher') {
                  return (
                    <div key={fav.id} className="flex flex-col items-center text-center gap-2 bg-surface border border-border-soft rounded-2xl p-5">
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-primary-soft dark:bg-primary/15 flex items-center justify-center text-xl font-heading font-bold text-primary-strong shrink-0">
                        {fav.photoURL ? <img src={fav.photoURL} alt="" className="w-full h-full object-cover" /> : (fav.title || '?').trim().charAt(0).toUpperCase()}
                      </div>
                      <h4 className="font-heading font-bold text-ink line-clamp-2">{fav.title || t('content')}</h4>
                      {fav.specialization && <p className="text-xs text-ink-muted">{fav.specialization}</p>}
                      <div className="flex items-center gap-2 mt-1">
                        <button onClick={() => open(fav)} className="px-4 py-1.5 rounded-pill text-xs font-semibold border border-border-card text-ink hover:border-primary/50 transition-colors">{t('teacher')}</button>
                        <FavoriteButton item={{ type: 'teacher', contentId: fav.contentId, title: fav.title }} />
                      </div>
                    </div>
                  )
                }
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
