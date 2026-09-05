import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs } from 'firebase/firestore'
import DashboardNavbar from '../components/DashboardNavbar.jsx'
import { db } from '../firebase.js'
import { api } from '../lib/api.js'

const SAVES_KEY = 'ezbac_saved_resources'

const sections = [
  { id: 'all', label: 'My Library', icon: '/assets/icons/Library.svg' },
  { id: 'saves', label: 'Saves', icon: '/assets/icons/save.svg' },
  { id: 'quizzes', label: 'Quizzes', icon: '/assets/icons/tests.svg' },
  { id: 'resumes', label: 'Resumes', icon: '/assets/icons/resume.svg' },
  { id: 'teachers', label: 'Teachers', icon: '/assets/icons/support.svg' }
]

function loadSaves() {
  try {
    return JSON.parse(localStorage.getItem(SAVES_KEY) || '[]')
  } catch {
    return []
  }
}

function SectionButton({ section, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-left text-base whitespace-nowrap transition w-full ${
        isActive ? 'bg-primary-pale text-primary-strong font-medium' : 'text-ink hover:bg-[#f9f9f9]'
      }`}
    >
      <img
        src={section.icon}
        alt=""
        className="w-5 h-5 shrink-0"
        style={isActive ? { filter: 'brightness(0) saturate(100%) invert(22%) sepia(97%) saturate(6565%) hue-rotate(346deg) brightness(92%) contrast(107%)' } : undefined}
      />
      {section.label}
    </button>
  )
}

export default function Library() {
  const navigate = useNavigate()
  const [active, setActive] = useState('all')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [resources, setResources] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [courses, setCourses] = useState([])
  const [saved, setSaved] = useState(loadSaves)
  const [activeSubject, setActiveSubject] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const [resSnap, quizSnap] = await Promise.all([
          getDocs(collection(db, 'resources')),
          getDocs(collection(db, 'quizzes'))
        ])
        setResources(resSnap.docs.map((d) => ({ id: d.id, ...d.data() })))
        setQuizzes(quizSnap.docs.map((d) => ({ id: d.id, ...d.data() })))
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
    api.listCourses().then((data) => setCourses(data.courses)).catch(() => {})
  }, [])

  useEffect(() => {
    localStorage.setItem(SAVES_KEY, JSON.stringify(saved))
  }, [saved])

  function toggleSave(id) {
    setSaved((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const teachers = useMemo(() => {
    const map = new Map()
    courses.forEach((c) => {
      if (!c.teacher_name) return
      const entry = map.get(c.teacher_name) || { name: c.teacher_name, subjects: new Set(), courseCount: 0 }
      entry.subjects.add(c.subject)
      entry.courseCount += 1
      map.set(c.teacher_name, entry)
    })
    return Array.from(map.values())
  }, [courses])

  const baseList = active === 'resumes' ? resources.filter((r) => r.type === 'drive') : resources

  const subjects = useMemo(() => {
    const s = new Set()
    baseList.forEach((r) => r.subject && s.add(r.subject))
    return Array.from(s)
  }, [baseList])

  const filteredResources = useMemo(() => {
    let out = active === 'saves' ? resources.filter((r) => saved.includes(r.id)) : baseList
    if (activeSubject !== 'all') out = out.filter((r) => r.subject === activeSubject)
    if (search.trim()) {
      const q = search.toLowerCase()
      out = out.filter((r) => (r.title || '').toLowerCase().includes(q) || (r.subject || '').toLowerCase().includes(q))
    }
    return out
  }, [baseList, resources, saved, active, activeSubject, search])

  function openQuiz(subject) {
    localStorage.setItem('selectedQuizSubject', subject)
    navigate('/quiz')
  }

  const showResourceGrid = active === 'all' || active === 'saves' || active === 'resumes'
  const heading = sections.find((s) => s.id === active)?.label || 'My Library'

  return (
    <div style={{ fontFamily: 'Outfit, sans-serif' }}>
      <DashboardNavbar />

      <div className="ez-container mt-[110px] max-md:mt-5 max-md:px-3.5 flex gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-[220px] shrink-0">
          <div className="border border-border-light rounded-[24px] p-3 bg-white flex flex-col gap-1.5 sticky top-[110px]">
            {sections.map((s) => (
              <SectionButton key={s.id} section={s} isActive={active === s.id} onClick={() => setActive(s.id)} />
            ))}
          </div>
        </aside>

        {/* Mobile slide-in drawer */}
        <div className={`lg:hidden fixed inset-0 z-[2000] transition-opacity duration-300 ${drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className={`absolute top-0 left-0 h-full w-[78%] max-w-[300px] bg-white p-5 flex flex-col gap-1.5 shadow-2xl transition-transform duration-300 ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="flex items-center justify-between mb-4 px-1">
              <span className="font-heading font-semibold text-lg">Library</span>
              <button onClick={() => setDrawerOpen(false)} aria-label="Close menu" className="text-2xl text-ink-muted leading-none px-2">&times;</button>
            </div>
            {sections.map((s) => (
              <SectionButton key={s.id} section={s} isActive={active === s.id} onClick={() => { setActive(s.id); setDrawerOpen(false) }} />
            ))}
          </div>
        </div>

        <main className="flex-1 min-w-0">
          {/* Mobile section trigger */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="lg:hidden flex items-center gap-2.5 h-11 px-4 mb-5 rounded-2xl border border-border-light bg-white text-sm font-medium"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M3 5h14M3 10h14M3 15h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
            {heading}
            <svg width="10" height="10" viewBox="0 0 20 20" fill="none" className="ml-auto"><path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>

          <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
            <h2 className="font-heading font-extrabold text-3xl max-md:text-2xl max-lg:hidden">{heading}</h2>
            {showResourceGrid && (
              <input
                type="text"
                placeholder="Search resources..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-12 px-5 border border-primary-dark rounded-pill text-sm outline-none w-[280px] max-md:w-full"
              />
            )}
          </div>

          {showResourceGrid && (
            <div className="relative mb-6 w-full max-w-[280px]">
              <select
                value={activeSubject}
                onChange={(e) => setActiveSubject(e.target.value)}
                className="w-full h-11 pl-4 pr-10 rounded-2xl border border-border-soft bg-white text-sm text-ink appearance-none cursor-pointer outline-none focus:border-primary"
              >
                <option value="all">All subjects</option>
                {subjects.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <svg width="10" height="10" viewBox="0 0 20 20" fill="none" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-muted">
                <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}

          {showResourceGrid && (
            <div className="grid grid-cols-3 gap-5 max-lg:grid-cols-2 max-[600px]:grid-cols-1 pb-24">
              {loading ? (
                <p className="text-center w-full p-[100px] col-span-full">Fetching resources...</p>
              ) : error ? (
                <p className="text-center w-full col-span-full">Error loading resources: {error}</p>
              ) : filteredResources.length === 0 ? (
                <div className="col-span-full text-center py-24 border border-dashed border-border-soft rounded-[30px]">
                  <p className="text-ink-muted">
                    {active === 'saves' ? "You haven't saved anything yet — tap the bookmark on a resource to save it." : 'No resources found.'}
                  </p>
                </div>
              ) : (
                filteredResources.map((res) => (
                  <div
                    key={res.id}
                    className="course-card flex flex-col bg-white border border-border-soft rounded-[30px] overflow-hidden hover:-translate-y-1.5 hover:shadow-[0_15px_30px_rgba(0,0,0,0.06)] transition"
                  >
                    <div className="relative h-[130px] bg-bg-card flex items-center justify-center text-5xl overflow-hidden">
                      {res.coverUrl ? (
                        <img src={res.coverUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        res.type === 'drive' ? '📂' : '🎥'
                      )}
                      <button
                        onClick={() => toggleSave(res.id)}
                        aria-label="Save resource"
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:scale-110 transition"
                      >
                        <img src="/assets/icons/save.svg" alt="" className="w-4 h-4" style={saved.includes(res.id) ? { filter: 'brightness(0) saturate(100%) invert(22%) sepia(97%) saturate(6565%) hue-rotate(346deg) brightness(92%) contrast(107%)' } : { opacity: 0.5 }} />
                      </button>
                    </div>
                    <div className="p-6 flex flex-col gap-2.5 flex-1">
                      <span
                        className="self-start text-sm py-1 px-2.5 rounded-pill"
                        style={{
                          background: res.type === 'drive' ? '#e3f2fd' : '#fff0f0',
                          color: res.type === 'drive' ? '#1e88e5' : '#BB181D'
                        }}
                      >
                        {res.subject}
                      </span>
                      <h4 className="font-heading font-semibold text-xl">{res.title}</h4>
                      <button
                        onClick={() => window.open(res.url, '_blank')}
                        className="mt-auto w-full bg-primary text-white border-0 rounded-pill font-medium px-8 py-2.5 cursor-pointer hover:shadow-[0_10px_25px_rgba(171,16,23,0.3)]"
                      >
                        Open Resource
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {active === 'quizzes' && (
            <div className="grid grid-cols-3 gap-5 max-lg:grid-cols-2 max-[600px]:grid-cols-1 pb-24">
              {loading ? (
                <p className="text-center w-full p-[100px] col-span-full">Loading quizzes...</p>
              ) : quizzes.length === 0 ? (
                <div className="col-span-full text-center py-24 border border-dashed border-border-soft rounded-[30px]">
                  <p className="text-ink-muted">No quizzes available yet.</p>
                </div>
              ) : (
                quizzes.map((q) => (
                  <div
                    key={q.id}
                    className="course-card flex flex-col bg-white border border-border-soft rounded-[30px] overflow-hidden hover:-translate-y-1.5 hover:shadow-[0_15px_30px_rgba(0,0,0,0.06)] transition"
                  >
                    <div className="h-[130px] bg-bg-card flex items-center justify-center text-5xl">📝</div>
                    <div className="p-6 flex flex-col gap-2.5 flex-1">
                      <span className="self-start text-sm text-primary-strong bg-primary-soft py-1 px-2.5 rounded-pill">{q.subject}</span>
                      <h4 className="font-heading font-semibold text-xl">{q.title || `${q.subject} Quiz`}</h4>
                      <button
                        onClick={() => openQuiz(q.subject)}
                        className="mt-auto w-full bg-primary text-white border-0 rounded-pill font-medium px-8 py-2.5 cursor-pointer hover:shadow-[0_10px_25px_rgba(171,16,23,0.3)]"
                      >
                        Start Quiz
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {active === 'teachers' && (
            <div className="grid grid-cols-3 gap-5 max-lg:grid-cols-2 max-[600px]:grid-cols-1 pb-24">
              {teachers.length === 0 ? (
                <div className="col-span-full text-center py-24 border border-dashed border-border-soft rounded-[30px]">
                  <p className="text-ink-muted">No teachers with published courses yet.</p>
                </div>
              ) : (
                teachers.map((t) => (
                  <div key={t.name} className="bg-white border border-border-soft rounded-[30px] p-6 flex flex-col items-center text-center gap-2">
                    <div className="w-16 h-16 rounded-full bg-bg-card flex items-center justify-center text-2xl font-heading font-semibold text-primary-strong">
                      {t.name.charAt(0)}
                    </div>
                    <h4 className="font-heading font-semibold text-xl">{t.name}</h4>
                    <p className="text-sm text-ink-muted">{Array.from(t.subjects).join(', ')}</p>
                    <p className="text-sm text-primary-strong">{t.courseCount} course{t.courseCount === 1 ? '' : 's'}</p>
                    <button
                      onClick={() => navigate('/courses')}
                      className="mt-2 w-full bg-primary text-white border-0 rounded-pill font-medium px-8 py-2.5 cursor-pointer hover:shadow-[0_10px_25px_rgba(171,16,23,0.3)]"
                    >
                      View courses
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
