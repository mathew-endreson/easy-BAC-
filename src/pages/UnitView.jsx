import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import DashboardNavbar from '../components/DashboardNavbar.jsx'
import FavoriteButton from '../components/FavoriteButton.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useLang } from '../contexts/LangContext.jsx'
import { getUnitById } from '../services/academic.js'
import { getByUnitForStream } from '../services/content.js'
import { PageHeader, SectionHeader, EmptyState, Spinner } from '../components/ui/kit.jsx'
import Icon from '../components/ui/Icon.jsx'

// A unit's content, grouped into categories (Resources/Summaries, Quiz, Flashcards).
// Only content visible to the student's stream is shown.
export default function UnitView() {
  const { unitId } = useParams()
  const navigate = useNavigate()
  const { stream } = useAuth()
  const { t, dir } = useLang()
  const [unit, setUnit] = useState(null)
  const [resources, setResources] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [flashcards, setFlashcards] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    async function load() {
      const [u, r, q, f] = await Promise.all([
        getUnitById(unitId),
        getByUnitForStream('resources', unitId, stream),
        getByUnitForStream('quizzes', unitId, stream),
        getByUnitForStream('flashcards', unitId, stream)
      ])
      if (cancelled) return
      setUnit(u); setResources(r); setQuizzes(q); setFlashcards(f)
      setLoading(false)
    }
    load().catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [unitId, stream])

  function startQuiz(quiz) {
    localStorage.setItem('selectedQuizId', quiz.id)
    localStorage.setItem('selectedQuizSubject', quiz.subject || '')
    navigate('/quiz')
  }
  function studyFlashcards() {
    localStorage.setItem('selectedFlashUnit', unitId)
    localStorage.removeItem('selectedFlashSubject')
    navigate('/flashcard')
  }

  const empty = !loading && resources.length === 0 && quizzes.length === 0 && flashcards.length === 0

  return (
    <div dir={dir}>
      <DashboardNavbar />
      <div className="max-w-container mx-auto px-5 mt-[110px] max-md:mt-6 pb-16">
        <Link to={unit?.subjectId ? `/library/subject/${unit.subjectId}` : '/library'} className="text-sm text-ink-muted hover:text-primary no-underline">← {t('back')}</Link>
        <PageHeader title={unit?.name || t('units')} subtitle={t('content')} />

        {loading ? <Spinner label={t('loading')} />
          : empty ? <EmptyState icon={<Icon name="folder" />} title={t('no-content-title')} description={t('no-content-desc')} />
          : (
            <div className="flex flex-col gap-8 max-w-3xl">
              {resources.length > 0 && (
                <section>
                  <SectionHeader title={`${t('lessons')} & ${t('summaries')}`} />
                  <div className="grid grid-cols-2 gap-3 max-[520px]:grid-cols-1">
                    {resources.map((res) => (
                      <div key={res.id} className="flex items-center gap-3 p-4 rounded-xl bg-surface border border-border-soft">
                        <span className="w-9 h-9 shrink-0 rounded-lg bg-surface-muted flex items-center justify-center text-ink-muted"><Icon name={res.type === 'drive' ? 'folder' : 'video'} className="w-[18px] h-[18px]" /></span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-ink truncate">{res.title || res.subject}</p>
                          {res.subject && <p className="text-xs text-ink-muted">{res.subject}</p>}
                        </div>
                        <FavoriteButton item={{ type: 'resource', contentId: res.id, title: res.title, subjectId: res.subjectId, unitId: res.unitId, stream: res.stream }} />
                        <button onClick={() => window.open(res.url, '_blank', 'noopener')} className="text-sm font-semibold text-primary hover:underline">{t('start')}</button>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {quizzes.length > 0 && (
                <section>
                  <SectionHeader title={t('quizzes')} />
                  <div className="grid grid-cols-2 gap-3 max-[520px]:grid-cols-1">
                    {quizzes.map((quiz) => (
                      <div key={quiz.id} className="flex items-center gap-3 p-4 rounded-xl bg-surface border border-border-soft">
                        <span className="w-9 h-9 shrink-0 rounded-lg bg-surface-muted flex items-center justify-center text-ink-muted"><Icon name="quiz" className="w-[18px] h-[18px]" /></span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-ink truncate">{quiz.title || quiz.subject}</p>
                          <p className="text-xs text-ink-muted">{(quiz.questions?.length ?? 0)} {t('questions')}</p>
                        </div>
                        <FavoriteButton item={{ type: 'quiz', contentId: quiz.id, title: quiz.title, subjectId: quiz.subjectId, unitId: quiz.unitId, stream: quiz.stream }} />
                        <button onClick={() => startQuiz(quiz)} className="text-sm font-semibold text-primary hover:underline">{t('start')}</button>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {flashcards.length > 0 && (
                <section>
                  <SectionHeader title={t('flashcards')} />
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-surface border border-border-soft max-w-sm">
                    <span className="w-9 h-9 shrink-0 rounded-lg bg-surface-muted flex items-center justify-center text-ink-muted"><Icon name="cards" className="w-[18px] h-[18px]" /></span>
                    <div className="flex-1">
                      <p className="font-semibold text-ink">{flashcards.length} {t('flashcards')}</p>
                    </div>
                    <button onClick={studyFlashcards} className="px-4 py-2 rounded-pill bg-primary text-white text-sm font-semibold hover:bg-primary-strong transition-colors">{t('start')}</button>
                  </div>
                </section>
              )}
            </div>
          )}
      </div>
    </div>
  )
}
