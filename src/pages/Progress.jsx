import DashboardNavbar from '../components/DashboardNavbar.jsx'
import { useLang } from '../contexts/LangContext.jsx'
import { formatDuration } from '../contexts/PomodoroContext.jsx'
import { usePersonalStats, ACTIVITY_ICON, activityLine } from '../hooks/usePersonalStats.js'
import { PageHeader, StatCard, EmptyState, LoadingGrid } from '../components/ui/kit.jsx'
import Icon from '../components/ui/Icon.jsx'

// Real, aggregate progress dashboard. Every number here is derived from actual
// Firestore progress records (users/{uid}/progress) plus the Pomodoro/Todo/
// Favorites contexts — nothing is invented. This replaces an earlier stub that
// only ever showed Pomodoro/Todo/Favorites stats and unconditionally displayed
// a "no progress yet" message underneath even when real progress existed.
export default function Progress() {
  const { t, dir } = useLang()
  const {
    stats, recent, loading, error, hasAnyProgress,
    completedSessions, completedCount, favoritesCount
  } = usePersonalStats()

  return (
    <div dir={dir}>
      <DashboardNavbar />
      <div className="max-w-container mx-auto px-5 mt-[110px] max-md:mt-6 pb-16">
        <PageHeader title={t('nav-progress')} subtitle={t('your-progress')} />

        {/* Always-real stats: Pomodoro/Todo/Favorites come from live contexts,
            never from a fetch, so they show immediately with no loading gap. */}
        <div className="stagger-children grid grid-cols-3 gap-4 max-md:grid-cols-2 max-[420px]:grid-cols-1 mb-8">
          <StatCard icon="tomato" value={completedSessions} label={t('pomodoro')} />
          <StatCard icon="checklist" value={completedCount} label={t('todo-list')} />
          <StatCard icon="star" value={favoritesCount} label={t('nav-favorites')} to="/favorites" />
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
              <StatCard icon="quiz" value={stats.quizzesCompleted} label={t('quizzes')} />
              <StatCard icon="chart" value={stats.avgScore != null ? `${stats.avgScore}%` : '—'} label={t('avg-score')} />
              <StatCard icon="cards" value={stats.flashcardsReviewed} label={t('flashcards-reviewed')} />
              <StatCard icon="clock" value={formatDuration(stats.studyTimeSec)} label={t('study-time')} />
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
