import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs } from 'firebase/firestore'
import DashboardNavbar from '../components/DashboardNavbar.jsx'
import { db } from '../firebase.js'

export default function Games() {
  const navigate = useNavigate()
  const [catalog, setCatalog] = useState([])
  const [activeFilter, setActiveFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const [quizSnap, flashSnap, resSnap] = await Promise.all([
          getDocs(collection(db, 'quizzes')),
          getDocs(collection(db, 'flashcards')),
          getDocs(collection(db, 'resources'))
        ])
        const entries = new Set()
        quizSnap.forEach((d) => entries.add(`${d.data().subject}|quiz`))
        flashSnap.forEach((d) => entries.add(`${d.data().subject}|flashcard`))
        resSnap.forEach((d) => entries.add(`${d.data().subject}|resource`))
        setCatalog(Array.from(entries).map((e) => {
          const [subject, type] = e.split('|')
          return { subject, type }
        }))
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

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
      navigate('/quiz')
    } else if (type === 'flashcard') {
      localStorage.setItem('selectedFlashSubject', subject)
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
            className="w-[479px] h-[59px] px-4 border border-primary-dark rounded-[30px] text-ez-sm max-md:w-full max-md:max-w-full max-md:h-12 max-md:text-[0.9rem] outline-none"
          />
        </div>
      </section>

      <div className="flex flex-wrap gap-2 justify-center mt-6 max-md:px-3.5">
        {['all', 'quiz', 'flashcard'].map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`flex items-center gap-2 h-11 px-[25px] rounded-[15px] cursor-pointer text-base transition ${
              activeFilter === f ? 'border-0 bg-primary-pale text-primary-strong' : 'border border-border-soft bg-white text-ink hover:bg-[#f9f9f9]'
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
              className="course-card bg-white border border-border-soft rounded-[30px] p-5 flex flex-col min-h-[220px] cursor-pointer hover:-translate-y-1.5 hover:shadow-[0_15px_30px_rgba(0,0,0,0.06)]"
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
