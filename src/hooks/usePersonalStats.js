import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { usePomodoro } from '../contexts/PomodoroContext.jsx'
import { useTodos } from '../contexts/TodoContext.jsx'
import { useFavorites } from '../contexts/FavoritesContext.jsx'
import { getAllProgress, toMillis } from '../services/progress.js'

export const ACTIVITY_ICON = { quiz: 'quiz', flashcard: 'cards', video: 'video' }

export function activityLine(p, t) {
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

// Shared personal-stats aggregation for the Progress (full detail) and Profile
// (summary) pages — one source of truth for "quizzes completed", "average
// score", etc. so the two pages can never silently drift apart.
export function usePersonalStats() {
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

  return {
    progress, stats, recent, loading, error,
    completedSessions, completedCount, favoritesCount,
    hasAnyProgress: progress.length > 0
  }
}
