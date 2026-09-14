import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardNavbar from '../components/DashboardNavbar.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useLang } from '../contexts/LangContext.jsx'
import { getPublishedCourses } from '../services/courses.js'
import { getTeachers } from '../services/academic.js'
import { PageHeader, EmptyState, LoadingGrid } from '../components/ui/kit.jsx'
import Icon from '../components/ui/Icon.jsx'

// Student video-course catalogue: only PUBLISHED courses matching the
// student's stream (or untagged courses, visible to everyone) are shown.
export default function Courses() {
  const navigate = useNavigate()
  const { stream } = useAuth()
  const { t, dir } = useLang()
  const [courses, setCourses] = useState([])
  const [teacherMap, setTeacherMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([getPublishedCourses(stream), getTeachers()])
      .then(([c, teachers]) => {
        if (cancelled) return
        setCourses(c)
        setTeacherMap(Object.fromEntries(teachers.map((tc) => [tc.id, tc])))
      })
      .catch((e) => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [stream])

  return (
    <div dir={dir}>
      <DashboardNavbar />
      <div className="max-w-container mx-auto px-5 mt-[110px] max-md:mt-6 pb-16">
        <PageHeader title={t('video-courses')} />

        {loading ? <LoadingGrid count={6} className="grid-cols-3 max-md:grid-cols-2 max-[520px]:grid-cols-1" />
          : error ? <EmptyState icon={<Icon name="warning" />} title={t('err-generic')} description={error} />
          : courses.length === 0 ? <EmptyState icon={<Icon name="video" />} title={t('no-content-title')} description={t('no-content-desc')} />
          : (
            <div className="stagger-children grid grid-cols-3 gap-4 max-md:grid-cols-2 max-[520px]:grid-cols-1">
              {courses.map((c) => {
                const teacher = teacherMap[c.teacherId]
                return (
                  <button key={c.id} onClick={() => navigate(`/courses/${c.id}`)}
                    className="text-start flex flex-col bg-surface border border-border-soft rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(0,0,0,0.08)] transition">
                    <div className="h-32 bg-gradient-to-br from-primary via-primary-strong to-primary-deep flex items-center justify-center text-white/90">
                      {c.coverURL ? <img src={c.coverURL} alt="" className="w-full h-full object-cover" /> : <Icon name="video" className="w-8 h-8" />}
                    </div>
                    <div className="p-4">
                      <h4 className="font-heading font-bold text-ink line-clamp-2 mb-2">{c.title}</h4>
                      {teacher && (
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-6 h-6 rounded-full bg-primary-soft dark:bg-primary/15 flex items-center justify-center text-[10px] font-bold text-primary-strong overflow-hidden">
                            {teacher.photoURL ? <img src={teacher.photoURL} alt="" className="w-full h-full object-cover" /> : teacher.name?.charAt(0)}
                          </span>
                          <span className="text-xs text-ink-muted truncate">{teacher.name}</span>
                        </div>
                      )}
                      {c.description && <p className="text-xs text-ink-muted line-clamp-2">{c.description}</p>}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
      </div>
    </div>
  )
}
