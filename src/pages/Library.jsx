import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardNavbar from '../components/DashboardNavbar.jsx'
import FavoriteButton from '../components/FavoriteButton.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useLang } from '../contexts/LangContext.jsx'
import { useFavorites } from '../contexts/FavoritesContext.jsx'
import { streamLabel } from '../constants/streams.js'
import { getSubjects } from '../services/academic.js'
import { getResources } from '../services/content.js'
import { PageHeader, SubjectCard, EmptyState, Spinner, LoadingGrid, StatusBadge } from '../components/ui/kit.jsx'
import Icon from '../components/ui/Icon.jsx'

// Library sidebar sections, matching the platform's Figma reference (Overview /
// My Saves / My Resumes / My Flashcards / My Tests / My Teachers). 'overview',
// 'saves' and 'resumes' render inline (real data, fetched on demand); the rest
// navigate to their dedicated flow — quizzes/flashcards need a subject picked
// first (see Games.jsx) and Teachers has its own full page. (Figma's "My Books"
// isn't a distinct content type in this data model, so it isn't duplicated here
// as a second identical tab — see UnitView/Resources for the real content.)
const FAV_TYPE_LABEL = { resource: 'resources', quiz: 'quizzes', flashcard: 'flashcards', teacher: 'teachers' }

const SECTIONS = [
  { id: 'overview', labelKey: 'subjects', mode: 'inline' },
  { id: 'saves', labelKey: 'nav-favorites', mode: 'inline' },
  { id: 'resumes', labelKey: 'resources', mode: 'inline' },
  { id: 'flashcards', labelKey: 'flashcards', mode: 'link', to: '/flashcard-decks' },
  { id: 'tests', labelKey: 'quizzes', mode: 'link', to: '/quizzes' },
  { id: 'courses', labelKey: 'video-courses', mode: 'link', to: '/courses' },
  { id: 'teachers', labelKey: 'nav-teachers', mode: 'link', to: '/teachers' }
]

export default function Library() {
  const navigate = useNavigate()
  const { stream } = useAuth()
  const { t, lang, dir } = useLang()
  const { favorites, loading: favLoading } = useFavorites()
  const [section, setSection] = useState('overview')

  const [subjects, setSubjects] = useState([])
  const [subjLoading, setSubjLoading] = useState(true)
  const [subjError, setSubjError] = useState('')
  const [search, setSearch] = useState('')

  const [resources, setResources] = useState([])
  const [resLoading, setResLoading] = useState(false)
  const [resError, setResError] = useState('')
  const [resFetched, setResFetched] = useState(false)

  useEffect(() => {
    let cancelled = false
    setSubjLoading(true)
    getSubjects(stream)
      .then((s) => { if (!cancelled) setSubjects(s.filter((x) => x.status !== 'ARCHIVED')) })
      .catch((e) => { if (!cancelled) setSubjError(e.message) })
      .finally(() => { if (!cancelled) setSubjLoading(false) })
    return () => { cancelled = true }
  }, [stream])

  // Resources are only fetched once the resources-backed tab is actually opened.
  useEffect(() => {
    if (section !== 'resumes' || resFetched) return
    let cancelled = false
    setResLoading(true)
    getResources(stream)
      .then((r) => { if (!cancelled) { setResources(r); setResFetched(true) } })
      .catch((e) => { if (!cancelled) setResError(e.message) })
      .finally(() => { if (!cancelled) setResLoading(false) })
    return () => { cancelled = true }
  }, [section, stream, resFetched])

  const visibleSubjects = useMemo(() => {
    if (!search.trim()) return subjects
    const q = search.toLowerCase()
    return subjects.filter((s) => (s.name || '').toLowerCase().includes(q))
  }, [subjects, search])

  function selectSection(sec) {
    if (sec.mode === 'link') { navigate(sec.to); return }
    setSection(sec.id)
  }

  return (
    <div dir={dir}>
      <DashboardNavbar />
      <div className="max-w-container mx-auto px-5 mt-[110px] max-md:mt-6 pb-16">
        <PageHeader title={t('library')} subtitle={stream ? streamLabel(stream, lang) : ''} />

        {/* Mobile: horizontal section chips. Desktop: sticky sidebar (below). */}
        <div className="flex lg:hidden gap-2 overflow-x-auto no-scrollbar pb-4 mb-2 -mx-1 px-1">
          {SECTIONS.map((sec) => (
            <button
              key={sec.id}
              onClick={() => selectSection(sec)}
              className={`shrink-0 h-9 px-4 rounded-[12px] text-sm transition whitespace-nowrap
                          ${section === sec.id && sec.mode === 'inline'
                            ? 'bg-primary-soft text-primary-strong dark:bg-primary/15 dark:text-primary-glow'
                            : 'border border-border-soft bg-surface text-ink hover:bg-surface-muted'}`}
            >
              {t(sec.labelKey)}
            </button>
          ))}
        </div>

        <div className="flex gap-6 items-start">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-[220px] shrink-0 sticky top-[130px] bg-surface border border-border-soft rounded-2xl p-3">
            <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">{t('library')}</p>
            <nav className="flex flex-col gap-1">
              {SECTIONS.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => selectSection(sec)}
                  className={`text-start px-3 py-2 rounded-xl text-sm font-medium transition-colors
                              ${section === sec.id && sec.mode === 'inline'
                                ? 'bg-primary-soft text-primary-strong dark:bg-primary/15 dark:text-primary-glow'
                                : 'text-ink hover:bg-surface-muted'}`}
                >
                  {t(sec.labelKey)}
                </button>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {section === 'overview' && (
              <>
                <input
                  type="text"
                  placeholder={t('search')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full max-w-md h-12 px-4 rounded-xl border border-border-card bg-surface text-ink outline-none focus:border-primary mb-5"
                />
                {subjLoading ? <LoadingGrid count={6} className="grid-cols-3 max-md:grid-cols-2 max-[520px]:grid-cols-1" />
                  : subjError ? <EmptyState icon={<Icon name="warning" />} title={t('err-generic')} description={subjError} />
                  : visibleSubjects.length === 0 ? (
                    <EmptyState
                      icon={<Icon name="book" />}
                      title={t('no-subjects-title')}
                      description={t('no-subjects-desc')}
                      action={<button onClick={() => navigate('/resources')} className="px-5 py-2.5 rounded-pill bg-primary text-white font-semibold hover:bg-primary-strong transition-colors">{t('explore-library')}</button>}
                    />
                  ) : (
                    <div className="stagger-children grid grid-cols-3 gap-4 max-md:grid-cols-2 max-[520px]:grid-cols-1">
                      {visibleSubjects.map((s) => (
                        <SubjectCard key={s.id} name={s.name} onClick={() => navigate(`/library/subject/${s.id}`)} />
                      ))}
                    </div>
                  )}
              </>
            )}

            {section === 'saves' && (
              favLoading ? <Spinner label={t('loading')} />
                : favorites.length === 0 ? (
                  <EmptyState icon="⭐" title={t('no-favorites-title')} description={t('no-favorites-desc')}
                    action={<button onClick={() => navigate('/favorites')} className="px-5 py-2.5 rounded-pill bg-primary text-white font-semibold hover:bg-primary-strong transition-colors">{t('nav-favorites')}</button>} />
                ) : (
                  <div className="stagger-children grid grid-cols-3 gap-4 max-md:grid-cols-2 max-[520px]:grid-cols-1">
                    {favorites.map((fav) => (
                      <div key={fav.id} className="flex flex-col bg-surface border border-border-soft rounded-2xl p-4">
                        <div className="flex items-start justify-between">
                          <StatusBadge tone="primary">{t(FAV_TYPE_LABEL[fav.type] || 'content')}</StatusBadge>
                          <FavoriteButton item={{ type: fav.type, contentId: fav.contentId, title: fav.title, subjectId: fav.subjectId, unitId: fav.unitId, stream: fav.stream }} />
                        </div>
                        <h4 className="mt-2 font-heading font-bold text-ink line-clamp-2">{fav.title || t('content')}</h4>
                      </div>
                    ))}
                  </div>
                )
            )}

            {section === 'resumes' && (
              resLoading ? <Spinner label={t('loading')} />
                : resError ? <EmptyState icon={<Icon name="warning" />} title={t('err-generic')} description={resError} />
                : resources.length === 0 ? <EmptyState icon={<Icon name="folder" />} title={t('no-content-title')} description={t('no-content-desc')} />
                : (
                  <div className="stagger-children grid grid-cols-3 gap-4 max-md:grid-cols-2 max-[520px]:grid-cols-1">
                    {resources.map((res) => (
                      <div key={res.id} className="flex flex-col justify-between bg-surface border border-border-soft rounded-2xl p-4 min-h-[160px]">
                        <div>
                          <div className="flex items-start justify-between">
                            <span className="w-9 h-9 shrink-0 rounded-lg bg-surface-muted flex items-center justify-center text-ink-muted"><Icon name={res.type === 'drive' ? 'folder' : 'video'} className="w-[18px] h-[18px]" /></span>
                            <FavoriteButton item={{ type: 'resource', contentId: res.id, title: res.title, subjectId: res.subjectId, unitId: res.unitId, stream: res.stream }} />
                          </div>
                          {res.subject && <StatusBadge tone="neutral">{res.subject}</StatusBadge>}
                          <h4 className="mt-2 font-heading font-bold text-ink line-clamp-2">{res.title}</h4>
                        </div>
                        <button onClick={() => window.open(res.url, '_blank', 'noopener')} className="mt-3 text-sm font-semibold text-primary hover:underline text-start">{t('start')} →</button>
                      </div>
                    ))}
                  </div>
                )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
