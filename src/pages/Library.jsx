import { useEffect, useMemo, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import DashboardNavbar from '../components/DashboardNavbar.jsx'
import { db } from '../firebase.js'

export default function Library() {
  const [resources, setResources] = useState([])
  const [activeSubject, setActiveSubject] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDocs(collection(db, 'resources'))
        setResources(snap.docs.map((d) => d.data()))
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const subjects = useMemo(() => {
    const s = new Set()
    resources.forEach((r) => r.subject && s.add(r.subject))
    return Array.from(s)
  }, [resources])

  const filtered = useMemo(() => {
    let out = resources
    if (activeSubject !== 'all') out = out.filter((r) => r.subject === activeSubject)
    if (search.trim()) {
      const q = search.toLowerCase()
      out = out.filter((r) => (r.title || '').toLowerCase().includes(q) || (r.subject || '').toLowerCase().includes(q))
    }
    return out
  }, [resources, activeSubject, search])

  return (
    <div style={{ fontFamily: 'Outfit, sans-serif' }}>
      <DashboardNavbar />

      <section className="flex flex-col items-center mt-[90px] text-center max-md:mt-5">
        <img src="/assets/images/illustration.svg" alt="Illustration" className="max-w-full h-auto max-md:max-w-[80%]" />
        <h2 className="mt-4 text-ez-3xl">Academic Resource Hub</h2>
        <div className="mt-4 max-md:px-3.5 max-md:w-full">
          <input
            type="text"
            placeholder="Search resources..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-[479px] h-[59px] px-4 border border-primary-dark rounded-[30px] text-ez-sm max-md:w-full max-md:max-w-full max-md:h-12 max-md:text-[0.9rem] outline-none"
          />
        </div>
      </section>

      <div className="flex flex-wrap gap-2 justify-center mt-6 max-md:px-3.5">
        <button
          onClick={() => setActiveSubject('all')}
          className={`flex items-center gap-2 h-11 px-[25px] rounded-[15px] cursor-pointer text-base transition ${
            activeSubject === 'all' ? 'border-0 bg-primary-pale text-primary-strong' : 'border border-border-soft bg-white text-ink hover:bg-[#f9f9f9]'
          } max-md:h-[38px] max-md:px-3.5 max-md:text-[0.85rem]`}
        >
          All
        </button>
        {subjects.map((s) => (
          <button
            key={s}
            onClick={() => setActiveSubject(s)}
            className={`flex items-center gap-2 h-11 px-[25px] rounded-[15px] cursor-pointer text-base transition ${
              activeSubject === s ? 'border-0 bg-primary-pale text-primary-strong' : 'border border-border-soft bg-white text-ink hover:bg-[#f9f9f9]'
            } max-md:h-[38px] max-md:px-3.5 max-md:text-[0.85rem]`}
          >
            {s}
          </button>
        ))}
      </div>

      <hr className="opacity-10 my-[30px] mx-0" />

      <div className="ez-container grid grid-cols-4 gap-5 mt-10 max-lg:grid-cols-2 max-[600px]:grid-cols-1 max-md:px-3.5">
        {loading ? (
          <p className="text-center w-full p-[100px] col-span-full">Fetching resources...</p>
        ) : error ? (
          <p className="text-center w-full col-span-full">Error loading resources: {error}</p>
        ) : filtered.length === 0 ? (
          <p className="text-center w-full col-span-full">No resources found.</p>
        ) : (
          filtered.map((res, i) => (
            <div key={i} className="course-card flex flex-col justify-between bg-white border border-border-soft rounded-[30px] p-[25px] min-h-[220px] hover:-translate-y-1.5 hover:shadow-[0_15px_30px_rgba(0,0,0,0.06)]">
              <div>
                <div className="text-[40px] mb-[15px]">{res.type === 'drive' ? '📂' : '🎥'}</div>
                <span
                  className="text-base inline-block py-1 px-2.5 rounded-[20px]"
                  style={{
                    background: res.type === 'drive' ? '#e3f2fd' : '#fff0f0',
                    color: res.type === 'drive' ? '#1e88e5' : '#BB181D'
                  }}
                >
                  {res.subject}
                </span>
                <h4 className="my-[15px] text-ez-xl">{res.title}</h4>
              </div>
              <button
                onClick={() => window.open(res.url, '_blank')}
                className="mt-2.5 w-full bg-primary text-white border-0 rounded-pill font-medium px-8 py-2.5 cursor-pointer hover:shadow-[0_10px_25px_rgba(171,16,23,0.3)]"
              >
                Open Resource
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
