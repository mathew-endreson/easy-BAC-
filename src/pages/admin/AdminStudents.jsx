import { useEffect, useMemo, useState } from 'react'
import { useLang } from '../../contexts/LangContext.jsx'
import { STREAMS, streamLabel } from '../../constants/streams.js'
import { wilayaLabel } from '../../constants/wilayas.js'
import {
  getAllStudents, getStudentCount, setStudentDisabled, summarizeStudents, toMillis, getFavoritesCount
} from '../../services/adminStudents.js'

// Super Admin → Students: real usage analytics + a searchable/filterable table.
// Deliberately does NOT show quiz scores / video-watch stats / study-plan
// progress — that data isn't tracked yet (flagged as a pending phase). Every
// number shown here comes from an actual Firestore field; nothing is invented.
const PAGE_SIZE = 20

function fmtDate(ts, lang) {
  const ms = toMillis(ts)
  if (!ms) return '—'
  return new Date(ms).toLocaleDateString(lang === 'ar' ? 'ar-DZ' : lang === 'fr' ? 'fr-FR' : 'en-GB', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

export default function AdminStudents({ showToast }) {
  const { t, lang } = useLang()
  const [students, setStudents] = useState([])
  const [totalCount, setTotalCount] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [streamFilter, setStreamFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // all | complete | incomplete
  const [page, setPage] = useState(1)
  const [busyId, setBusyId] = useState(null)

  async function load() {
    setLoading(true); setError('')
    try {
      const [list, count] = await Promise.all([getAllStudents(), getStudentCount()])
      setStudents(list)
      setTotalCount(count)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const stats = useMemo(() => summarizeStudents(students), [students])

  const filtered = useMemo(() => {
    let out = students
    if (streamFilter) out = out.filter((s) => s.bacStream === streamFilter)
    if (statusFilter === 'complete') out = out.filter((s) => s.profileCompleted)
    if (statusFilter === 'incomplete') out = out.filter((s) => !s.profileCompleted)
    if (search.trim()) {
      const q = search.toLowerCase()
      out = out.filter((s) => (s.displayName || '').toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q))
    }
    return out.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt))
  }, [students, streamFilter, statusFilter, search])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Fetch favorites counts lazily, only for the rows actually visible on this
  // page (bounded reads — never one query per student in the whole dataset).
  useEffect(() => {
    let cancelled = false
    const targets = pageItems.filter((s) => s.favoritesCount === undefined)
    if (targets.length === 0) return
    Promise.all(targets.map((s) => getFavoritesCount(s.id).then((n) => [s.id, n]).catch(() => [s.id, null])))
      .then((pairs) => {
        if (cancelled) return
        const map = Object.fromEntries(pairs)
        setStudents((prev) => prev.map((s) => (s.id in map ? { ...s, favoritesCount: map[s.id] } : s)))
      })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, students.length, search, streamFilter, statusFilter])

  async function toggleDisabled(s) {
    setBusyId(s.id)
    try {
      await setStudentDisabled(s.id, !s.disabled)
      setStudents((prev) => prev.map((x) => x.id === s.id ? { ...x, disabled: !s.disabled } : x))
      showToast?.(!s.disabled ? 'Student disabled' : 'Student enabled')
    } catch (e) {
      setError(e.message)
    } finally {
      setBusyId(null)
    }
  }

  const streamEntries = Object.entries(stats.byStream).sort((a, b) => b[1] - a[1])

  return (
    <section className="bg-surface p-10 rounded-[24px] shadow-[0_10px_30px_rgba(0,0,0,0.05)] mb-[30px] fade-in-anim max-[850px]:p-5 max-[850px]:rounded-xl">
      <h2>{t('admin-students')}</h2>
      <p className="text-ink-muted text-sm mt-1 mb-6">
        Real usage data derived from actual student profiles. Quiz/video/study-plan analytics will appear here once progress tracking is implemented.
      </p>

      {error && <p className="text-primary-strong text-sm mb-3">{error}</p>}

      {/* Stat strip */}
      <div className="grid grid-cols-4 gap-3 mb-6 max-[850px]:grid-cols-2">
        <div className="p-4 rounded-xl bg-primary-pale dark:bg-primary/10 border border-primary/20">
          <p className="text-2xl font-bold text-primary-strong">{loading ? '…' : (totalCount ?? stats.total)}</p>
          <p className="text-xs text-ink-muted mt-1">{t('total-students')}</p>
        </div>
        <div className="p-4 rounded-xl bg-surface-muted border border-border-soft">
          <p className="text-2xl font-bold text-ink">{loading ? '…' : stats.newThisWeek}</p>
          <p className="text-xs text-ink-muted mt-1">{t('new-this-week')}</p>
        </div>
        <div className="p-4 rounded-xl bg-surface-muted border border-border-soft">
          <p className="text-2xl font-bold text-ink">{loading ? '…' : `${stats.completionRate}%`}</p>
          <p className="text-xs text-ink-muted mt-1">{t('profile-completion')}</p>
        </div>
        <div className="p-4 rounded-xl bg-surface-muted border border-border-soft">
          <p className="text-2xl font-bold text-ink">{loading ? '…' : streamEntries.length}</p>
          <p className="text-xs text-ink-muted mt-1">{t('by-stream')}</p>
        </div>
      </div>

      {!loading && streamEntries.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {streamEntries.map(([id, n]) => (
            <span key={id} className="text-xs px-2.5 py-1 rounded-full bg-surface-muted text-ink-muted">
              {streamLabel(id, 'ar')}: <strong>{n}</strong>
            </span>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder={t('search-students')}
          className="flex-1 min-w-[220px] p-2.5 border-2 border-border-card rounded-lg text-sm focus:border-primary-strong focus:outline-none"
        />
        <select value={streamFilter} onChange={(e) => { setStreamFilter(e.target.value); setPage(1) }} className="p-2.5 border-2 border-border-card rounded-lg text-sm">
          <option value="">{t('all-streams')}</option>
          {STREAMS.map((s) => <option key={s.id} value={s.id}>{streamLabel(s.id, 'ar')}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="p-2.5 border-2 border-border-card rounded-lg text-sm">
          <option value="all">{t('all')}</option>
          <option value="complete">{t('status-complete')}</option>
          <option value="incomplete">{t('status-incomplete')}</option>
        </select>
      </div>

      {loading ? (
        <p className="text-ink-muted text-sm">{t('loading')}</p>
      ) : pageItems.length === 0 ? (
        <p className="text-ink-muted text-sm">{t('no-students-found')}</p>
      ) : (
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm border-collapse min-w-[720px]">
            <thead>
              <tr className="text-left text-ink-muted border-b border-border-soft">
                <th className="py-2 px-2 font-semibold">{t('student')}</th>
                <th className="py-2 px-2 font-semibold">{t('by-stream').replace(/^By /, '')}</th>
                <th className="py-2 px-2 font-semibold">{t('wilaya')}</th>
                <th className="py-2 px-2 font-semibold">{t('profile-completion')}</th>
                <th className="py-2 px-2 font-semibold">{t('joined')}</th>
                <th className="py-2 px-2 font-semibold">{t('last-active')}</th>
                <th className="py-2 px-2 font-semibold">{t('favorites')}</th>
                <th className="py-2 px-2 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((s) => (
                <tr key={s.id} className="border-b border-border-soft hover:hover:bg-surface-muted">
                  <td className="py-2.5 px-2">
                    <p className="font-semibold text-ink">{s.displayName || '—'}</p>
                    <p className="text-xs text-ink-muted">{s.email}</p>
                  </td>
                  <td className="py-2.5 px-2">{s.bacStream ? streamLabel(s.bacStream, 'ar') : '—'}</td>
                  <td className="py-2.5 px-2">{s.wilaya ? wilayaLabel(s.wilaya, lang) : '—'}</td>
                  <td className="py-2.5 px-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${s.profileCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {s.profileCompleted ? t('status-complete') : t('status-incomplete')}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-ink-muted">{fmtDate(s.createdAt, lang)}</td>
                  <td className="py-2.5 px-2 text-ink-muted">{s.lastLoginAt ? fmtDate(s.lastLoginAt, lang) : t('never')}</td>
                  <td className="py-2.5 px-2 text-ink-muted">{typeof s.favoritesCount === 'number' ? s.favoritesCount : '—'}</td>
                  <td className="py-2.5 px-2 text-right">
                    <button
                      onClick={() => toggleDisabled(s)}
                      disabled={busyId === s.id}
                      className={`text-xs px-3 py-1.5 rounded-lg font-semibold border-0 cursor-pointer disabled:opacity-50 ${s.disabled ? 'bg-emerald-100 text-emerald-700' : 'bg-red-50 text-primary-strong'}`}
                    >
                      {s.disabled ? t('enable') : t('disable')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-3 mt-5">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 rounded-lg bg-surface-muted text-sm disabled:opacity-40">←</button>
          <span className="text-sm text-ink-muted">{page} / {pageCount}</span>
          <button disabled={page >= pageCount} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 rounded-lg bg-surface-muted text-sm disabled:opacity-40">→</button>
        </div>
      )}
    </section>
  )
}
