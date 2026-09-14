import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import DashboardNavbar from '../components/DashboardNavbar.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useLang } from '../contexts/LangContext.jsx'
import { getCourseById, getVideosForCourse } from '../services/courses.js'
import { getTeachers } from '../services/academic.js'
import { getAllProgress, markVideoStarted, setVideoCompleted } from '../services/progress.js'
import { PageHeader, EmptyState, SkeletonLine, ProgressBar } from '../components/ui/kit.jsx'
import Icon from '../components/ui/Icon.jsx'

// Course detail: video list with real per-video progress. There's no embedded
// player (videos stay URL-based, same as Resources), so "watched" tracking is
// the same honest started/completed signal used elsewhere — not fake watch %.
export default function CourseDetail() {
  const { courseId } = useParams()
  const { user } = useAuth()
  const { t, dir } = useLang()
  const [course, setCourse] = useState(null)
  const [teacher, setTeacher] = useState(null)
  const [videos, setVideos] = useState([])
  const [progressMap, setProgressMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    async function load() {
      const [c, vids, progress] = await Promise.all([
        getCourseById(courseId), getVideosForCourse(courseId), getAllProgress(user.uid)
      ])
      if (cancelled) return
      setCourse(c)
      setVideos(vids)
      setProgressMap(Object.fromEntries(progress.filter((p) => p.type === 'video').map((p) => [p.contentId, p])))
      if (c?.teacherId) {
        const teachers = await getTeachers()
        if (!cancelled) setTeacher(teachers.find((tc) => tc.id === c.teacherId) || null)
      }
      if (!cancelled) setLoading(false)
    }
    load().catch((e) => { if (!cancelled) { setError(e.message); setLoading(false) } })
    return () => { cancelled = true }
  }, [courseId, user.uid])

  const completedCount = useMemo(() => videos.filter((v) => progressMap[v.id]?.completed).length, [videos, progressMap])
  const pct = videos.length ? Math.round((completedCount / videos.length) * 100) : 0

  async function watch(video) {
    window.open(video.videoURL, '_blank', 'noopener')
    if (!progressMap[video.id]) {
      await markVideoStarted(user.uid, video)
      setProgressMap((prev) => ({ ...prev, [video.id]: { completed: false } }))
    }
  }

  async function toggleCompleted(video) {
    const next = !progressMap[video.id]?.completed
    await setVideoCompleted(user.uid, video, next)
    setProgressMap((prev) => ({ ...prev, [video.id]: { ...prev[video.id], completed: next } }))
  }

  if (loading) return (
    <div dir={dir}>
      <DashboardNavbar />
      <div className="max-w-container mx-auto px-5 mt-[110px] max-md:mt-6 pb-16">
        <SkeletonLine className="h-4 w-24 mb-6" />
        <SkeletonLine className="h-8 w-2/3 mb-2" />
        <SkeletonLine className="h-4 w-1/3 mb-6" />
        <SkeletonLine className="h-2 w-full max-w-sm mb-8" />
        <div className="flex flex-col gap-2 max-w-2xl">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-surface border border-border-soft">
              <div className="w-7 h-7 rounded-full skeleton shrink-0" />
              <SkeletonLine className="h-4 flex-1" />
              <SkeletonLine className="h-8 w-20 rounded-pill shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
  if (error || !course) return (
    <div dir={dir}>
      <DashboardNavbar />
      <div className="max-w-container mx-auto px-5 mt-[110px] pb-16">
        <EmptyState icon={<Icon name="warning" />} title={t('err-generic')} description={error || 'Course not found.'} />
      </div>
    </div>
  )

  return (
    <div dir={dir}>
      <DashboardNavbar />
      <div className="max-w-container mx-auto px-5 mt-[110px] max-md:mt-6 pb-16">
        <Link to="/courses" className="text-sm text-ink-muted hover:text-primary no-underline">← {t('video-courses')}</Link>
        <PageHeader title={course.title} subtitle={teacher?.name} />

        {course.description && <p className="text-ink-muted mb-5 max-w-2xl">{course.description}</p>}

        <div className="mb-6 max-w-sm">
          <div className="flex justify-between text-xs text-ink-muted mb-1">
            <span>{completedCount} / {videos.length}</span>
            <span>{pct}%</span>
          </div>
          <ProgressBar value={pct} />
        </div>

        {videos.length === 0 ? (
          <EmptyState icon={<Icon name="video" />} title={t('no-content-title')} description={t('no-content-desc')} />
        ) : (
          <div className="flex flex-col gap-2 max-w-2xl">
            {videos.map((v, i) => {
              const done = progressMap[v.id]?.completed
              return (
                <div key={v.id} className="flex items-center gap-3 p-4 rounded-xl bg-surface border border-border-soft">
                  <button onClick={() => toggleCompleted(v)} aria-label={done ? 'mark incomplete' : 'mark complete'}
                    className={`w-7 h-7 shrink-0 rounded-full border-2 flex items-center justify-center text-white font-bold transition-colors ${done ? 'bg-emerald-500 border-emerald-500' : 'border-border-card'}`}>
                    {done ? '✓' : ''}
                  </button>
                  <span className="text-sm text-ink-muted w-6 shrink-0">{i + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold truncate ${done ? 'text-ink-muted line-through' : 'text-ink'}`}>{v.title}</p>
                    {v.duration > 0 && <p className="text-xs text-ink-muted">{v.duration} min</p>}
                  </div>
                  <button onClick={() => watch(v)} className="px-4 py-2 rounded-pill bg-primary text-white text-sm font-semibold hover:bg-primary-strong transition-colors shrink-0">
                    {t('start')}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
