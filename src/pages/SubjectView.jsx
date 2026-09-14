import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import DashboardNavbar from '../components/DashboardNavbar.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useLang } from '../contexts/LangContext.jsx'
import { getSubjectById, getUnits } from '../services/academic.js'
import { getUnitCounts } from '../services/content.js'
import { PageHeader, EmptyState, LoadingGrid, StatusBadge } from '../components/ui/kit.jsx'
import Icon from '../components/ui/Icon.jsx'

// Units of a subject. Each unit card shows real content counts for the student's
// stream, then links into the unit's content.
export default function SubjectView() {
  const { subjectId } = useParams()
  const navigate = useNavigate()
  const { stream } = useAuth()
  const { t, dir } = useLang()
  const [subject, setSubject] = useState(null)
  const [units, setUnits] = useState([])
  const [counts, setCounts] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    async function load() {
      const [subj, us] = await Promise.all([getSubjectById(subjectId), getUnits(subjectId)])
      if (cancelled) return
      setSubject(subj)
      setUnits(us.filter((u) => u.status !== 'ARCHIVED'))
      setLoading(false)
      // Content counts per unit (parallel; small N).
      const entries = await Promise.all(us.map(async (u) => [u.id, await getUnitCounts(u.id, stream)]))
      if (!cancelled) setCounts(Object.fromEntries(entries))
    }
    load().catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [subjectId, stream])

  return (
    <div dir={dir}>
      <DashboardNavbar />
      <div className="max-w-container mx-auto px-5 mt-[110px] max-md:mt-6 pb-16">
        <Link to="/library" className="text-sm text-ink-muted hover:text-primary no-underline">← {t('library')}</Link>
        <PageHeader title={subject?.name || t('subjects')} subtitle={t('units')} />

        {loading ? <LoadingGrid count={6} className="grid-cols-3 max-md:grid-cols-2 max-[520px]:grid-cols-1" />
          : units.length === 0 ? <EmptyState icon={<Icon name="inbox" />} title={t('no-content-title')} description={t('no-content-desc')} />
          : (
            <div className="stagger-children grid grid-cols-3 gap-4 max-md:grid-cols-2 max-[520px]:grid-cols-1">
              {units.map((u) => {
                const c = counts[u.id]
                return (
                  <button key={u.id} onClick={() => navigate(`/library/unit/${u.id}`)}
                    className="text-start p-5 rounded-2xl bg-surface border border-border-soft hover:border-primary/50 hover:-translate-y-0.5 transition-all">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[#bbb] text-sm font-mono">{String(u.order ?? 0).padStart(2, '0')}</span>
                      <h4 className="font-heading font-bold text-ink flex-1 min-w-0 truncate">{u.name}</h4>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {c ? (
                        <>
                          {c.resources > 0 && <StatusBadge tone="neutral">{c.resources} {t('resources')}</StatusBadge>}
                          {c.quizzes > 0 && <StatusBadge tone="primary">{c.quizzes} {t('quizzes')}</StatusBadge>}
                          {c.flashcards > 0 && <StatusBadge tone="info">{c.flashcards} {t('flashcards')}</StatusBadge>}
                          {c.resources + c.quizzes + c.flashcards === 0 && <span className="text-xs text-ink-muted">—</span>}
                        </>
                      ) : <span className="text-xs text-ink-muted">…</span>}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
      </div>
    </div>
  )
}
