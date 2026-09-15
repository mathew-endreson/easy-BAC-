import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardNavbar from '../components/DashboardNavbar.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useLang } from '../contexts/LangContext.jsx'
import { usePomodoro, formatDuration } from '../contexts/PomodoroContext.jsx'
import { useFavorites } from '../contexts/FavoritesContext.jsx'
import { getAllProgress, toMillis } from '../services/progress.js'
import { wilayaLabel } from '../constants/wilayas.js'
import { getStream, streamLabel } from '../constants/streams.js'
import { PageHeader, Card, LoadingGrid } from '../components/ui/kit.jsx'
import Icon from '../components/ui/Icon.jsx'

function StatTile({ icon, value, label }) {
  return (
    <Card className="p-4 flex items-center gap-3">
      <span className="w-11 h-11 rounded-xl bg-primary-soft dark:bg-primary/15 flex items-center justify-center text-xl text-primary-strong shrink-0">
        {icon === 'tomato' ? '🍅' : <Icon name={icon} className="w-5 h-5" />}
      </span>
      <div className="min-w-0">
        <p className="text-xl font-heading font-bold text-ink tabular-nums">{value}</p>
        <p className="text-xs text-ink-muted truncate">{label}</p>
      </div>
    </Card>
  )
}

export default function Profile() {
  const { t, lang, dir } = useLang()
  const { user, profile, isSuperAdmin } = useAuth()
  const { completedSessions } = usePomodoro()
  const { count: favoritesCount } = useFavorites()
  const [progress, setProgress] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getAllProgress(user.uid)
      .then((p) => { if (!cancelled) setProgress(p) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [user.uid])

  const stats = useMemo(() => {
    const completedQuizzes = progress.filter((p) => p.type === 'quiz' && p.completed)
    const flashcards = progress.filter((p) => p.type === 'flashcard')
    const avgScore = completedQuizzes.length
      ? Math.round(completedQuizzes.reduce((s, p) => s + p.lastScore, 0) / completedQuizzes.length)
      : null
    const studyTimeSec = progress.reduce((s, p) => s + (p.lastTimeSpent || 0), 0)
    return {
      quizzesCompleted: completedQuizzes.length,
      avgScore,
      flashcardsReviewed: flashcards.reduce((s, p) => s + (p.reviewed || 0), 0),
      studyTimeSec
    }
  }, [progress])

  const name = profile?.displayName || user?.displayName || user?.email || 'Student'
  const initial = name.trim().charAt(0).toUpperCase()
  const photo = profile?.photoURL || user?.photoURL
  const joinedMs = toMillis(profile?.createdAt)
  const stream = getStream(profile?.bacStream)

  return (
    <div dir={dir}>
      <DashboardNavbar />
      <div className="max-w-container mx-auto px-5 mt-[110px] max-md:mt-6 pb-16">
        <PageHeader title={t('profile')} />

        <Card className="p-6 mb-6 flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="w-20 h-20 rounded-full overflow-hidden border border-border-card bg-primary text-white flex items-center justify-center text-3xl font-bold shrink-0">
            {photo
              ? <img src={photo} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              : <span aria-hidden="true">{initial}</span>}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-heading font-bold text-ink truncate">{name}</h2>
            {user?.email && <p className="text-sm text-ink-muted truncate">{user.email}</p>}
            <div className="flex flex-wrap gap-2 mt-3">
              {profile?.wilaya && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-surface-muted text-ink">
                  {wilayaLabel(profile.wilaya, lang)}
                </span>
              )}
              {stream && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary-soft dark:bg-primary/15 text-primary-strong">
                  <span aria-hidden="true">{stream.icon}</span> {streamLabel(stream.id, lang)}
                </span>
              )}
              {joinedMs > 0 && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-surface-muted text-ink-muted">
                  {t('joined')} {new Date(joinedMs).toLocaleDateString(lang)}
                </span>
              )}
            </div>
          </div>
        </Card>

        {isSuperAdmin && (
          <Link
            to="/admin"
            className="flex items-center justify-between gap-4 p-5 mb-8 rounded-2xl bg-primary text-white no-underline hover:bg-primary-strong transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                <Icon name="settings" className="w-5 h-5" />
              </span>
              <p className="font-semibold truncate">{t('switch-to-admin')}</p>
            </div>
            <Icon name="chevronRight" className="w-5 h-5 shrink-0 rtl:rotate-180" />
          </Link>
        )}

        <h3 className="text-lg font-heading font-bold text-ink mb-3">{t('your-progress')}</h3>
        {loading ? (
          <LoadingGrid count={6} className="grid-cols-3 max-md:grid-cols-2 mb-4" />
        ) : (
          <div className="stagger-children grid grid-cols-3 gap-4 max-md:grid-cols-2 mb-4">
            <StatTile icon="quiz" value={stats.quizzesCompleted} label={t('quizzes')} />
            <StatTile icon="chart" value={stats.avgScore != null ? `${stats.avgScore}%` : '—'} label="Average score" />
            <StatTile icon="cards" value={stats.flashcardsReviewed} label="Flashcards reviewed" />
            <StatTile icon="clock" value={formatDuration(stats.studyTimeSec)} label="Study time" />
            <StatTile icon="tomato" value={completedSessions} label={t('pomodoro')} />
            <StatTile icon="star" value={favoritesCount} label={t('nav-favorites')} />
          </div>
        )}

        <Link to="/progress" className="text-sm font-semibold text-primary hover:underline no-underline">
          {t('nav-progress')} →
        </Link>
      </div>
    </div>
  )
}
