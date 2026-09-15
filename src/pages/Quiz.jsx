import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardNavbar from '../components/DashboardNavbar.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useLang } from '../contexts/LangContext.jsx'
import { getBySubjectForStream, getContentById } from '../services/content.js'
import { recordQuizResult, recordQuizProgress } from '../services/progress.js'
import { Spinner, BackLink, EmptyState } from '../components/ui/kit.jsx'
import Icon from '../components/ui/Icon.jsx'

export default function Quiz() {
  const navigate = useNavigate()
  const { user, stream } = useAuth()
  const { t, dir } = useLang()
  const subject = localStorage.getItem('selectedQuizSubject') || 'Math'
  const [data, setData] = useState([])
  const [quizMeta, setQuizMeta] = useState(null) // set only for a single-quiz deck (progress-trackable)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [stage, setStage] = useState('cover')
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState([])
  const [score, setScore] = useState(0)
  const startRef = useRef(Date.now())
  const recordedRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      startRef.current = Date.now()
      recordedRef.current = false
      try {
        // One-shot: a specific quiz chosen from a Unit page or the deck browser
        // — the only flow whose progress is trackable (one canonical quiz id).
        const quizId = localStorage.getItem('selectedQuizId')
        let collected = []
        if (quizId) {
          // Removed only AFTER the fetch resolves — not before. React 18
          // StrictMode double-invokes this effect once in dev (mount → cleanup
          // → mount); removing the key synchronously here meant the first
          // (discarded) pass ate it before the second (real) pass could read
          // it, silently falling through to the subject-wide branch below —
          // which is how quiz progress tracking went quietly untracked.
          const q = await getContentById('quizzes', quizId, stream)
          localStorage.removeItem('selectedQuizId')
          collected = Array.isArray(q?.questions) ? q.questions : (q ? [q] : [])
          if (!cancelled) setQuizMeta(q ? { id: quizId, title: q.title, subject: q.subject, subjectId: q.subjectId, unitId: q.unitId, stream: q.stream } : null)
        } else {
          // All quizzes for this subject that are visible to the student's stream.
          const docs = await getBySubjectForStream('quizzes', subject, stream)
          docs.forEach((data) => {
            if (Array.isArray(data.questions)) collected.push(...data.questions)
            else collected.push(data)
          })
          if (!cancelled) setQuizMeta(null)
        }
        if (!cancelled) setData(collected)
      } catch (e) {
        if (!cancelled) setLoadError(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [subject, stream])

  // Record the attempt exactly once, the moment the result screen is reached.
  useEffect(() => {
    if (stage !== 'result' || !quizMeta || !user || recordedRef.current) return
    recordedRef.current = true
    const timeSpentSec = Math.round((Date.now() - startRef.current) / 1000)
    recordQuizResult(user.uid, quizMeta, { correct: score, total: data.length, timeSpentSec }).catch(() => {})
  }, [stage, quizMeta, user, score, data.length])

  function selectAnswer(option) {
    if (answers[current]) return
    const q = data[current]
    const isCorrect = option === q.correctAnswer
    const next = [...answers]
    next[current] = { selected: option, isCorrect }
    setAnswers(next)
    if (isCorrect) setScore((s) => s + 1)
  }

  function nextQ() {
    if (current === data.length - 1 && answers[current]) {
      setStage('result')
    } else if (current < data.length - 1) {
      setCurrent(current + 1)
    }
  }

  function prevQ() { if (current > 0) setCurrent(current - 1) }

  // Leaving mid-quiz (Back button, before the result screen) must still save
  // how many questions were actually answered — otherwise the deck browser
  // keeps showing 0 regardless of how far the student got. This is separate
  // from recordQuizResult: an unfinished quiz has no real score yet, so it
  // never touches attempts/bestScore, only the honest "answered" count.
  function exitQuiz() {
    const answeredCount = answers.filter(Boolean).length
    if (quizMeta && user && stage === 'active' && !recordedRef.current && answeredCount > 0) {
      recordedRef.current = true
      const timeSpentSec = Math.round((Date.now() - startRef.current) / 1000)
      recordQuizProgress(user.uid, quizMeta, { answered: answeredCount, total: data.length, timeSpentSec }).catch(() => {})
    }
    navigate(quizMeta ? '/quizzes' : '/library')
  }

  if (loading) {
    return (
      <div dir={dir}>
        <DashboardNavbar />
        <div className="pt-[100px] max-md:pt-6"><Spinner label={t('fetching-quiz')} /></div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div dir={dir}>
        <DashboardNavbar />
        <div className="pt-[100px] max-md:pt-6 px-5">
          <EmptyState icon={<Icon name="warning" />} title={t('err-generic')} description={loadError}
            action={<button onClick={() => navigate('/library')} className="px-5 py-2.5 rounded-pill bg-primary text-white font-semibold hover:bg-primary-strong transition-colors">{t('back')}</button>} />
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div dir={dir}>
        <DashboardNavbar />
        <div className="pt-[100px] max-md:pt-6 px-5">
          <EmptyState icon={<Icon name="quiz" />} title={t('no-quizzes-found', { subject })}
            action={<button onClick={() => navigate('/library')} className="px-5 py-2.5 rounded-pill bg-primary text-white font-semibold hover:bg-primary-strong transition-colors">{t('back')}</button>} />
        </div>
      </div>
    )
  }

  return (
    <div dir={dir}>
      <DashboardNavbar />

      <div className="w-full pt-[100px] max-md:pt-6">
        <div className="px-6 max-md:px-4 mb-2">
          <BackLink onClick={exitQuiz} label={t('back')} />
        </div>

        {stage === 'cover' && (
          <div className="max-w-[820px] mx-auto flex gap-6 px-6 max-md:px-4 max-md:flex-col">
            <div className="w-1/4 text-ink max-lg:w-1/3 max-md:w-full max-md:flex max-md:gap-3 max-md:items-baseline max-md:mb-1">
              <h4 className="mb-4 max-md:mb-2">{subject}</h4>
              <p className="text-sm text-ink-muted">{t('interactive-questions', { count: data.length })}</p>
            </div>
            <div className="flex-1 bg-surface min-h-[300px] rounded-3xl border border-border-soft p-10 flex flex-col justify-between max-md:min-h-[200px] max-md:p-6">
              <h3 className="text-start text-xl sm:text-2xl font-heading font-bold">{subject} {t('quizzes')}</h3>
              <div className="flex justify-end">
                <button
                  onClick={() => setStage('active')}
                  className="bg-primary text-white border-0 rounded-pill text-base font-medium px-7 py-3 min-h-12 cursor-pointer hover:bg-primary-strong transition-colors"
                >
                  {t('start-learning')}
                </button>
              </div>
            </div>
          </div>
        )}

        {stage === 'active' && (
          <div className="w-full max-w-[760px] mx-auto p-[24px_16px] flex flex-col">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-ink-muted">{current + 1} / {data.length}</span>
            </div>
            <div className="w-full h-2 bg-border-soft rounded-[20px] mt-3 overflow-hidden">
              <div className="h-full bg-primary rounded-[20px] transition-[width] duration-[400ms]" style={{ width: `${((current + 1) / data.length) * 100}%` }} />
            </div>
            <div>
              <h4 className="mt-6 mb-2 text-lg sm:text-xl">{data[current].question}</h4>
              <p className="mb-5 text-sm text-ink-muted">{t('choose-correct-answer')}</p>
            </div>

            <div className="flex flex-col gap-3">
              {data[current].options.map((opt, i) => {
                const ans = answers[current]
                let stateCls = ''
                if (ans) {
                  if (opt === data[current].correctAnswer) stateCls = 'correct'
                  else if (ans.selected === opt) stateCls = 'wrong'
                }
                return (
                  <div
                    key={i}
                    onClick={() => selectAnswer(opt)}
                    className={`answer w-full min-h-14 bg-surface-muted text-ink rounded-2xl flex items-center px-5 cursor-pointer hover:brightness-95 dark:hover:brightness-125 transition ${stateCls}`}
                  >
                    <span className="text-base leading-snug">{opt}</span>
                  </div>
                )
              })}
            </div>

            <div className="flex justify-between mt-8 gap-3">
              <button
                onClick={prevQ}
                disabled={current === 0}
                className="bg-surface-muted text-ink border border-border-soft rounded-pill font-medium px-6 py-3 min-h-12 flex-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition"
              >
                {t('previous')}
              </button>
              <button
                onClick={nextQ}
                disabled={!answers[current]}
                className="bg-primary text-white border-0 rounded-pill font-medium px-6 py-3 min-h-12 flex-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:bg-primary-strong transition-colors"
              >
                {current === data.length - 1 && answers[current] ? t('finish') : t('next')}
              </button>
            </div>
          </div>
        )}

        {stage === 'result' && (
          <div className="text-center py-14 px-5 fade-in-anim">
            <h1 className="text-6xl sm:text-7xl text-primary-strong mb-5 tabular-nums">{score} / {data.length}</h1>
            <h2 className="text-xl sm:text-2xl font-heading font-bold">{t('quiz-finished')}</h2>
            <p className="my-5 text-ink-muted max-w-sm mx-auto">
              {score === data.length ? t('perfect-score-msg') : t('good-job-msg')}
            </p>
            <div className="flex flex-wrap gap-3 justify-center mt-8">
              <button onClick={() => { setStage('cover'); setCurrent(0); setAnswers([]); setScore(0); startRef.current = Date.now(); recordedRef.current = false }} className="bg-primary text-white border-0 rounded-pill font-medium px-7 py-3 min-h-12 cursor-pointer hover:bg-primary-strong transition-colors">{t('restart')}</button>
              <button onClick={() => navigate(quizMeta ? '/quizzes' : '/library')} className="bg-surface-muted text-ink border border-border-soft rounded-pill font-medium px-7 py-3 min-h-12 cursor-pointer hover:bg-bg-card transition-colors">{quizMeta ? t('back-to-decks') : t('dashboard')}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
