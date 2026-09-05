import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import DashboardNavbar from '../components/DashboardNavbar.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { api, API_BASE_URL } from '../lib/api.js'

function initials(name) {
  return (name || '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
}

const LockIcon = () => (
  <svg width="13" height="13" viewBox="0 0 20 20" fill="none"><path d="M5 9V7a5 5 0 0 1 10 0v2h1a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h1Zm2 0h6V7a3 3 0 0 0-6 0v2Z" fill="currentColor" /></svg>
)
const PlayIcon = () => (
  <svg width="13" height="13" viewBox="0 0 20 20" fill="none"><path d="M6 4.5v11l9-5.5-9-5.5Z" fill="currentColor" /></svg>
)
const UsersIcon = () => (
  <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><path d="M7 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7 1a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM7 11c-2.8 0-5 1.6-5 3.5V16h10v-1.5c0-1.9-2.2-3.5-5-3.5Zm7 .2c2 .3 3.5 1.6 3.5 3.3V16h-2.5v-1.5c0-1.1-.4-2-1-2.7v-.6Z" fill="currentColor" /></svg>
)

export default function CourseDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [course, setCourse] = useState(null)
  const [lessons, setLessons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeLessonId, setActiveLessonId] = useState(null)
  const [videoUrl, setVideoUrl] = useState('')
  const [playerError, setPlayerError] = useState('')

  useEffect(() => {
    api.getCourse(id)
      .then((data) => {
        setCourse(data.course)
        setLessons(data.lessons)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  async function playLesson(lesson) {
    setPlayerError('')
    setActiveLessonId(lesson.id)
    setVideoUrl('')
    try {
      const data = await api.watchLesson(lesson.id)
      setVideoUrl(`${API_BASE_URL}${data.url}`)
    } catch (e) {
      setPlayerError(
        e.data?.error === 'access_denied'
          ? "You'll need to enroll in this course to watch this lesson."
          : 'Could not load this lesson.'
      )
    }
  }

  if (loading) {
    return (
      <div style={{ fontFamily: 'Outfit, sans-serif' }}>
        <DashboardNavbar />
        <p className="text-center mt-40 text-ink-muted">Loading course...</p>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div style={{ fontFamily: 'Outfit, sans-serif' }}>
        <DashboardNavbar />
        <div className="text-center mt-40">
          <p className="text-ink-muted">This course isn't available.</p>
          <Link to="/courses" className="text-primary-strong">Back to courses</Link>
        </div>
      </div>
    )
  }

  const activeLesson = lessons.find((l) => l.id === activeLessonId)

  return (
    <div style={{ fontFamily: 'Outfit, sans-serif' }}>
      <DashboardNavbar />

      <div className="ez-container mt-[110px] max-md:mt-5 max-md:px-3.5">
        <p className="text-sm text-ink-muted mb-4">
          <Link to="/courses" className="hover:text-primary-strong">Courses</Link>
          <span className="mx-2">/</span>
          <span className="text-ink">{course.title}</span>
        </p>

        <div className="flex gap-8 max-lg:flex-col">
          <div className="flex-[2] min-w-0">
            <div className="bg-black rounded-[24px] overflow-hidden aspect-video flex items-center justify-center relative">
              {videoUrl ? (
                <video key={videoUrl} src={videoUrl} controls autoPlay className="w-full h-full" />
              ) : (
                <div className="text-center px-6">
                  {course.cover_key && (
                    <img src={`${API_BASE_URL}/v1/courses/${course.id}/cover`} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
                  )}
                  <p className="relative text-white/90 font-heading">
                    {playerError || (activeLesson ? `Loading "${activeLesson.title}"...` : 'Select a lesson to start watching')}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-4 mt-5 flex-wrap">
              <div className="flex gap-2 flex-wrap">
                <span className="text-xs font-medium text-primary-strong bg-primary-soft py-1 px-2.5 rounded-pill">{course.subject}</span>
                {course.bac_stream && <span className="text-xs font-medium text-primary-strong bg-primary-soft py-1 px-2.5 rounded-pill" dir="auto">{course.bac_stream}</span>}
              </div>
              <span className="flex items-center gap-1.5 text-sm text-ink-muted">
                <UsersIcon />
                {course.enrolled_count > 0 ? `${course.enrolled_count} student${course.enrolled_count === 1 ? '' : 's'} enrolled` : 'Be the first to enroll'}
              </span>
            </div>

            <h1 className="font-heading font-extrabold text-3xl mt-3 max-md:text-2xl">{course.title}</h1>

            <div className="flex items-center gap-3 mt-4 mb-6">
              <div className="w-11 h-11 rounded-full bg-bg-card flex items-center justify-center font-heading font-semibold text-primary-strong shrink-0 relative overflow-hidden">
                <span>{initials(course.teacher_name)}</span>
                <img
                  src={`${API_BASE_URL}/v1/teachers/${course.teacher_id}/avatar`}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
              </div>
              <div>
                <p className="font-heading font-medium">{course.teacher_name}</p>
                <p className="text-xs text-ink-muted">Instructor</p>
              </div>
            </div>

            {course.description && (
              <div className="mb-8">
                <h3 className="font-heading font-semibold text-lg mb-2">About this course</h3>
                <p className="text-base leading-relaxed text-ink-muted">{course.description}</p>
              </div>
            )}

            {!user && (
              <p className="text-sm text-ink-muted mb-6">
                <Link to="/login" className="text-primary-strong font-medium">Log in</Link> to enroll and unlock every lesson.
              </p>
            )}
          </div>

          <div className="flex-1 max-lg:w-full">
            <div className="border border-border-light rounded-[24px] p-6 bg-white sticky top-[110px]">
              <p className="font-heading font-extrabold text-3xl text-primary-strong">{course.price_da} DA</p>
              <button
                onClick={() => lessons[0] && playLesson(lessons[0])}
                className="w-full mt-4 bg-primary text-white border-0 rounded-pill font-semibold py-3.5 cursor-pointer hover:shadow-[0_10px_25px_rgba(171,16,23,0.3)] disabled:opacity-50"
                disabled={lessons.length === 0}
              >
                {lessons.some((l) => l.is_free_preview === 1) ? 'Watch free preview' : 'Enroll now'}
              </button>
              <p className="text-xs text-ink-muted text-center mt-2">Checkout isn't live yet — free-preview lessons play instantly.</p>

              <div className="flex items-center justify-between mt-6 mb-3">
                <h3 className="font-heading text-lg">Course content</h3>
                <span className="text-xs text-ink-muted">{lessons.length} lesson{lessons.length === 1 ? '' : 's'}</span>
              </div>
              <div className="flex flex-col gap-2">
                {lessons.map((l, i) => {
                  const locked = l.is_free_preview !== 1
                  const isActive = activeLessonId === l.id
                  return (
                    <button
                      key={l.id}
                      onClick={() => playLesson(l)}
                      className={`text-left flex items-center gap-3 p-3 rounded-2xl border transition ${
                        isActive ? 'border-primary bg-primary-pale' : 'border-border-soft hover:bg-[#f9f9f9]'
                      }`}
                    >
                      <span className="w-7 h-7 flex items-center justify-center rounded-full bg-bg-card text-xs font-heading shrink-0">{i + 1}</span>
                      <span className="flex-1 text-sm">{l.title}</span>
                      <span className="shrink-0 text-ink-muted">{locked ? <LockIcon /> : <PlayIcon />}</span>
                    </button>
                  )
                })}
                {lessons.length === 0 && <p className="text-ink-muted text-sm">No lessons published yet.</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
