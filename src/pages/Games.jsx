import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardNavbar from '../components/DashboardNavbar.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { getQuizzes, getFlashcards, getResources } from '../services/content.js'

export default function Games() {
  const navigate = useNavigate()
  const { stream } = useAuth()
  const [catalog, setCatalog] = useState([])
  const [activeFilter, setActiveFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        // Only content visible to the student's BAC stream.
        const [quizzes, flashcards, resources] = await Promise.all([
          getQuizzes(stream),
          getFlashcards(stream),
          getResources(stream)
        ])
        if (cancelled) return
        const entries = new Set()
        quizzes.forEach((d) => entries.add(`${d.subject}|quiz`))
        flashcards.forEach((d) => entries.add(`${d.subject}|flashcard`))
        resources.forEach((d) => entries.add(`${d.subject}|resource`))
        setCatalog(Array.from(entries).map((e) => {
          const [subject, type] = e.split('|')
          return { subject, type }
        }))
      } catch (e) {
        if (!cancelled) setError(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [stream])

  const visible = useMemo(() => {
    let out = catalog
    if (activeFilter !== 'all') out = out.filter((c) => c.type === activeFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      out = out.filter((c) => c.subject.toLowerCase().includes(q))
    }
    return out
  }, [catalog, activeFilter, search])

  function openSubject(subject, type) {
    if (type === 'quiz') {
      localStorage.setItem('selectedQuizSubject', subject)
      localStorage.removeItem('selectedQuizId') // subject-wide, not a specific quiz
      navigate('/quiz')
    } else if (type === 'flashcard') {
      localStorage.setItem('selectedFlashSubject', subject)
      localStorage.removeItem('selectedFlashUnit') // subject-wide, not a unit
      navigate('/flashcard')
    } else {
      navigate('/library')
    }
  }

  function iconFor(type) {
    if (type === 'quiz') return '/assets/icons/tests.svg'
    if (type === 'flashcard') return '/assets/icons/flashcards.svg'
    if (type === 'resource') return '/assets/icons/Library.svg'
    return '/assets/icons/book.svg'
  }

  return (
    <div style={{ fontFamily: 'Outfit, sans-serif' }}>
      <DashboardNavbar />

      <section className="flex flex-col items-center mt-[90px] text-center max-md:mt-5">
        <img src="/assets/images/illustration.svg" alt="Illustration" className="max-w-full h-auto max-md:max-w-[80%]" />
        <h2 className="mt-4 text-ez-3xl">Interactive Catalog</h2>
        <div className="mt-4 max-md:px-3.5 max-md:w-full">
          <input
            type="text"
            placeholder="Find quizzes or flashcards..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-[479px] h-[59px] px-4 border border-primary-dark rounded-[30px] text-ez-sm bg-surface text-ink outline-none max-md:w-full max-md:max-w-full max-md:h-12 max-md:text-[0.9rem]"
          />
        </div>
      </section>

      <div className="flex flex-wrap gap-2 justify-center mt-6 max-md:px-3.5">
        {['all', 'quiz', 'flashcard'].map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`flex items-center gap-2 h-11 px-[25px] rounded-[15px] cursor-pointer text-base transition ${
              activeFilter === f ? 'border-0 bg-primary-pale text-primary-strong dark:bg-primary/15 dark:text-primary-glow' : 'border border-border-soft bg-surface text-ink hover:bg-surface-muted'
            } max-md:h-[38px] max-md:px-3.5 max-md:text-[0.85rem]`}
          >
            {f === 'all' ? 'All' : f === 'quiz' ? 'Quizzes' : 'Flashcards'}
          </button>
        ))}
      </div>

      <hr className="opacity-10 my-[30px] mx-0" />

      <div className="ez-container grid grid-cols-4 gap-5 mt-10 max-lg:grid-cols-2 max-[600px]:grid-cols-1 max-md:px-3.5">
        {loading ? (
          <p className="text-center w-full p-[100px] col-span-full">Fetching academic catalog...</p>
        ) : error ? (
          <p className="text-center w-full col-span-full">Error loading catalog: {error}</p>
        ) : visible.length === 0 ? (
          <p className="text-center w-full p-[50px] col-span-full">The catalog is empty. Add content from the Admin Dashboard!</p>
        ) : (
          visible.map((c, i) => (
            <div
              key={`${c.subject}-${c.type}-${i}`}
              onClick={() => openSubject(c.subject, c.type)}
              className="course-card bg-surface text-ink border border-border-soft rounded-[30px] p-5 flex flex-col min-h-[220px] cursor-pointer hover:-translate-y-1.5 hover:shadow-[0_15px_30px_rgba(0,0,0,0.06)]"
            >
              <div className="flex justify-center"><img src={iconFor(c.type)} alt="" className="h-10" /></div>
              <div className="flex gap-2 mt-[30px]">
                <span className="text-base text-primary-strong bg-primary-soft py-1 px-2.5 rounded-[20px]">{c.type}</span>
                <span className="text-base text-primary-strong bg-primary-soft py-1 px-2.5 rounded-[20px]">{c.subject}</span>
              </div>
              <h4 className="mt-5 text-ez-xl">
                {c.subject} {c.type === 'quiz' ? 'Assessment' : c.type === 'flashcard' ? 'Flashcards' : 'Managed Resources'}
              </h4>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
