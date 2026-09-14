import { useEffect, useMemo, useState } from 'react'
import DashboardNavbar from '../components/DashboardNavbar.jsx'
import FavoriteButton from '../components/FavoriteButton.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useLang } from '../contexts/LangContext.jsx'
import { getResources } from '../services/content.js'
import { PageHeader, EmptyState, Spinner, StatusBadge } from '../components/ui/kit.jsx'
import Icon from '../components/ui/Icon.jsx'

// Flat resources browser (all summaries / documents for the student's stream),
// with subject filter + search. Preserves the previous Library behavior; the new
// subject-first Library links here as "All Resources".
export default function Resources() {
  const { stream } = useAuth()
  const { t, dir } = useLang()
  const [resources, setResources] = useState([])
  const [activeSubject, setActiveSubject] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getResources(stream)
      .then((items) => { if (!cancelled) setResources(items) })
      .catch((e) => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [stream])

  const subjects = useMemo(() => {
    const s = new Set()
    resources.forEach((r) => r.subject && s.add(r.subject))
    return Array.from(s)
  }, [resources])

  const filtered = useMemo(() => {
    let out = resources
    if (activeSubject !== 'all') out = out.filter((r) => r.subject === activeSubject)
    if (search.trim()) {
      const q = search.toLowerCase()
      out = out.filter((r) => (r.title || '').toLowerCase().includes(q) || (r.subject || '').toLowerCase().includes(q))
    }
    return out
  }, [resources, activeSubject, search])

  return (
    <div dir={dir}>
      <DashboardNavbar />
      <div className="max-w-container mx-auto px-5 mt-[110px] max-md:mt-6 pb-16">
        <PageHeader title={t('resources')} subtitle={t('library')} />

        <input
          type="text"
          placeholder={t('search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md h-12 px-4 rounded-xl border border-border-card bg-surface text-ink outline-none focus:border-primary mb-4"
        />

        <div className="flex flex-wrap gap-2 mb-6">
          <button onClick={() => setActiveSubject('all')} className={`h-9 px-4 rounded-[12px] text-sm transition ${activeSubject === 'all' ? 'bg-primary-soft text-primary-strong dark:bg-primary/15 dark:text-primary-glow' : 'border border-border-soft bg-surface text-ink hover:bg-surface-muted'}`}>{t('all')}</button>
          {subjects.map((s) => (
            <button key={s} onClick={() => setActiveSubject(s)} className={`h-9 px-4 rounded-[12px] text-sm transition ${activeSubject === s ? 'bg-primary-soft text-primary-strong dark:bg-primary/15 dark:text-primary-glow' : 'border border-border-soft bg-surface text-ink hover:bg-surface-muted'}`}>{s}</button>
          ))}
        </div>

        {loading ? <Spinner label={t('loading')} />
          : error ? <EmptyState icon={<Icon name="warning" />} title={t('err-generic')} description={error} />
          : filtered.length === 0 ? <EmptyState icon={<Icon name="library" />} title={t('no-content-title')} description={t('no-content-desc')} />
          : (
            <div className="grid grid-cols-4 gap-4 max-lg:grid-cols-2 max-[600px]:grid-cols-1">
              {filtered.map((res) => (
                <div key={res.id} className="flex flex-col justify-between bg-surface border border-border-soft rounded-2xl p-5 min-h-[200px] hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(0,0,0,0.06)] transition">
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="w-11 h-11 rounded-xl bg-surface-muted flex items-center justify-center text-ink-muted mb-3"><Icon name={res.type === 'drive' ? 'folder' : 'video'} className="w-5 h-5" /></div>
                      <FavoriteButton item={{ type: 'resource', contentId: res.id, title: res.title, subjectId: res.subjectId, unitId: res.unitId, stream: res.stream }} />
                    </div>
                    {res.subject && <StatusBadge tone="primary">{res.subject}</StatusBadge>}
                    <h4 className="mt-3 text-base font-heading font-bold text-ink line-clamp-2">{res.title}</h4>
                  </div>
                  <button onClick={() => window.open(res.url, '_blank', 'noopener')} className="mt-4 w-full bg-primary text-white border-0 rounded-pill font-medium py-2.5 cursor-pointer hover:bg-primary-strong transition-colors">
                    {t('start')}
                  </button>
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  )
}
