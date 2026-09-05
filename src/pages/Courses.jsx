import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardNavbar from '../components/DashboardNavbar.jsx'
import { api, API_BASE_URL } from '../lib/api.js'

const NEW_WINDOW_DAYS = 14

function isNew(createdAt) {
  if (!createdAt) return false
  const days = (Date.now() - new Date(createdAt.replace(' ', 'T') + 'Z').getTime()) / 86400000
  return days <= NEW_WINDOW_DAYS
}

function initials(name) {
  return (name || '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
}

const UsersIcon = () => (
  <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><path d="M7 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7 1a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM7 11c-2.8 0-5 1.6-5 3.5V16h10v-1.5c0-1.9-2.2-3.5-5-3.5Zm7 .2c2 .3 3.5 1.6 3.5 3.3V16h-2.5v-1.5c0-1.1-.4-2-1-2.7v-.6Z" fill="currentColor" /></svg>
)

export default function Courses() {
  const [courses, setCourses] = useState([])
  const [activeStream, setActiveStream] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.listCourses()
      .then((data) => setCourses(data.courses))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const streams = useMemo(() => {
    const s = new Set()
    courses.forEach((c) => c.bac_stream && s.add(c.bac_stream))
    return Array.from(s)
  }, [courses])

  const stats = useMemo(() => {
    const teacherSet = new Set(courses.map((c) => c.teacher_name))
    const lessonTotal = courses.reduce((sum, c) => sum + (c.lesson_count || 0), 0)
    return { courseCount: courses.length, teacherCount: teacherSet.size, lessonTotal }
  }, [courses])

  const filtered = useMemo(() => {
    let out = courses
    if (activeStream !== 'all') out = out.filter((c) => c.bac_stream === activeStream)
    if (search.trim()) {
      const q = search.toLowerCase()
      out = out.filter((c) => (c.title || '').toLowerCase().includes(q) || (c.subject || '').toLowerCase().includes(q))
    }
    return out
  }, [courses, activeStream, search])

  return (
    <div style={{ fontFamily: 'Outfit, sans-serif' }}>
      <DashboardNavbar />

      <section className="flex flex-col items-center mt-[110px] text-center max-md:mt-5 px-4">
        <span className="inline-flex items-center bg-bg-card text-primary font-heading text-base rounded-pill px-5 py-2 mb-6">
          browse
        </span>
        <h1 className="font-heading font-extrabold text-4xl max-md:text-[1.8rem]">Video Courses From Real Teachers</h1>
        <p className="mt-3 text-ink-muted max-w-[560px]">
          Full-length video courses, taught by teachers, organized by BAC stream — buy once, watch anytime.
        </p>
        <div className="mt-6 max-md:w-full">
          <input
            type="text"
            placeholder="Search courses by title or subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-[479px] h-[59px] px-5 border border-primary-dark rounded-pill text-sm max-md:w-full outline-none"
          />
        </div>

        {!loading && courses.length > 0 && (
          <div className="flex gap-10 mt-10 max-md:gap-6 max-md:flex-wrap max-md:justify-center">
            {[
              { n: stats.courseCount, l: 'courses' },
              { n: stats.teacherCount, l: 'teachers' },
              { n: stats.lessonTotal, l: 'lessons' }
            ].map((s) => (
              <div key={s.l} className="text-center">
                <p className="font-heading font-extrabold text-3xl text-primary-strong">{s.n}</p>
                <p className="text-sm text-ink-muted capitalize">{s.l}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="flex flex-wrap gap-2 justify-center mt-10 max-md:px-3.5">
        <button
          onClick={() => setActiveStream('all')}
          className={`flex items-center gap-2 h-11 px-[25px] rounded-[15px] cursor-pointer text-base transition ${
            activeStream === 'all' ? 'border-0 bg-primary-pale text-primary-strong' : 'border border-border-soft bg-white text-ink hover:bg-[#f9f9f9]'
          }`}
        >
          All streams
        </button>
        {streams.map((s) => (
          <button
            key={s}
            onClick={() => setActiveStream(s)}
            className={`flex items-center gap-2 h-11 px-[25px] rounded-[15px] cursor-pointer text-base transition ${
              activeStream === s ? 'border-0 bg-primary-pale text-primary-strong' : 'border border-border-soft bg-white text-ink hover:bg-[#f9f9f9]'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <hr className="opacity-10 my-[30px] mx-0" />

      <div className="ez-container grid grid-cols-3 gap-6 mt-10 max-lg:grid-cols-2 max-[600px]:grid-cols-1 max-md:px-3.5 pb-24">
        {loading ? (
          <p className="text-center w-full p-[100px] col-span-full">Loading courses...</p>
        ) : error ? (
          <p className="text-center w-full col-span-full">Could not load courses: {error}</p>
        ) : filtered.length === 0 ? (
          <div className="col-span-full text-center py-24 border border-dashed border-border-soft rounded-[30px]">
            <p className="text-ink-muted">No published courses yet — check back soon, or ask a teacher to publish one.</p>
          </div>
        ) : (
          filtered.map((c) => (
            <Link
              key={c.id}
              to={`/courses/${c.id}`}
              className="course-card group block bg-white border border-border-soft rounded-[24px] overflow-hidden no-underline text-ink hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition"
            >
              <div className="relative h-[170px] bg-gradient-to-br from-primary-dark to-primary-deep flex items-center justify-center overflow-hidden">
                {c.cover_key ? (
                  <img src={`${API_BASE_URL}/v1/courses/${c.id}/cover`} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-5xl opacity-90">🎥</span>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition scale-90 group-hover:scale-100">
                    <div className="w-0 h-0 border-y-[7px] border-y-transparent border-l-[11px] border-l-primary-strong ml-1" />
                  </div>
                </div>
                {isNew(c.created_at) && (
                  <span className="absolute top-3 left-3 bg-white text-primary-strong text-xs font-semibold px-2.5 py-1 rounded-pill">New</span>
                )}
                <span className="absolute bottom-3 right-3 bg-black/60 text-white text-xs font-medium px-2.5 py-1 rounded-pill backdrop-blur-sm">
                  {c.lesson_count} lesson{c.lesson_count === 1 ? '' : 's'}
                </span>
              </div>

              <div className="p-6 flex flex-col gap-3">
                <div className="flex gap-2 flex-wrap">
                  <span className="text-xs font-medium text-primary-strong bg-primary-soft py-1 px-2.5 rounded-pill">{c.subject}</span>
                  {c.bac_stream && <span className="text-xs font-medium text-primary-strong bg-primary-soft py-1 px-2.5 rounded-pill" dir="auto">{c.bac_stream}</span>}
                </div>
                <h4 className="font-heading font-semibold text-xl leading-snug">{c.title}</h4>

                <div className="flex items-center gap-2 mt-1">
                  <div className="w-7 h-7 rounded-full bg-bg-card flex items-center justify-center text-xs font-heading font-semibold text-primary-strong shrink-0 relative overflow-hidden">
                    <span>{initials(c.teacher_name)}</span>
                    <img
                      src={`${API_BASE_URL}/v1/teachers/${c.teacher_id}/avatar`}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.style.display = 'none' }}
                    />
                  </div>
                  <p className="text-sm text-ink-muted">{c.teacher_name}</p>
                </div>

                <div className="flex items-center justify-between pt-3 mt-1 border-t border-border-light">
                  <span className="flex items-center gap-1.5 text-xs text-ink-muted">
                    <UsersIcon />
                    {c.enrolled_count > 0 ? `${c.enrolled_count} enrolled` : 'New course'}
                  </span>
                  <p className="font-heading font-bold text-primary-strong text-lg">{c.price_da} DA</p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
