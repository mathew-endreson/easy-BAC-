import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardNavbar from '../components/DashboardNavbar.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useLang } from '../contexts/LangContext.jsx'
import { useFavorites } from '../contexts/FavoritesContext.jsx'
import { getTeacherById } from '../services/academic.js'
import { getCoursesByTeacher } from '../services/courses.js'
import { PageHeader, EmptyState, LoadingGrid } from '../components/ui/kit.jsx'
import Icon from '../components/ui/Icon.jsx'

// A teacher's public profile: photo/bio/specialization + only the courses they
// actually teach (filtered to the student's stream), reached by tapping a
// teacher card on /teachers.
export default function TeacherDetail() {
  const { teacherId } = useParams()
  const navigate = useNavigate()
  const { stream } = useAuth()
  const { t, dir } = useLang()
  const { isFavorite, toggleFavorite } = useFavorites()
  const [teacher, setTeacher] = useState(null)
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([getTeacherById(teacherId), getCoursesByTeacher(teacherId, stream)])
      .then(([tc, c]) => { if (!cancelled) { setTeacher(tc); setCourses(c) } })
      .catch((e) => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [teacherId, stream])

  const active = teacher ? isFavorite('teacher', teacher.id) : false

  if (loading) {
    return (
      <div dir={dir}>
        <DashboardNavbar />
        <div className="max-w-container mx-auto px-5 mt-[110px] max-md:mt-6 pb-16">
          <LoadingGrid count={3} className="grid-cols-3 max-md:grid-cols-2 max-[520px]:grid-cols-1" />
        </div>
      </div>
    )
  }

  if (error || !teacher) {
    return (
      <div dir={dir}>
        <DashboardNavbar />
        <div className="max-w-container mx-auto px-5 mt-[110px] max-md:mt-6 pb-16">
          <EmptyState icon={<Icon name="warning" />} title={t('err-generic')} description={error || 'Teacher not found.'}
            action={<button onClick={() => navigate('/teachers')} className="px-5 py-2.5 rounded-pill bg-primary text-white font-semibold hover:bg-primary-strong transition-colors">{t('back')}</button>} />
        </div>
      </div>
    )
  }

  return (
    <div dir={dir}>
      <DashboardNavbar />
      <div className="max-w-container mx-auto px-5 mt-[110px] max-md:mt-6 pb-16">
        <PageHeader title={teacher.name} back="/teachers" />

        <div className="flex items-start gap-4 mb-8 flex-wrap">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-primary-soft dark:bg-primary/15 flex items-center justify-center text-2xl font-heading font-bold text-primary-strong shrink-0">
            {teacher.photoURL ? <img src={teacher.photoURL} alt="" className="w-full h-full object-cover" /> : (teacher.name || '?').trim().charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-[200px]">
            {teacher.specialization && <p className="text-sm text-ink-muted mb-1">{teacher.specialization}</p>}
            {teacher.bio && <p className="text-sm text-ink-muted max-w-xl">{teacher.bio}</p>}
            <button
              onClick={() => toggleFavorite({ type: 'teacher', contentId: teacher.id, title: teacher.name, photoURL: teacher.photoURL, specialization: teacher.specialization })}
              className={`mt-3 px-4 py-1.5 rounded-pill text-xs font-semibold transition-colors ${active ? 'bg-primary text-white' : 'border border-border-card text-ink hover:border-primary/50'}`}
            >
              {active ? t('following') : t('follow')}
            </button>
          </div>
        </div>

        <h3 className="text-lg font-heading font-bold text-ink mb-4">{t('video-courses')}</h3>
        {courses.length === 0 ? (
          <EmptyState icon={<Icon name="video" />} title={t('no-content-title')} description={t('no-content-desc')} />
        ) : (
          <div className="stagger-children grid grid-cols-3 gap-4 max-md:grid-cols-2 max-[520px]:grid-cols-1">
            {courses.map((c) => (
              <button key={c.id} onClick={() => navigate(`/courses/${c.id}`)}
                className="text-start flex flex-col bg-surface border border-border-soft rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(0,0,0,0.08)] transition">
                <div className="h-32 bg-gradient-to-br from-primary via-primary-strong to-primary-deep flex items-center justify-center text-white/90">
                  {c.coverURL ? <img src={c.coverURL} alt="" className="w-full h-full object-cover" loading="lazy" /> : <Icon name="video" className="w-8 h-8" />}
                </div>
                <div className="p-4">
                  <h4 className="font-heading font-bold text-ink line-clamp-2 mb-2">{c.title}</h4>
                  {c.description && <p className="text-xs text-ink-muted line-clamp-2">{c.description}</p>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
