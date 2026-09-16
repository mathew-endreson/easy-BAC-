import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardNavbar from '../components/DashboardNavbar.jsx'
import DeckCard from '../components/DeckCard.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useLang } from '../contexts/LangContext.jsx'
import { useFavorites } from '../contexts/FavoritesContext.jsx'
import { formatDuration } from '../contexts/PomodoroContext.jsx'
import { getQuizDecks } from '../services/decks.js'
import { getAllProgress } from '../services/progress.js'
import { getSubjects } from '../services/academic.js'
import { PageHeader, EmptyState, LoadingGrid } from '../components/ui/kit.jsx'
import Icon from '../components/ui/Icon.jsx'

// Personal quiz-deck browser: every admin-created quiz is one "deck" with real
// tracked progress (score, attempts, time spent) — not a flat question list.
export default function QuizDecks() {
  const navigate = useNavigate()
  const { user, stream } = useAuth()
  const { t, dir } = useLang()
  const { isFavorite, toggleFavorite } = useFavorites()
  const [decks, setDecks] = useState([])
  const [subjects, setSubjects] = useState([])
  const [activeSubject, setActiveSubject] = useState('all')
  const [progressMap, setProgressMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true); setError('')
    try {
      const [deckList, progress, subjectList] = await Promise.all([getQuizDecks(stream), getAllProgress(user.uid), getSubjects(stream)])
      setDecks(deckList)
      setSubjects(subjectList)
      setProgressMap(Object.fromEntries(progress.filter((p) => p.type === 'quiz').map((p) => [p.contentId, p])))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [stream])

  // Only show a chip for a subject that actually has at least one deck —
  // avoids an empty filter row when content isn't tagged yet.
  const availableSubjects = useMemo(() => {
    const idsWithDecks = new Set(decks.map((d) => d.subjectId).filter(Boolean))
    return subjects.filter((s) => idsWithDecks.has(s.id))
  }, [subjects, decks])

  const visibleDecks = useMemo(
    () => (activeSubject === 'all' ? decks : decks.filter((d) => d.subjectId === activeSubject)),
    [decks, activeSubject]
  )

  function play(deck) {
    localStorage.setItem('selectedQuizId', deck.id)
    localStorage.setItem('selectedQuizSubject', deck.subject || '')
    navigate('/quiz')
  }

  return (
    <div dir={dir}>
      <DashboardNavbar />
      <div className="max-w-container mx-auto px-5 mt-[110px] max-md:mt-6 pb-16">
        <PageHeader title={t('quizzes')} subtitle={t('nav-progress')} />

        {availableSubjects.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <button onClick={() => setActiveSubject('all')} className={`h-9 px-4 rounded-[12px] text-sm transition ${activeSubject === 'all' ? 'bg-primary-soft text-primary-strong dark:bg-primary/15 dark:text-primary-glow' : 'border border-border-soft bg-surface text-ink hover:bg-surface-muted'}`}>{t('all')}</button>
            {availableSubjects.map((s) => (
              <button key={s.id} onClick={() => setActiveSubject(s.id)} className={`h-9 px-4 rounded-[12px] text-sm transition ${activeSubject === s.id ? 'bg-primary-soft text-primary-strong dark:bg-primary/15 dark:text-primary-glow' : 'border border-border-soft bg-surface text-ink hover:bg-surface-muted'}`}>{s.name}</button>
            ))}
          </div>
        )}

        {loading ? <LoadingGrid count={6} className="grid-cols-3 max-md:grid-cols-2 max-[520px]:grid-cols-1" />
          : error ? <EmptyState icon={<Icon name="warning" />} title={t('err-generic')} description={error} />
          : visibleDecks.length === 0 ? <EmptyState icon={<Icon name="quiz" />} title={t('no-content-title')} description={t('no-content-desc')} />
          : (
            <div className="stagger-children grid grid-cols-3 gap-4 max-md:grid-cols-2 max-[520px]:grid-cols-1">
              {visibleDecks.map((deck) => {
                const p = progressMap[deck.id]
                // A completed (scored) attempt and a partial (exited-early,
                // unscored) one are genuinely different states — conflating
                // them rendered "undefined/undefined" whenever only a partial
                // record existed. Completed: show the real score. Partial:
                // show how many were answered, honestly labeled as ungraded.
                const hasCompleted = Boolean(p?.completed)
                let percent, color, centerTop, centerBottom
                if (hasCompleted) {
                  percent = p.lastScore
                  color = percent >= 50 ? 'green' : 'red'
                  centerTop = `${p.lastCorrect}/${p.total}`
                  centerBottom = `${percent}%`
                } else if (p?.answered) {
                  percent = deck.total ? Math.round((p.answered / deck.total) * 100) : 0
                  color = 'grey'
                  centerTop = `${p.answered}/${deck.total}`
                  centerBottom = 'in progress'
                } else {
                  percent = 0
                  color = 'grey'
                  centerTop = `0/${deck.total}`
                  centerBottom = '0%'
                }
                return (
                  <DeckCard
                    key={deck.id}
                    title={deck.title}
                    subtitle={deck.subject}
                    ringPercent={percent}
                    ringColor={color}
                    centerTop={centerTop}
                    centerBottom={centerBottom}
                    timerLabel={formatDuration(p?.lastTimeSpent || 0)}
                    onPlay={() => play(deck)}
                    onReset={() => play(deck)}
                    statsLines={hasCompleted ? [
                      `${t('best')}: ${p.bestScore}%`,
                      `Attempts: ${p.attempts}`,
                      `Best time: ${formatDuration(p.bestTimeSpent || 0)}`
                    ] : p?.answered ? [`Answered ${p.answered}/${deck.total} (not yet finished)`] : null}
                    isFavorite={isFavorite('quiz', deck.id)}
                    onToggleFavorite={() => toggleFavorite({ type: 'quiz', contentId: deck.id, title: deck.title, subjectId: deck.subjectId, unitId: deck.unitId, stream: deck.stream })}
                  />
                )
              })}
            </div>
          )}
      </div>
    </div>
  )
}
