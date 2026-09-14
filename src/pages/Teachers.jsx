import { useEffect, useMemo, useState } from 'react'
import DashboardNavbar from '../components/DashboardNavbar.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useLang } from '../contexts/LangContext.jsx'
import { useFavorites } from '../contexts/FavoritesContext.jsx'
import { getTeachers } from '../services/academic.js'
import { PageHeader, EmptyState, LoadingGrid } from '../components/ui/kit.jsx'
import Icon from '../components/ui/Icon.jsx'

// Student-facing "My Teachers" browse (Figma: teacher cards with photo, name,
// specialization, Following pill). Teachers are admin-managed content-provider
// records (never authenticated users) — see src/services/academic.js. "Follow"
// is implemented as a real favorite (type='teacher') rather than a decorative
// toggle, so it persists and is student-specific.
export default function Teachers() {
  const { stream } = useAuth()
  const { t, dir } = useLang()
  const { isFavorite, toggleFavorite } = useFavorites()
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getTeachers()
      .then((list) => { if (!cancelled) setTeachers(list.filter((tc) => tc.status !== 'ARCHIVED')) })
      .catch((e) => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  // Teachers explicitly assigned to the student's stream first, then the rest
  // (teachers with no assigned streams are treated as visible to everyone).
  const sorted = useMemo(() => {
    const matches = (tc) => !tc.assignedStreamIds?.length || tc.assignedStreamIds.includes(stream)
    return [...teachers].sort((a, b) => Number(matches(b)) - Number(matches(a)))
  }, [teachers, stream])

  return (
    <div dir={dir}>
      <DashboardNavbar />
      <div className="max-w-container mx-auto px-5 mt-[110px] max-md:mt-6 pb-16">
        <PageHeader title={t('nav-teachers')} />

        {loading ? <LoadingGrid count={6} className="grid-cols-3 max-md:grid-cols-2 max-[520px]:grid-cols-1" />
          : error ? <EmptyState icon={<Icon name="warning" />} title={t('err-generic')} description={error} />
          : sorted.length === 0 ? <EmptyState icon={<Icon name="teacher" />} title={t('no-content-title')} description={t('no-content-desc')} />
          : (
            <div className="stagger-children grid grid-cols-3 gap-4 max-md:grid-cols-2 max-[520px]:grid-cols-1">
              {sorted.map((tc) => {
                const active = isFavorite('teacher', tc.id)
                return (
                  <div key={tc.id} className="p-5 rounded-2xl bg-surface border border-border-soft flex flex-col items-center text-center gap-3">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-primary-soft dark:bg-primary/15 flex items-center justify-center text-2xl font-heading font-bold text-primary-strong">
                      {tc.photoURL
                        ? <img src={tc.photoURL} alt="" className="w-full h-full object-cover" />
                        : (tc.name || '?').trim().charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-heading font-bold text-ink">{tc.name}</p>
                      {tc.specialization && <p className="text-xs text-ink-muted mt-0.5">{tc.specialization}</p>}
                    </div>
                    {tc.bio && <p className="text-xs text-ink-muted line-clamp-2">{tc.bio}</p>}
                    <button
                      onClick={() => toggleFavorite({ type: 'teacher', contentId: tc.id, title: tc.name })}
                      className={`mt-1 px-4 py-1.5 rounded-pill text-xs font-semibold transition-colors
                                  ${active ? 'bg-primary text-white' : 'border border-border-card text-ink hover:border-primary/50'}`}
                    >
                      {active ? t('following') : t('follow')}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
      </div>
    </div>
  )
}
