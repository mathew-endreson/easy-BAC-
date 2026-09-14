import { useEffect, useMemo, useState } from 'react'
import DashboardNavbar from '../components/DashboardNavbar.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useLang } from '../contexts/LangContext.jsx'
import { usePomodoro, formatDuration } from '../contexts/PomodoroContext.jsx'
import { useTodos } from '../contexts/TodoContext.jsx'
import { useFavorites } from '../contexts/FavoritesContext.jsx'
import { getAllProgress, toMillis } from '../services/progress.js'
import { PageHeader, Card, EmptyState, LoadingGrid } from '../components/ui/kit.jsx'
import Icon from '../components/ui/Icon.jsx'

// Real, aggregate progress dashboard. Every number here is derived from actual
// Firestore progress records (users/{uid}/progress) plus the Pomodoro/Todo/
// Favorites contexts — nothing is invented. This replaces an earlier stub that
// only ever showed Pomodoro/Todo/Favorites stats and unconditionally displayed
// a "no progress yet" message underneath even when real progress existed.
function Stat({ icon, value, label }) {
  return (
    <Card className="p-5 flex items-center gap-4">
      <span className="w-12 h-12 rounded-xl bg-primary-soft dark:bg-primary/15 flex items-center justify-center text-2xl text-primary-strong shrink-0">
        {icon === 'tomato' ? '🍅' : <Icon name={icon} className="w-6 h-6" />}
      </span>
      <div className="min-w-0">
        <p className="text-2xl font-heading font-bold text-ink tabular-nums">{value}</p>
        <p className="text-sm text-ink-muted truncate">{label}</p>
      </div>
    </Card>
  )
}

const ACTIVITY_ICON = { quiz: 'quiz', flashcard: 'cards', video: 'video' }

function activityLine(p, t) {
  if (p.type === 'quiz') {
    return p.completed
      ? `${t('best')}: ${p.bestScore}% · ${t('status-complete')} ${p.lastScore}%`
      : `${p.answered}/${p.total} answered — in progress`
  }
  if (p.type === 'flashcard') {
    return `${p.reviewed}/${p.total} ${t('flashcards').toLowerCase()}${p.mastered ? ` · ${p.mastered} mastered` : ''}`
  }
  if (p.type === 'video') {
    return p.completed ? t('status-complete') : 'Started'
  }
  return ''
}

export default function Progress() {
  const { t, dir } = useLang()
  const { user } = useAuth()
  const { completedSessions } = usePomodoro()
  const { completedCount } = useTodos()
  const { count: favoritesCount } = useFavorites()
  const [progress, setProgress] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getAllProgress(user.uid)
      .then((p) => { if (!cancelled) setProgress(p) })
      .catch((e) => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [user.uid])

  const stats = useMemo(() => {
    const quizzes = progress.filter((p) => p.type === 'quiz')
    const completedQuizzes = quizzes.filter((p) => p.completed)
    const flashcards = progress.filter((p) => p.type === 'flashcard')
    const videos = progress.filter((p) => p.type === 'video')
    const avgScore = completedQuizzes.length
      ? Math.round(completedQuizzes.reduce((s, p) => s + p.lastScore, 0) / completedQuizzes.length)
      : null
    const studyTimeSec = progress.reduce((s, p) => s + (p.lastTimeSpent || 0), 0)
    return {
      quizzesCompleted: completedQuizzes.length,
      avgScore,
      flashcardsReviewed: flashcards.reduce((s, p) => s + (p.reviewed || 0), 0),
      flashcardsMastered: flashcards.reduce((s, p) => s + (p.mastered || 0), 0),
      videosCompleted: videos.filter((p) => p.completed).length,
      studyTimeSec
    }
  }, [progress])

  const recent = useMemo(() => {
    return [...progress]
      .sort((a, b) => {
        const ta = toMillis(a.lastAttemptAt || a.lastReviewedAt || a.lastActivityAt || a.updatedAt)
        const tb = toMillis(b.lastAttemptAt || b.lastReviewedAt || b.lastActivityAt || b.updatedAt)
        return tb - ta
      })
      .slice(0, 8)
  }, [progress])

  const hasAnyProgress = progress.length > 0

  return (
    <div dir={dir}>
      <DashboardNavbar />
      <div className="max-w-container mx-auto px-5 mt-[110px] max-md:mt-6 pb-16">
        <PageHeader title={t('nav-progress')} subtitle={t('your-progress')} />

        {/* Always-real stats: Pomodoro/Todo/Favorites come from live contexts,
            never from a fetch, so they show immediately with no loading gap. */}
        <div className="stagger-children grid grid-cols-3 gap-4 max-md:grid-cols-2 max-[420px]:grid-cols-1 mb-8">
          <Stat icon="tomato" value={completedSessions} label={t('pomodoro')} />
          <Stat icon="checklist" value={completedCount} label={t('todo-list')} />
          <Stat icon="star" value={favoritesCount} label={t('nav-favorites')} />
        </div>

        {loading ? (
          <LoadingGrid count={3} className="grid-cols-3 max-md:grid-cols-2 max-[420px]:grid-cols-1 mb-8" />
        ) : error ? (
          <EmptyState icon={<Icon name="warning" />} title={t('err-generic')} description={error} />
        ) : !hasAnyProgress ? (
          <EmptyState icon={<Icon name="chart" />} title={t('no-progress-title')} description={t('no-progress-desc')} />
        ) : (
          <>
            <div className="grid grid-cols-4 gap-4 max-md:grid-cols-2 mb-8">
              <Stat icon="quiz" value={stats.quizzesCompleted} label={t('quizzes')} />
              <Stat icon="chart" value={stats.avgScore != null ? `${stats.avgScore}%` : '—'} label="Average score" />
              <Stat icon="cards" value={stats.flashcardsReviewed} label="Flashcards reviewed" />
              <Stat icon="clock" value={formatDuration(stats.studyTimeSec)} label="Study time" />
            </div>

            <h3 className="text-lg font-heading font-bold text-ink mb-3">{t('recent-activity')}</h3>
            <div className="flex flex-col gap-2">
              {recent.map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-3.5 rounded-xl bg-surface border border-border-soft">
                  <span className="w-9 h-9 shrink-0 rounded-lg bg-surface-muted flex items-center justify-center text-ink-muted">
                    <Icon name={ACTIVITY_ICON[p.type] || 'book'} className="w-[18px] h-[18px]" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-ink truncate">{p.title}</p>
                    <p className="text-xs text-ink-muted truncate">{activityLine(p, t)}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
