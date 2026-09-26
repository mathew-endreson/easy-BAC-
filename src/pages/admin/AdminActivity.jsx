import { useCallback, useEffect, useMemo, useState } from 'react'
import { streamLabel } from '../../constants/streams.js'
import { getOnlineNow, getLogsSince } from '../../services/activity.js'

// Super Admin → Activity: who is on the platform right now, how many distinct
// students were active today / this week, and a live feed of recent events.
// Online = presence heartbeat within the last 3 minutes. Auto-refreshes every 30s.
const DAY = 24 * 60 * 60 * 1000
const TYPE_LABEL = { session_start: 'Signed in', page_view: 'Viewed' }

function startOfToday() { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime() }
const ms = (ts) => (ts?.toMillis ? ts.toMillis() : 0)
function ago(t) {
  const s = Math.max(0, Math.round((Date.now() - t) / 1000))
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.round(s / 60)}m ago`
  if (s < 86400) return `${Math.round(s / 3600)}h ago`
  return `${Math.round(s / 86400)}d ago`
}

export default function AdminActivity() {
  const [online, setOnline] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [range, setRange] = useState('today') // today | week
  const [typeFilter, setTypeFilter] = useState('all')

  const load = useCallback(async () => {
    try {
      const since = range === 'today' ? startOfToday() : Date.now() - 7 * DAY
      const [o, l] = await Promise.all([getOnlineNow(), getLogsSince(since)])
      setOnline(o); setLogs(l); setError('')
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [range])

  useEffect(() => {
    setLoading(true)
    load()
    const id = setInterval(load, 30000)
    return () => clearInterval(id)
  }, [load])

  const stats = useMemo(() => {
    const users = new Set(logs.map((l) => l.uid))
    const sessions = logs.filter((l) => l.type === 'session_start').length
    const views = logs.filter((l) => l.type === 'page_view').length
    return { active: users.size, sessions, views }
  }, [logs])

  const feed = useMemo(
    () => (typeFilter === 'all' ? logs : logs.filter((l) => l.type === typeFilter)).slice(0, 100),
    [logs, typeFilter]
  )

  return (
    <section className="bg-surface p-10 rounded-[24px] shadow-[0_10px_30px_rgba(0,0,0,0.05)] mb-[30px] fade-in-anim max-[850px]:p-5 max-[850px]:rounded-xl">
      <h2>Activity</h2>
      <p className="text-ink-muted text-sm mt-1 mb-6">Live platform usage. Admin accounts are excluded. Refreshes every 30 seconds.</p>

      {error && <p className="text-primary-strong text-sm mb-3">{error}</p>}

      <div className="flex gap-2 mb-4">
        {[['today', 'Today'], ['week', 'Last 7 days']].map(([id, label]) => (
          <button key={id} onClick={() => setRange(id)}
            className={`text-sm px-3.5 py-2 rounded-lg border cursor-pointer ${range === id ? 'bg-primary-soft dark:bg-primary/15 border-primary-strong text-primary-strong' : 'border-border-soft text-ink-muted'}`}>{label}</button>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6 max-[850px]:grid-cols-2">
        <div className="p-4 rounded-xl bg-primary-pale dark:bg-primary/10 border border-primary/20">
          <p className="text-2xl font-bold text-primary-strong">{loading ? '…' : online.length}</p>
          <p className="text-xs text-ink-muted mt-1">Online now</p>
        </div>
        <div className="p-4 rounded-xl bg-surface-muted border border-border-soft">
          <p className="text-2xl font-bold text-ink">{loading ? '…' : stats.active}</p>
          <p className="text-xs text-ink-muted mt-1">Active students</p>
        </div>
        <div className="p-4 rounded-xl bg-surface-muted border border-border-soft">
          <p className="text-2xl font-bold text-ink">{loading ? '…' : stats.sessions}</p>
          <p className="text-xs text-ink-muted mt-1">Sessions</p>
        </div>
        <div className="p-4 rounded-xl bg-surface-muted border border-border-soft">
          <p className="text-2xl font-bold text-ink">{loading ? '…' : stats.views}</p>
          <p className="text-xs text-ink-muted mt-1">Page views</p>
        </div>
      </div>

      <h3 className="text-base font-bold mb-3">Online now</h3>
      {online.length === 0 ? <p className="text-ink-muted text-sm mb-6">Nobody is online right now.</p> : (
        <div className="flex flex-col gap-1.5 mb-6">
          {online.map((u) => (
            <div key={u.id} className="flex items-center justify-between gap-3 text-sm p-2.5 rounded-lg bg-surface-muted">
              <span className="min-w-0"><strong>{u.name || u.email || u.uid}</strong>
                {u.stream && <span className="text-xs text-ink-muted ml-2">{streamLabel(u.stream, 'ar')}</span>}</span>
              <span className="text-xs text-ink-muted shrink-0">{u.path} · {ago(ms(u.lastSeen))}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h3 className="text-base font-bold">Activity log</h3>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="p-2 border-2 border-border-card rounded-lg text-sm">
          <option value="all">All events</option>
          <option value="session_start">Sign-ins</option>
          <option value="page_view">Page views</option>
        </select>
      </div>
      {loading ? <p className="text-ink-muted text-sm">Loading…</p>
        : feed.length === 0 ? <p className="text-ink-muted text-sm">No activity recorded for this period yet.</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[560px]">
            <thead>
              <tr className="text-left text-ink-muted border-b border-border-soft">
                <th className="py-2 px-2 font-semibold">Student</th>
                <th className="py-2 px-2 font-semibold">Event</th>
                <th className="py-2 px-2 font-semibold">Page</th>
                <th className="py-2 px-2 font-semibold">When</th>
              </tr>
            </thead>
            <tbody>
              {feed.map((l) => (
                <tr key={l.id} className="border-b border-border-soft">
                  <td className="py-2 px-2"><p className="font-semibold">{l.name || '—'}</p><p className="text-xs text-ink-muted">{l.email}</p></td>
                  <td className="py-2 px-2">{TYPE_LABEL[l.type] || l.type}</td>
                  <td className="py-2 px-2 text-ink-muted">{l.path}</td>
                  <td className="py-2 px-2 text-ink-muted whitespace-nowrap">{ago(ms(l.createdAt))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
