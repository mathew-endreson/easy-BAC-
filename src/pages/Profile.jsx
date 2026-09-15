import { Link } from 'react-router-dom'
import DashboardNavbar from '../components/DashboardNavbar.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useLang } from '../contexts/LangContext.jsx'
import { streamLabel } from '../constants/streams.js'
import { wilayaLabel } from '../constants/wilayas.js'
import { formatDuration } from '../contexts/PomodoroContext.jsx'
import { usePersonalStats } from '../hooks/usePersonalStats.js'
import { toMillis } from '../services/progress.js'
import { PageHeader, Card, StatCard, LoadingGrid } from '../components/ui/kit.jsx'
import Icon from '../components/ui/Icon.jsx'

function fmtDate(ts, lang) {
  const ms = toMillis(ts)
  if (!ms) return '—'
  return new Date(ms).toLocaleDateString(lang === 'ar' ? 'ar-DZ' : lang === 'fr' ? 'fr-FR' : 'en-GB', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

// Student account hub: who you are (avatar/name/wilaya/stream) + an at-a-glance
// summary of your own activity, plus the one-click switch into the admin CMS
// for super admins. Replaces the old Support scaffold in the bottom nav —
// contacting support is still one click away via the mailto action below.
export default function Profile() {
  const { user, profile, stream, isSuperAdmin } = useAuth()
  const { t, lang, dir } = useLang()
  const { stats, loading, hasAnyProgress, completedSessions, completedCount, favoritesCount } = usePersonalStats()

  const name = profile?.displayName || user?.displayName || user?.email || t('student')
  const initial = name.trim().charAt(0).toUpperCase()
  const photo = profile?.photoURL || user?.photoURL

  return (
    <div dir={dir}>
      <DashboardNavbar />
      <div className="max-w-container mx-auto px-5 mt-[110px] max-md:mt-6 pb-16">
        <PageHeader title={t('nav-profile')} />

        <Card className="p-6 flex items-center gap-4 mb-6 flex-wrap">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-primary text-white flex items-center justify-center text-2xl font-heading font-bold shrink-0">
            {photo ? <img src={photo} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-heading font-bold text-ink text-lg truncate">{name}</p>
            {user?.email && <p className="text-sm text-ink-muted truncate">{user.email}</p>}
          </div>
        </Card>

        <Card className="p-6 mb-6">
          <h3 className="text-base font-heading font-bold text-ink mb-4">{t('account-details')}</h3>
          <dl className="grid grid-cols-3 gap-4 max-md:grid-cols-1">
            <div>
              <dt className="text-xs text-ink-muted mb-0.5">{t('wilaya')}</dt>
              <dd className="text-sm font-semibold text-ink">{profile?.wilaya ? wilayaLabel(profile.wilaya, lang) : '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-muted mb-0.5">{t('onboarding-stream')}</dt>
              <dd className="text-sm font-semibold text-ink">{stream ? streamLabel(stream, lang) : '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-muted mb-0.5">{t('member-since')}</dt>
              <dd className="text-sm font-semibold text-ink">{fmtDate(profile?.createdAt, lang)}</dd>
            </div>
          </dl>
        </Card>

        {isSuperAdmin && (
          <Link
            to="/admin"
            className="flex items-center gap-3 p-5 rounded-2xl bg-primary text-white no-underline mb-6 hover:bg-primary-strong transition-colors"
          >
            <span className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0"><Icon name="settings" className="w-5 h-5" /></span>
            <span className="font-semibold flex-1">{t('switch-to-admin')}</span>
            <Icon name="chevronRight" className={`w-5 h-5 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
          </Link>
        )}

        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-heading font-bold text-ink">{t('quick-stats')}</h3>
          <Link to="/progress" className="text-sm font-semibold text-primary hover:underline">{t('view-full-progress')} →</Link>
        </div>
        <div className="stagger-children grid grid-cols-3 gap-4 max-md:grid-cols-2 max-[420px]:grid-cols-1">
          <StatCard icon="tomato" value={completedSessions} label={t('pomodoro')} />
          <StatCard icon="checklist" value={completedCount} label={t('todo-list')} />
          <StatCard icon="star" value={favoritesCount} label={t('nav-favorites')} to="/favorites" />
          {loading ? (
            <LoadingGrid count={3} className="col-span-3 grid-cols-3 max-md:grid-cols-2 max-[420px]:grid-cols-1" />
          ) : hasAnyProgress && (
            <>
              <StatCard icon="quiz" value={stats.quizzesCompleted} label={t('quizzes')} />
              <StatCard icon="chart" value={stats.avgScore != null ? `${stats.avgScore}%` : '—'} label={t('avg-score')} />
              <StatCard icon="clock" value={formatDuration(stats.studyTimeSec)} label={t('study-time')} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
