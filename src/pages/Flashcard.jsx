import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardNavbar from '../components/DashboardNavbar.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useLang } from '../contexts/LangContext.jsx'
import { getBySubjectForStream, getByUnitForStream } from '../services/content.js'
import { getDeckCards } from '../services/decks.js'
import { recordFlashcardSession } from '../services/progress.js'
import { Spinner, BackLink, EmptyState } from '../components/ui/kit.jsx'
import Icon from '../components/ui/Icon.jsx'

const MOOD_EMOJI = ['😞', '🙁', '😐', '🙂', '😀']

export default function Flashcard() {
  const navigate = useNavigate()
  const { user, stream } = useAuth()
  const { t, dir } = useLang()
  const subject = localStorage.getItem('selectedFlashSubject') || 'Physics'
  const [cards, setCards] = useState([])
  const [deckMeta, setDeckMeta] = useState(null) // set only for a real deck-play session (progress-trackable)
  const [index, setIndex] = useState(0)
  const [maxReached, setMaxReached] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [showQ, setShowQ] = useState('')
  const [showA, setShowA] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [finished, setFinished] = useState(false)
  const [savedMood, setSavedMood] = useState(null)
  const startRef = useRef(Date.now())
  const savedRef = useRef(false) // guards against double-saving the same session

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      startRef.current = Date.now()
      try {
        // Highest priority: a specific deck picked from the deck browser —
        // this is the only flow whose progress gets tracked, since it's the
        // only one attributable to one canonical deck id.
        const deckId = localStorage.getItem('selectedFlashDeckId')
        const unitId = localStorage.getItem('selectedFlashUnit')
        let result
        if (deckId) {
          // Removed only AFTER the fetch resolves — see the matching comment
          // in Quiz.jsx for why (React 18 StrictMode double-invokes this
          // effect once in dev; removing synchronously here made the second,
          // real pass see the key already gone and silently fall through to
          // the legacy subject/unit-wide branches, which is why decks showed
          // as empty and flashcard progress went untracked).
          result = await getDeckCards(stream, deckId)
          localStorage.removeItem('selectedFlashDeckId')
          const first = result[0]
          if (!cancelled) setDeckMeta({
            id: deckId,
            title: first?.setTitle || first?.subject || subject,
            subject: first?.subject || '',
            subjectId: first?.subjectId || '',
            unitId: first?.unitId || '',
            stream: first?.stream || '',
            total: result.length
          })
        } else if (unitId) {
          result = await getByUnitForStream('flashcards', unitId, stream)
          localStorage.removeItem('selectedFlashUnit')
          if (!cancelled) setDeckMeta(null)
        } else {
          result = await getBySubjectForStream('flashcards', subject, stream)
          if (!cancelled) setDeckMeta(null)
        }
        if (!cancelled) { setCards(result); setIndex(0); setMaxReached(0); setFinished(false); setSavedMood(null); savedRef.current = false }
      } catch (e) {
        if (!cancelled) setLoadError(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [subject, stream])

  useEffect(() => {
    if (cards.length === 0) return
    setFlipped(false)
    const timer = setTimeout(() => {
      setShowQ(cards[index]?.question || '')
      setShowA(cards[index]?.answer || '')
    }, 150)
    return () => clearTimeout(timer)
  }, [index, cards])

  function goTo(i) {
    setIndex(i)
    setMaxReached((m) => Math.max(m, i))
  }
  function next() {
    if (index < cards.length - 1) goTo(index + 1)
    else if (deckMeta) setFinished(true) // last card of a trackable deck → offer to finish
  }
  function prev() { if (index > 0) goTo(index - 1) }

  async function finishSession(mood) {
    setSavedMood(mood)
    if (deckMeta && user) {
      savedRef.current = true
      const timeSpentSec = Math.round((Date.now() - startRef.current) / 1000)
      await recordFlashcardSession(user.uid, deckMeta, {
        reviewed: maxReached + 1,
        timeSpentSec,
        mood
      })
    }
  }

  // Leaving early (Back button, before reaching the last card) must still save
  // how far the student actually got — otherwise the deck browser keeps
  // showing 0 reviewed no matter how many cards were studied. Mood is left
  // untouched (recordFlashcardSession preserves the prior rating when passed
  // null) since an early exit isn't a real "how did that go" moment.
  function exitToDecks() {
    if (deckMeta && user && !savedRef.current && maxReached > 0) {
      savedRef.current = true
      const timeSpentSec = Math.round((Date.now() - startRef.current) / 1000)
      recordFlashcardSession(user.uid, deckMeta, {
        reviewed: maxReached + 1,
        timeSpentSec,
        mood: null
      }).catch(() => {})
    }
    navigate(deckMeta ? '/flashcard-decks' : '/library')
  }

  if (loading) {
    return (
      <div dir={dir}>
        <DashboardNavbar />
        <div className="pt-[100px] max-md:pt-6"><Spinner label={t('loading-deck')} /></div>
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

  if (cards.length === 0) {
    return (
      <div dir={dir}>
        <DashboardNavbar />
        <div className="pt-[100px] max-md:pt-6 px-5">
          <EmptyState icon={<Icon name="cards" />} title={t('no-cards-found', { subject })}
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
          <BackLink onClick={exitToDecks} label={t('back')} />
        </div>

        <div className="max-w-[760px] mx-auto flex gap-6 px-6 max-md:flex-col max-md:px-4">
          <div className="w-1/4 text-ink max-lg:w-1/3 max-md:w-full max-md:flex max-md:gap-3 max-md:items-baseline max-md:mb-1">
            <h4 className="mb-4 max-md:mb-2">{deckMeta?.title || subject}</h4>
            <p className="text-sm text-ink-muted">{t('card-progress', { current: index + 1, total: cards.length })}</p>
          </div>

          <div className="flex-1 flex flex-col max-w-[520px] mx-auto w-full">
            {finished ? (
              <div className="bg-surface border border-border-soft rounded-3xl p-8 text-center flex flex-col items-center gap-5">
                <span className="text-4xl">🎉</span>
                <h3 className="text-xl font-heading font-bold text-ink">{t('session-complete')}</h3>
                {savedMood ? (
                  <p className="text-ink-muted">{t('saved-see-progress')}</p>
                ) : (
                  <>
                    <p className="text-ink-muted">{t('how-did-that-go')}</p>
                    <div className="flex items-center gap-3">
                      {MOOD_EMOJI.map((emoji, i) => (
                        <button key={i} onClick={() => finishSession(i + 1)} className="w-11 h-11 flex items-center justify-center text-3xl hover:scale-125 transition-transform" aria-label={`rate ${i + 1}`}>
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </>
                )}
                <button onClick={() => navigate('/flashcard-decks')} className="mt-2 px-6 py-2.5 min-h-12 rounded-pill bg-primary text-white font-semibold hover:bg-primary-strong transition-colors">
                  {t('back-to-decks')}
                </button>
              </div>
            ) : (
              <>
                <div className={`flash-card-outer max-md:h-[220px] max-md:mt-5 max-[480px]:h-[180px] ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(!flipped)}>
                  <div className="flash-card-inner">
                    <div className="flash-front max-md:p-6 max-md:rounded-[20px]"><h2 className="text-xl sm:text-2xl max-md:text-lg max-[480px]:text-base">{showQ}</h2></div>
                    <div className="flash-back max-md:p-6 max-md:rounded-[20px]"><h3 className="text-lg max-md:text-base max-[480px]:text-sm">{showA}</h3></div>
                  </div>
                </div>

                <div className="flex justify-center gap-4 mt-8 max-md:mt-6">
                  <button onClick={prev} disabled={index === 0} className="bg-surface-muted text-ink border border-border-soft py-2.5 px-6 min-h-12 rounded-xl cursor-pointer font-semibold hover:bg-bg-card transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{t('previous')}</button>
                  <button onClick={next} className="bg-primary text-white border-0 py-2.5 px-6 min-h-12 rounded-xl cursor-pointer font-semibold hover:bg-primary-strong transition-colors">
                    {index === cards.length - 1 && deckMeta ? t('finish') : t('next')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
