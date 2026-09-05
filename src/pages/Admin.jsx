import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import { api, API_BASE_URL } from '../lib/api.js'

const emptyQuestion = () => ({ question: '', options: ['', '', '', ''], correctAnswer: '' })
const emptyFlash = () => ({ question: '', answer: '' })
const emptyCourse = () => ({
  teacherFirstName: '', teacherLastName: '', teacherEmail: '',
  title: '', subject: '', bacStream: '', priceDa: '', description: ''
})
const bacStreams = [
  'شعبة علوم تجريبية', 'شعبة رياضيات', 'شعبة تسيير و اقتصاد',
  'شعبة اداب و فلسفة', 'شعبة لغات اجنبية', 'شعبة هندسة ميكانيكية',
  'شعبة هندسة كهربائية', 'شعبة هندسة مدنية'
]

const statusPill = {
  draft: { label: 'Draft', cls: 'bg-[#f1f5f9] text-[#555]' },
  pending: { label: 'Pending review', cls: 'bg-[#fbf0de] text-[#93630f]' },
  published: { label: 'Published', cls: 'bg-[#e7f5ec] text-[#1e7b48]' }
}
function courseStatus(c) {
  if (c.pending_status === 'pending') return 'pending'
  return c.status
}

function CoursesPanel() {
  const [courses, setCourses] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [editId, setEditId] = useState(null)

  async function load() {
    setLoading(true)
    try {
      const data = await api.consoleCourses()
      setCourses(data.courses)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = filter === 'all' ? courses : courses.filter((c) => courseStatus(c) === filter)

  async function findApprovalId(courseId) {
    const { approvals } = await api.consoleApprovals()
    return approvals.find((a) => a.entity_id === courseId)?.id
  }

  async function approve(course) {
    setBusyId(course.id)
    try {
      const approvalId = await findApprovalId(course.id)
      if (approvalId) await api.consoleApprove(approvalId)
      await load()
    } catch (e) {
      alert('Could not approve: ' + e.message)
    } finally {
      setBusyId(null)
    }
  }

  async function reject(course) {
    const reason = prompt('Reason for rejecting (shown to the teacher):') || ''
    setBusyId(course.id)
    try {
      const approvalId = await findApprovalId(course.id)
      if (approvalId) await api.consoleReject(approvalId, reason)
      await load()
    } catch (e) {
      alert('Could not reject: ' + e.message)
    } finally {
      setBusyId(null)
    }
  }

  async function togglePublish(course) {
    setBusyId(course.id)
    try {
      if (course.status === 'published') await api.consoleUnpublishCourse(course.id)
      else await api.consolePublishCourse(course.id)
      await load()
    } catch (e) {
      alert('Could not update status: ' + e.message)
    } finally {
      setBusyId(null)
    }
  }

  if (editId) {
    return <CourseEditPanel courseId={editId} onBack={() => { setEditId(null); load() }} />
  }

  return (
    <section className="bg-white p-10 rounded-[24px] shadow-[0_10px_30px_rgba(0,0,0,0.05)] mb-[30px] fade-in-anim max-[850px]:p-5 max-[850px]:rounded-xl">
      <h2>Courses</h2>
      <p className="text-sm text-[#999] mb-6">Every course on the platform, across every teacher.</p>

      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', 'draft', 'pending', 'published'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`h-10 px-5 rounded-[15px] cursor-pointer text-sm capitalize border-0 transition ${
              filter === f ? 'bg-[#fff0f0] text-primary-strong' : 'bg-[#f1f5f9] text-[#555]'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading && <p className="text-[#999]">Loading...</p>}
      {error && <p className="text-primary-strong">{error}</p>}
      {!loading && filtered.length === 0 && (
        <div className="border border-dashed border-[#eee] rounded-[20px] p-16 text-center text-[#999]">No courses match this filter.</div>
      )}

      <div className="flex flex-col gap-3">
        {filtered.map((c) => {
          const status = statusPill[courseStatus(c)] || statusPill.draft
          const isBusy = busyId === c.id
          return (
            <div key={c.id} className="border border-[#eee] rounded-2xl p-5 flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full mb-1.5 ${status.cls}`}>{status.label}</span>
                <button onClick={() => setEditId(c.id)} className="block font-bold text-lg text-[#2D2D2D] bg-transparent border-0 p-0 cursor-pointer text-left hover:text-primary-strong">
                  {c.title}
                </button>
                <p className="text-sm text-[#999] mt-0.5">{c.teacher_name} · {c.subject} · {c.lesson_count} lesson{c.lesson_count === 1 ? '' : 's'} · {c.price_da} DA</p>
              </div>
              <div className="flex items-center gap-2">
                {courseStatus(c) === 'pending' && (
                  <>
                    <button disabled={isBusy} onClick={() => approve(c)} className="text-sm font-medium bg-[#e7f5ec] text-[#1e7b48] px-4 py-2 rounded-pill border-0 cursor-pointer disabled:opacity-50">Approve</button>
                    <button disabled={isBusy} onClick={() => reject(c)} className="text-sm font-medium bg-primary-soft text-primary-strong px-4 py-2 rounded-pill border-0 cursor-pointer disabled:opacity-50">Reject</button>
                  </>
                )}
                {courseStatus(c) !== 'pending' && (
                  <button disabled={isBusy} onClick={() => togglePublish(c)} className="text-sm font-medium bg-[#f1f5f9] text-[#333] px-4 py-2 rounded-pill border-0 cursor-pointer disabled:opacity-50">
                    {c.status === 'published' ? 'Unpublish' : 'Publish'}
                  </button>
                )}
                <button onClick={() => setEditId(c.id)} className="text-sm font-medium text-[#999] bg-transparent border-0 cursor-pointer px-2 py-2">Edit</button>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function CourseEditPanel({ courseId, onBack }) {
  const [teachers, setTeachers] = useState([])
  const [form, setForm] = useState({ title: '', subject: '', bacStream: bacStreams[0], priceDa: 0, description: '', teacherId: '' })
  const [status, setStatus] = useState('draft')
  const [coverKey, setCoverKey] = useState(null)
  const [lessons, setLessons] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => { api.consoleTeachers().then((data) => setTeachers(data.teachers)) }, [])

  async function refresh() {
    const data = await api.consoleCourse(courseId)
    setForm({
      title: data.course.title, subject: data.course.subject, bacStream: data.course.bac_stream,
      priceDa: data.course.price_da, description: data.course.description || '', teacherId: data.course.teacher_id
    })
    setStatus(data.course.status)
    setCoverKey(data.course.cover_key)
    setLessons(data.lessons)
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId])

  function update(field, value) { setForm((f) => ({ ...f, [field]: value })) }

  async function onSave(e) {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      await api.consoleUpdateCourse(courseId, form)
      setMessage('Saved.')
    } catch (err) {
      setMessage(err.data?.error === 'teacher_not_found' ? 'Pick a valid teacher.' : 'Could not save — check the required fields.')
    } finally {
      setSaving(false)
    }
  }

  async function togglePublish() {
    setSaving(true)
    try {
      if (status === 'published') { await api.consoleUnpublishCourse(courseId); setStatus('draft') }
      else { await api.consolePublishCourse(courseId); setStatus('published') }
    } catch {
      setMessage('Could not change publish status.')
    } finally {
      setSaving(false)
    }
  }

  async function onCoverChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setSaving(true)
    try {
      await api.consoleUploadCover(courseId, file)
      await refresh()
    } catch {
      setMessage('Could not upload the cover image.')
    } finally {
      setSaving(false)
    }
  }

  async function onAddLesson(e) {
    e.preventDefault()
    const formEl = e.target
    const title = formEl.title.value.trim()
    const video = formEl.video.files[0]
    const isFreePreview = formEl.isFreePreview.checked
    if (!title || !video) return
    setSaving(true)
    setMessage('')
    try {
      await api.consoleAddLesson(courseId, { title, isFreePreview, video })
      formEl.reset()
      await refresh()
    } catch {
      setMessage('Could not upload that lesson.')
    } finally {
      setSaving(false)
    }
  }

  async function moveLesson(lesson, direction) {
    const idx = lessons.findIndex((l) => l.id === lesson.id)
    const swapWith = lessons[idx + direction]
    if (!swapWith) return
    await Promise.all([
      api.consoleUpdateLesson(lesson.id, { position: swapWith.position }),
      api.consoleUpdateLesson(swapWith.id, { position: lesson.position })
    ])
    await refresh()
  }

  async function removeLesson(lessonId) {
    if (!confirm('Delete this lesson?')) return
    await api.consoleDeleteLesson(lessonId)
    await refresh()
  }

  return (
    <section className="bg-white p-10 rounded-[24px] shadow-[0_10px_30px_rgba(0,0,0,0.05)] mb-[30px] fade-in-anim max-[850px]:p-5 max-[850px]:rounded-xl">
      <button onClick={onBack} className="text-sm text-[#999] bg-transparent border-0 cursor-pointer p-0 mb-2 hover:text-primary-strong">← All courses</button>
      <div className="flex items-center gap-3 mt-1 mb-6">
        <h2 className="m-0">{loading ? 'Loading...' : form.title}</h2>
        {!loading && (
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${status === 'published' ? 'bg-[#e7f5ec] text-[#1e7b48]' : 'bg-[#f1f5f9] text-[#555]'}`}>
            {status === 'published' ? 'Published' : 'Draft'}
          </span>
        )}
      </div>

      {!loading && (
        <>
          <form onSubmit={onSave} className="border border-[#eee] rounded-[20px] p-6 flex flex-col gap-4 mb-6">
            <h3 className="text-sm font-bold text-[#333] uppercase tracking-wide -mb-1">Course details</h3>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-[#555]">Teacher</span>
              <select required value={form.teacherId} onChange={(e) => update('teacherId', e.target.value)}
                className="w-full p-3.5 border-2 border-[#f0f0f0] rounded-xl text-[15px] outline-none focus:border-primary-strong">
                {teachers.map((t) => <option key={t.id} value={t.id}>{t.display_name} — {t.email}</option>)}
              </select>
            </label>
            <input required placeholder="Course title" value={form.title} onChange={(e) => update('title', e.target.value)}
              className="w-full p-3.5 border-2 border-[#f0f0f0] rounded-xl text-[15px] outline-none focus:border-primary-strong" />
            <div className="grid grid-cols-2 gap-4 max-[600px]:grid-cols-1">
              <input required placeholder="Subject" value={form.subject} onChange={(e) => update('subject', e.target.value)}
                className="w-full p-3.5 border-2 border-[#f0f0f0] rounded-xl text-[15px] outline-none focus:border-primary-strong" />
              <select value={form.bacStream} onChange={(e) => update('bacStream', e.target.value)}
                className="w-full p-3.5 border-2 border-[#f0f0f0] rounded-xl text-[15px] outline-none">
                {bacStreams.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <input required type="number" min="0" placeholder="Price (DA)" value={form.priceDa}
              onChange={(e) => update('priceDa', Number(e.target.value))}
              className="w-full p-3.5 border-2 border-[#f0f0f0] rounded-xl text-[15px] outline-none focus:border-primary-strong" />
            <textarea placeholder="Description" value={form.description} onChange={(e) => update('description', e.target.value)}
              className="w-full p-3.5 border-2 border-[#f0f0f0] rounded-xl text-[15px] outline-none focus:border-primary-strong" rows={3} />
            <div className="flex gap-3 flex-wrap">
              <button type="submit" disabled={saving}
                className="bg-primary-strong text-white border-0 px-6 py-3 rounded-[14px] font-bold cursor-pointer hover:bg-[#9a1418] disabled:opacity-60">
                Save changes
              </button>
              <button type="button" onClick={togglePublish} disabled={saving}
                className="bg-[#f1f5f9] text-[#333] px-6 py-3 rounded-[14px] font-semibold border-0 cursor-pointer disabled:opacity-60">
                {status === 'published' ? 'Unpublish' : 'Publish now'}
              </button>
            </div>
          </form>

          <div className="border border-[#eee] rounded-[20px] p-6 flex flex-col gap-5 mb-6">
            <h3 className="text-sm font-bold text-[#333] uppercase tracking-wide -mb-1">Cover image</h3>
            <div className="flex items-center gap-4">
              {coverKey ? (
                <img src={`${API_BASE_URL}/v1/courses/${courseId}/cover`} alt="" className="w-28 h-20 object-cover rounded-xl border border-[#eee]" />
              ) : (
                <div className="w-28 h-20 rounded-xl bg-[#f2f3ff] flex items-center justify-center text-2xl">🎥</div>
              )}
              <input type="file" accept="image/*" onChange={onCoverChange} className="text-sm" />
            </div>
          </div>

          <div className="border border-[#eee] rounded-[20px] p-6 flex flex-col gap-5">
            <h3 className="text-sm font-bold text-[#333] uppercase tracking-wide -mb-1">Lessons</h3>
            {lessons.length === 0 && <p className="text-[#999] text-sm">No lessons yet — add the first video below.</p>}
            <div className="flex flex-col gap-2.5">
              {lessons.map((l, i) => (
                <div key={l.id} className="flex items-center justify-between border border-[#eee] rounded-xl p-3.5">
                  <div>
                    <p className="font-medium">{i + 1}. {l.title}</p>
                    {l.is_free_preview === 1 && <span className="text-xs text-primary-strong bg-[#fff0f0] px-2 py-0.5 rounded-full">Free preview</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => moveLesson(l, -1)} disabled={i === 0} className="bg-transparent border-0 cursor-pointer disabled:opacity-30">↑</button>
                    <button type="button" onClick={() => moveLesson(l, 1)} disabled={i === lessons.length - 1} className="bg-transparent border-0 cursor-pointer disabled:opacity-30">↓</button>
                    <button type="button" onClick={() => removeLesson(l.id)} className="text-primary-strong bg-transparent border-0 cursor-pointer">✕</button>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={onAddLesson} className="flex flex-col gap-3 border-t border-[#eee] pt-5">
              <input name="title" required placeholder="Lesson title"
                className="w-full p-3 border-2 border-[#f0f0f0] rounded-xl text-[15px] outline-none focus:border-primary-strong" />
              <input name="video" required type="file" accept="video/*" className="text-sm" />
              <label className="flex items-center gap-2 text-sm text-[#999]">
                <input name="isFreePreview" type="checkbox" /> Make this lesson a free preview
              </label>
              <button type="submit" disabled={saving}
                className="self-start bg-[#f1f5f9] text-[#333] px-5 py-2.5 rounded-[10px] font-semibold border-0 cursor-pointer disabled:opacity-60">
                {saving ? 'Uploading...' : '+ Add lesson'}
              </button>
            </form>
          </div>
        </>
      )}

      {message && <p className="text-sm text-[#999] mt-4">{message}</p>}
    </section>
  )
}

function UsersPanel() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.consoleUserStats().then(setStats).catch((e) => setError(e.message))
  }, [])

  const cards = stats && [
    { label: 'Total users', value: stats.total },
    { label: 'Students', value: stats.students },
    { label: 'Teachers', value: stats.teachers },
    { label: 'Staff', value: stats.staff },
    { label: 'Suspended', value: stats.suspended },
    { label: 'New (last 7 days)', value: stats.newLast7Days },
    { label: 'New (last 30 days)', value: stats.newLast30Days }
  ]

  return (
    <section className="bg-white p-10 rounded-[24px] shadow-[0_10px_30px_rgba(0,0,0,0.05)] mb-[30px] fade-in-anim max-[850px]:p-5 max-[850px]:rounded-xl">
      <h2>Users</h2>
      <p className="text-sm text-[#999] mb-6">Account counts across the whole platform.</p>

      {error && <p className="text-primary-strong">{error}</p>}
      {!stats && !error && <p className="text-[#999]">Loading...</p>}

      {cards && (
        <div className="grid grid-cols-4 gap-4 max-[850px]:grid-cols-2 max-[500px]:grid-cols-1">
          {cards.map((card) => (
            <div key={card.label} className="border border-[#eee] rounded-2xl p-6 text-center">
              <p className="text-3xl font-bold text-primary-strong">{card.value}</p>
              <p className="text-sm text-[#999] mt-1.5">{card.label}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function TeachersPanel() {
  const emptyTeacherForm = { firstName: '', lastName: '', email: '', password: '', headline: '', subjects: '' }
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState(emptyTeacherForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [busyId, setBusyId] = useState(null)

  async function load() {
    setLoading(true)
    try {
      const data = await api.consoleTeachers()
      setTeachers(data.teachers)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function update(field, value) { setForm((f) => ({ ...f, [field]: value })) }

  async function createTeacher(e) {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      await api.consoleCreateTeacher(form)
      setForm(emptyTeacherForm)
      setFormOpen(false)
      await load()
    } catch (err) {
      setFormError(err.data?.error === 'email_taken' ? 'That email is already registered.' : 'Could not create the teacher account.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleVerified(t) {
    setBusyId(t.id)
    try {
      await api.consoleUpdateTeacher(t.id, { verified: !t.verified })
      await load()
    } catch {
      alert('Could not update verification status.')
    } finally {
      setBusyId(null)
    }
  }

  async function onAvatarChange(t, e) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusyId(t.id)
    try {
      await api.consoleUploadTeacherAvatar(t.id, file)
      await load()
    } catch {
      alert('Could not upload the photo.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section className="bg-white p-10 rounded-[24px] shadow-[0_10px_30px_rgba(0,0,0,0.05)] mb-[30px] fade-in-anim max-[850px]:p-5 max-[850px]:rounded-xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h2 className="m-0">Teachers</h2>
          <p className="text-sm text-[#999] mt-1">Everyone with a teacher account, and their published courses.</p>
        </div>
        <button onClick={() => setFormOpen((o) => !o)} className="bg-primary-strong text-white rounded-pill font-medium px-6 py-3 border-0 cursor-pointer hover:bg-[#9a1418]">
          {formOpen ? 'Cancel' : '+ New teacher'}
        </button>
      </div>

      {formOpen && (
        <form onSubmit={createTeacher} className="border border-[#eee] rounded-[20px] p-6 mb-6 grid grid-cols-2 gap-4 max-[600px]:grid-cols-1">
          <input required placeholder="First name" value={form.firstName} onChange={(e) => update('firstName', e.target.value)}
            className="p-3.5 border-2 border-[#f0f0f0] rounded-xl text-[15px] outline-none focus:border-primary-strong" />
          <input required placeholder="Last name" value={form.lastName} onChange={(e) => update('lastName', e.target.value)}
            className="p-3.5 border-2 border-[#f0f0f0] rounded-xl text-[15px] outline-none focus:border-primary-strong" />
          <input required type="email" placeholder="Email" value={form.email} onChange={(e) => update('email', e.target.value)}
            className="p-3.5 border-2 border-[#f0f0f0] rounded-xl text-[15px] outline-none focus:border-primary-strong" />
          <input required type="password" minLength={8} placeholder="Temporary password (min. 8 chars)" value={form.password} onChange={(e) => update('password', e.target.value)}
            className="p-3.5 border-2 border-[#f0f0f0] rounded-xl text-[15px] outline-none focus:border-primary-strong" />
          <input placeholder="Headline (e.g. Physics teacher, Algiers)" value={form.headline} onChange={(e) => update('headline', e.target.value)}
            className="p-3.5 border-2 border-[#f0f0f0] rounded-xl text-[15px] outline-none focus:border-primary-strong col-span-2" />
          <input placeholder="Subjects (comma separated)" value={form.subjects} onChange={(e) => update('subjects', e.target.value)}
            className="p-3.5 border-2 border-[#f0f0f0] rounded-xl text-[15px] outline-none focus:border-primary-strong col-span-2" />
          {formError && <p className="col-span-2 text-primary-strong text-sm">{formError}</p>}
          <button type="submit" disabled={saving} className="col-span-2 bg-primary-strong text-white border-0 p-3.5 rounded-[14px] font-bold cursor-pointer hover:bg-[#9a1418] disabled:opacity-60">
            {saving ? 'Creating...' : 'Create teacher account'}
          </button>
        </form>
      )}

      {loading && <p className="text-[#999]">Loading...</p>}
      {error && <p className="text-primary-strong">{error}</p>}
      {!loading && teachers.length === 0 && (
        <div className="border border-dashed border-[#eee] rounded-[20px] p-16 text-center text-[#999]">No teacher accounts yet.</div>
      )}

      <div className="flex flex-col gap-3">
        {teachers.map((t) => (
          <div key={t.id} className="border border-[#eee] rounded-2xl p-5 flex items-center gap-4 flex-wrap">
            <div className="w-12 h-12 rounded-full bg-[#f2f3ff] flex items-center justify-center font-bold text-primary-strong shrink-0 relative overflow-hidden">
              <span>{t.display_name?.charAt(0) || '?'}</span>
              {t.avatar_key && (
                <img
                  src={`${API_BASE_URL}/v1/teachers/${t.id}/avatar`}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
              )}
            </div>
            <div className="flex-1 min-w-[220px]">
              <p className="font-bold text-lg">{t.display_name}</p>
              <p className="text-sm text-[#999]">{t.email}{t.headline ? ` · ${t.headline}` : ''}</p>
              <p className="text-sm text-[#999] mt-0.5">{t.course_count} course{t.course_count === 1 ? '' : 's'} · {t.published_count} published</p>
              <label className="text-xs text-primary-strong cursor-pointer mt-1 inline-block">
                {busyId === t.id ? 'Uploading...' : 'Change photo'}
                <input type="file" accept="image/*" onChange={(e) => onAvatarChange(t, e)} disabled={busyId === t.id} className="hidden" />
              </label>
            </div>
            <button
              disabled={busyId === t.id}
              onClick={() => toggleVerified(t)}
              className={`text-sm font-medium px-4 py-2 rounded-pill border-0 cursor-pointer disabled:opacity-50 ${t.verified ? 'bg-[#e7f5ec] text-[#1e7b48]' : 'bg-[#f1f5f9] text-[#555]'}`}
            >
              {t.verified ? '✓ Verified' : 'Mark verified'}
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}

export default function Admin() {
  const navigate = useNavigate()
  const { user, loading: authLoading, login } = useAuth()
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [loginError, setLoginError] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)

  const [tab, setTab] = useState('add-quiz')
  const [toast, setToast] = useState('')

  // Quiz form
  const [qSubject, setQSubject] = useState('')
  const [questions, setQuestions] = useState([emptyQuestion()])

  // Flashcard form
  const [fSubject, setFSubject] = useState('')
  const [flashcards, setFlashcards] = useState([emptyFlash()])

  // Resource form
  const [resForm, setResForm] = useState({ subject: '', title: '', type: 'drive', url: '', coverUrl: '' })
  const [coverFile, setCoverFile] = useState(null)
  const [coverPreview, setCoverPreview] = useState('')
  const [coverUploading, setCoverUploading] = useState(false)

  // Course form (teacher + course + first lesson, all in one)
  const [courseForm, setCourseForm] = useState(emptyCourse)
  const [publishNow, setPublishNow] = useState(true)
  const [courseSaving, setCourseSaving] = useState(false)
  const [courseMessage, setCourseMessage] = useState('')

  // Edit state
  const [editing, setEditing] = useState({ id: null, type: null })

  // Data list
  const [dataList, setDataList] = useState({ col: null, items: [], loading: false, error: '' })

  async function handleLogin(e) {
    e.preventDefault()
    setLoginError('')
    setLoggingIn(true)
    try {
      const loggedInUser = await login(loginForm.email, loginForm.password)
      if (loggedInUser.role !== 'staff') {
        setLoginError('That account does not have staff access.')
      }
    } catch (err) {
      setLoginError(err.data?.error === 'account_suspended' ? 'Account suspended.' : 'Incorrect email or password.')
    } finally {
      setLoggingIn(false)
    }
  }

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  function resetEdit() {
    setEditing({ id: null, type: null })
  }

  async function saveQuiz(e) {
    e.preventDefault()
    const data = {
      subject: qSubject,
      title: qSubject + ' Quiz',
      questions: questions.map((q) => ({
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer
      })),
      isMulti: true
    }
    try {
      if (editing.type === 'quizzes' && editing.id) {
        await updateDoc(doc(db, 'quizzes', editing.id), data)
        showToast('Quiz Updated!')
      } else {
        await addDoc(collection(db, 'quizzes'), data)
        showToast('Quiz saved!')
      }
      setQSubject('')
      setQuestions([emptyQuestion()])
      if (editing.type === 'quizzes') {
        await fetchList('quizzes')
        resetEdit()
      }
    } catch (err) { alert('Error: ' + err.message) }
  }

  async function saveFlashcards(e) {
    e.preventDefault()
    try {
      if (editing.type === 'flashcards' && editing.id) {
        const data = { subject: fSubject, question: flashcards[0].question, answer: flashcards[0].answer }
        await updateDoc(doc(db, 'flashcards', editing.id), data)
        showToast('Flashcard Updated!')
      } else {
        for (const fc of flashcards) {
          await addDoc(collection(db, 'flashcards'), { subject: fSubject, question: fc.question, answer: fc.answer })
        }
        showToast(`Saved ${flashcards.length} Flashcards!`)
      }
      setFSubject('')
      setFlashcards([emptyFlash()])
      if (editing.type === 'flashcards') {
        await fetchList('flashcards')
        resetEdit()
      }
    } catch (err) { alert('Error: ' + err.message) }
  }

  function pickCoverFile(file) {
    if (!file) return
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  function removeCover() {
    setCoverFile(null)
    setCoverPreview('')
    setResForm((f) => ({ ...f, coverUrl: '' }))
  }

  async function saveResource(e) {
    e.preventDefault()
    if (!resForm.url.startsWith('http')) return alert('Please enter a valid URL')
    try {
      let coverUrl = resForm.coverUrl
      if (coverFile) {
        setCoverUploading(true)
        const ext = coverFile.name.split('.').pop()
        const path = `resource-covers/${crypto.randomUUID()}.${ext}`
        const fileRef = ref(storage, path)
        await uploadBytes(fileRef, coverFile)
        coverUrl = await getDownloadURL(fileRef)
        setCoverUploading(false)
      }
      const data = { ...resForm, coverUrl }

      if (editing.type === 'resources' && editing.id) {
        await updateDoc(doc(db, 'resources', editing.id), data)
        showToast('Resource Updated!')
      } else {
        await addDoc(collection(db, 'resources'), data)
        showToast('Resource Saved!')
      }
      setResForm({ subject: '', title: '', type: 'drive', url: '', coverUrl: '' })
      setCoverFile(null)
      setCoverPreview('')
      if (editing.type === 'resources') {
        await fetchList('resources')
        resetEdit()
      }
    } catch (err) {
      setCoverUploading(false)
      alert('Error: ' + err.message)
    }
  }

  async function saveCourse(e) {
    e.preventDefault()
    const lessonTitle = e.target.lessonTitle.value.trim()
    const lessonVideo = e.target.lessonVideo.files[0]
    const lessonFreePreview = e.target.lessonFreePreview.checked
    const teacherAvatar = e.target.teacherAvatar.files[0]
    const courseCover = e.target.courseCover.files[0]

    setCourseSaving(true)
    setCourseMessage('')
    try {
      const { id, teacherId } = await api.consoleCreateCourseWithTeacher({
        teacherFirstName: courseForm.teacherFirstName,
        teacherLastName: courseForm.teacherLastName,
        teacherEmail: courseForm.teacherEmail,
        title: courseForm.title,
        subject: courseForm.subject,
        bacStream: courseForm.bacStream,
        priceDa: Number(courseForm.priceDa) || 0,
        description: courseForm.description
      })

      if (teacherAvatar) {
        await api.consoleUploadTeacherAvatar(teacherId, teacherAvatar)
      }
      if (courseCover) {
        await api.consoleUploadCover(id, courseCover)
      }
      if (lessonVideo) {
        await api.consoleAddLesson(id, { title: lessonTitle, isFreePreview: lessonFreePreview, video: lessonVideo })
      }
      if (publishNow) {
        await api.consolePublishCourse(id)
      }

      showToast('Course saved!')
      setCourseForm(emptyCourse())
      e.target.reset()
    } catch (err) {
      setCourseMessage(
        err.data?.error === 'email_belongs_to_non_teacher'
          ? 'That email already belongs to a non-teacher account — use a different email.'
          : 'Could not save — check the required fields.'
      )
    } finally {
      setCourseSaving(false)
    }
  }

  async function fetchList(col) {
    setDataList({ col, items: [], loading: true, error: '' })
    try {
      const snap = await getDocs(collection(db, col))
      const items = []
      snap.forEach((d) => items.push({ id: d.id, ...d.data() }))
      setDataList({ col, items, loading: false, error: '' })
    } catch (err) {
      setDataList({ col, items: [], loading: false, error: 'Error loading data.' })
    }
  }

  async function deleteItem(col, id) {
    if (!confirm('Are you sure?')) return
    try {
      await deleteDoc(doc(db, col, id))
      showToast('Deleted Successfully!')
      await fetchList(col)
      if (editing.id === id) resetEdit()
    } catch (err) { alert('Error: ' + err.message) }
  }

  function startEdit(col, item) {
    resetEdit()
    setEditing({ id: item.id, type: col })
    if (col === 'quizzes') {
      setTab('add-quiz')
      setQSubject(item.subject || '')
      setQuestions((item.questions || []).map((q) => ({
        question: q.question || '',
        options: [q.options?.[0] || '', q.options?.[1] || '', q.options?.[2] || '', q.options?.[3] || ''],
        correctAnswer: q.correctAnswer || ''
      })))
    } else if (col === 'flashcards') {
      setTab('add-flash')
      setFSubject(item.subject || '')
      setFlashcards([{ question: item.question || '', answer: item.answer || '' }])
    } else if (col === 'resources') {
      setTab('add-resource')
      setResForm({ subject: item.subject || '', title: item.title || '', type: item.type || 'drive', url: item.url || '', coverUrl: item.coverUrl || '' })
      setCoverFile(null)
      setCoverPreview(item.coverUrl || '')
    }
  }

  if (authLoading) {
    return <div className="fixed inset-0 bg-white z-[9999] flex items-center justify-center text-[#999]" style={{ fontFamily: 'Outfit, sans-serif' }}>Loading...</div>
  }

  if (!user || user.role !== 'staff') {
    return (
      <div className="fixed inset-0 bg-white z-[9999] flex items-center justify-center flex-col" style={{ fontFamily: 'Outfit, sans-serif' }}>
        <form onSubmit={handleLogin} className="bg-white p-10 rounded-[24px] shadow-[0_10px_30px_rgba(0,0,0,0.05)] text-center w-80">
          <img src="/assets/images/logo.svg" alt="logo" className="h-10 mb-5 mx-auto" />
          <h2>Admin Login</h2>
          <input
            type="email"
            required
            value={loginForm.email}
            onChange={(e) => setLoginForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="Staff email"
            className="w-full p-[15px] mt-5 border-2 border-[#eee] rounded-xl text-base box-border"
          />
          <input
            type="password"
            required
            value={loginForm.password}
            onChange={(e) => setLoginForm((f) => ({ ...f, password: e.target.value }))}
            placeholder="Password"
            className="w-full p-[15px] my-3 border-2 border-[#eee] rounded-xl text-base box-border"
          />
          {loginError && <p className="text-primary-strong text-sm mb-3">{loginError}</p>}
          <button type="submit" disabled={loggingIn} className="bg-primary-strong text-white border-0 p-4 rounded-[14px] font-bold cursor-pointer w-full hover:bg-[#9a1418] hover:-translate-y-0.5 disabled:opacity-60">
            {loggingIn ? 'Signing in...' : 'Access Portal'}
          </button>
        </form>
      </div>
    )
  }

  const navBtnBase = 'bg-transparent border-0 py-[15px] px-5 text-left rounded-[15px] cursor-pointer font-medium text-[#666] w-full hover:bg-[#fdfdfd] hover:text-primary-strong'

  return (
    <div className="grid grid-cols-[280px_1fr] min-h-screen bg-[#f8f9fa] max-[850px]:block" style={{ fontFamily: 'Outfit, sans-serif', color: '#2D2D2D' }}>
      <aside className="bg-white p-[40px_20px] border-r border-[#eee] flex flex-col gap-4 max-[850px]:p-[15px] max-[850px]:flex-row max-[850px]:overflow-x-auto max-[850px]:whitespace-nowrap max-[850px]:gap-2.5 max-[850px]:border-r-0 max-[850px]:border-b max-[850px]:sticky max-[850px]:top-0 max-[850px]:z-[100]">
        <div className="px-5 mb-[30px] max-[850px]:hidden">
          <img src="/assets/images/logo.svg" alt="logo" className="h-[35px]" />
          <p className="text-[#999] text-xs mt-[5px]">EzBac CMS v2.0</p>
        </div>
        {[
          { id: 'add-course', label: '➕ Add Course' },
          { id: 'courses', label: '📚 Courses' },
          { id: 'teachers', label: '👩‍🏫 Teachers' },
          { id: 'users', label: '👥 Users' },
          { id: 'add-quiz', label: '➕ Add Quiz' },
          { id: 'add-flash', label: '➕ Add Flashcard' },
          { id: 'add-resource', label: '➕ Add Resource' },
          { id: 'view-data', label: '📋 View Data' }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`${navBtnBase} ${tab === t.id ? 'bg-[#fff0f0] text-primary-strong' : ''} max-[850px]:py-2.5 max-[850px]:px-[15px] max-[850px]:w-auto max-[850px]:whitespace-nowrap`}
          >
            {t.label}
          </button>
        ))}
        <hr className="w-full border-0 border-t border-[#eee] my-5 max-[850px]:hidden" />
        <button onClick={() => navigate('/courses')} className={`${navBtnBase} max-[850px]:py-2.5 max-[850px]:px-[15px] max-[850px]:w-auto max-[850px]:whitespace-nowrap`}>
          ⬅ Exit Admin
        </button>
      </aside>

      <main className="p-10 max-w-[1000px] mx-auto w-full max-[850px]:p-[15px]">
        {tab === 'add-course' && (
          <section className="bg-white p-10 rounded-[24px] shadow-[0_10px_30px_rgba(0,0,0,0.05)] mb-[30px] fade-in-anim max-[850px]:p-5 max-[850px]:rounded-xl">
            <h2>Add Course</h2>
            <p className="text-sm text-[#999] mb-6">Enter the teacher's details and the first lesson's video together — if the email matches an existing teacher, their record is reused instead of creating a duplicate.</p>
            <form onSubmit={saveCourse}>
              <h3 className="text-sm font-bold text-[#333] mb-4 uppercase tracking-wide">Teacher</h3>
              <div className="grid grid-cols-2 gap-2.5 max-[600px]:grid-cols-1">
                <div className="mb-6">
                  <label className="block mb-2.5 font-semibold text-sm text-[#555]">First name</label>
                  <input required value={courseForm.teacherFirstName} onChange={(e) => setCourseForm((f) => ({ ...f, teacherFirstName: e.target.value }))} className="w-full p-3.5 border-2 border-[#f0f0f0] rounded-xl text-[15px] box-border focus:border-primary-strong focus:outline-none" />
                </div>
                <div className="mb-6">
                  <label className="block mb-2.5 font-semibold text-sm text-[#555]">Last name</label>
                  <input required value={courseForm.teacherLastName} onChange={(e) => setCourseForm((f) => ({ ...f, teacherLastName: e.target.value }))} className="w-full p-3.5 border-2 border-[#f0f0f0] rounded-xl text-[15px] box-border focus:border-primary-strong focus:outline-none" />
                </div>
              </div>
              <div className="mb-6">
                <label className="block mb-2.5 font-semibold text-sm text-[#555]">Teacher email</label>
                <input required type="email" value={courseForm.teacherEmail} onChange={(e) => setCourseForm((f) => ({ ...f, teacherEmail: e.target.value }))} placeholder="teacher@example.com" className="w-full p-3.5 border-2 border-[#f0f0f0] rounded-xl text-[15px] box-border focus:border-primary-strong focus:outline-none" />
              </div>
              <div className="mb-6">
                <label className="block mb-2.5 font-semibold text-sm text-[#555]">Teacher photo (optional)</label>
                <p className="text-xs text-[#999] mb-2.5">Only used if this email doesn't already belong to an existing teacher.</p>
                <input type="file" name="teacherAvatar" accept="image/*" className="w-full p-3 border-2 border-[#f0f0f0] rounded-xl text-sm box-border bg-white" />
              </div>

              <h3 className="text-sm font-bold text-[#333] mb-4 mt-8 uppercase tracking-wide">Course</h3>
              <div className="mb-6">
                <label className="block mb-2.5 font-semibold text-sm text-[#555]">Title</label>
                <input required value={courseForm.title} onChange={(e) => setCourseForm((f) => ({ ...f, title: e.target.value }))} className="w-full p-3.5 border-2 border-[#f0f0f0] rounded-xl text-[15px] box-border focus:border-primary-strong focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-2.5 max-[600px]:grid-cols-1">
                <div className="mb-6">
                  <label className="block mb-2.5 font-semibold text-sm text-[#555]">Subject</label>
                  <input required placeholder="e.g. Physics" value={courseForm.subject} onChange={(e) => setCourseForm((f) => ({ ...f, subject: e.target.value }))} className="w-full p-3.5 border-2 border-[#f0f0f0] rounded-xl text-[15px] box-border focus:border-primary-strong focus:outline-none" />
                </div>
                <div className="mb-6">
                  <label className="block mb-2.5 font-semibold text-sm text-[#555]">BAC stream</label>
                  <select required value={courseForm.bacStream} onChange={(e) => setCourseForm((f) => ({ ...f, bacStream: e.target.value }))} className="w-full p-3.5 border-2 border-[#f0f0f0] rounded-xl text-[15px] box-border">
                    <option value="" disabled>Select a stream</option>
                    {bacStreams.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="mb-6">
                <label className="block mb-2.5 font-semibold text-sm text-[#555]">Price (DA)</label>
                <input required type="number" min="0" value={courseForm.priceDa} onChange={(e) => setCourseForm((f) => ({ ...f, priceDa: e.target.value }))} className="w-full p-3.5 border-2 border-[#f0f0f0] rounded-xl text-[15px] box-border focus:border-primary-strong focus:outline-none" />
              </div>
              <div className="mb-6">
                <label className="block mb-2.5 font-semibold text-sm text-[#555]">Description</label>
                <textarea value={courseForm.description} onChange={(e) => setCourseForm((f) => ({ ...f, description: e.target.value }))} className="w-full p-3.5 border-2 border-[#f0f0f0] rounded-xl text-[15px] box-border" rows={3} />
              </div>
              <div className="mb-6">
                <label className="block mb-2.5 font-semibold text-sm text-[#555]">Cover image (optional)</label>
                <input type="file" name="courseCover" accept="image/*" className="w-full p-3 border-2 border-[#f0f0f0] rounded-xl text-sm box-border bg-white" />
              </div>

              <h3 className="text-sm font-bold text-[#333] mb-4 mt-8 uppercase tracking-wide">First lesson / video</h3>
              <div className="mb-6">
                <label className="block mb-2.5 font-semibold text-sm text-[#555]">Lesson title</label>
                <input required name="lessonTitle" placeholder="e.g. Introduction" className="w-full p-3.5 border-2 border-[#f0f0f0] rounded-xl text-[15px] box-border focus:border-primary-strong focus:outline-none" />
              </div>
              <div className="mb-6">
                <label className="block mb-2.5 font-semibold text-sm text-[#555]">Video file</label>
                <input required type="file" name="lessonVideo" accept="video/*" className="w-full p-3 border-2 border-[#f0f0f0] rounded-xl text-sm box-border bg-white" />
              </div>
              <label className="flex items-center gap-2.5 mb-6 text-sm text-[#555] font-semibold">
                <input type="checkbox" name="lessonFreePreview" />
                Make this lesson a free preview
              </label>
              <label className="flex items-center gap-2.5 mb-6 text-sm text-[#555] font-semibold">
                <input type="checkbox" checked={publishNow} onChange={(e) => setPublishNow(e.target.checked)} />
                Publish immediately (uncheck to save as a draft)
              </label>

              {courseMessage && <p className="text-primary-strong text-sm mb-4">{courseMessage}</p>}

              <button type="submit" disabled={courseSaving} className="bg-primary-strong text-white border-0 p-4 rounded-[14px] font-bold cursor-pointer w-full hover:bg-[#9a1418] hover:-translate-y-0.5 disabled:opacity-60">
                {courseSaving ? 'Saving...' : 'Save Course'}
              </button>
            </form>
          </section>
        )}

        {tab === 'courses' && <CoursesPanel />}

        {tab === 'teachers' && <TeachersPanel />}

        {tab === 'users' && <UsersPanel />}

        {tab === 'add-quiz' && (
          <section className="bg-white p-10 rounded-[24px] shadow-[0_10px_30px_rgba(0,0,0,0.05)] mb-[30px] fade-in-anim max-[850px]:p-5 max-[850px]:rounded-xl">
            <h2>Add New Quiz {editing.type === 'quizzes' && <span className="text-sm text-primary-strong font-normal ml-2.5">— Editing Mode</span>}</h2>
            <form onSubmit={saveQuiz}>
              <div className="mb-6">
                <label className="block mb-2.5 font-semibold text-sm text-[#555]">Subject</label>
                <input value={qSubject} onChange={(e) => setQSubject(e.target.value)} required placeholder="e.g. History, Math, SVT..." className="w-full p-3.5 border-2 border-[#f0f0f0] rounded-xl text-[15px] box-border focus:border-primary-strong focus:outline-none" />
              </div>

              {questions.map((q, i) => (
                <div key={i} className="border border-[#eee] p-5 rounded-xl mb-5">
                  <div className="mb-6">
                    <label className="block mb-2.5 font-semibold text-sm text-[#555]">Question {i + 1}</label>
                    <textarea required value={q.question} onChange={(e) => { const next = [...questions]; next[i].question = e.target.value; setQuestions(next) }} placeholder="Enter the question..." className="w-full p-3.5 border-2 border-[#f0f0f0] rounded-xl text-[15px] box-border" />
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[0, 1, 2, 3].map((j) => (
                      <div key={j} className="mb-6">
                        <label className="block mb-2.5 font-semibold text-sm text-[#555]">Opt {j + 1}</label>
                        <input required type="text" value={q.options[j]} onChange={(e) => { const next = [...questions]; next[i].options[j] = e.target.value; setQuestions(next) }} className="w-full p-3.5 border-2 border-[#f0f0f0] rounded-xl text-[15px] box-border" />
                      </div>
                    ))}
                  </div>
                  <div className="mb-6">
                    <label className="block mb-2.5 font-semibold text-sm text-[#555]">Correct Answer (Exact match)</label>
                    <input required type="text" value={q.correctAnswer} onChange={(e) => { const next = [...questions]; next[i].correctAnswer = e.target.value; setQuestions(next) }} className="w-full p-3.5 border-2 border-[#f0f0f0] rounded-xl text-[15px] box-border" />
                  </div>
                </div>
              ))}

              <button type="button" onClick={() => setQuestions([...questions, emptyQuestion()])} className="bg-[#f1f5f9] text-[#333] mb-5 p-3 rounded-[10px] font-semibold border-0 cursor-pointer w-full text-left">
                + Add Another Question
              </button>

              <button type="submit" className="bg-primary-strong text-white border-0 p-4 rounded-[14px] font-bold cursor-pointer w-full hover:bg-[#9a1418] hover:-translate-y-0.5">
                {editing.type === 'quizzes' ? 'Update Quiz Package' : 'Save Quiz Package'}
              </button>
            </form>
          </section>
        )}

        {tab === 'add-flash' && (
          <section className="bg-white p-10 rounded-[24px] shadow-[0_10px_30px_rgba(0,0,0,0.05)] mb-[30px] fade-in-anim max-[850px]:p-5 max-[850px]:rounded-xl">
            <h2>Add New Flashcard {editing.type === 'flashcards' && <span className="text-sm text-primary-strong font-normal ml-2.5">— Editing Mode</span>}</h2>
            <form onSubmit={saveFlashcards}>
              <div className="mb-6">
                <label className="block mb-2.5 font-semibold text-sm text-[#555]">Subject</label>
                <input required value={fSubject} onChange={(e) => setFSubject(e.target.value)} placeholder="e.g. Physics" className="w-full p-3.5 border-2 border-[#f0f0f0] rounded-xl text-[15px] box-border focus:border-primary-strong focus:outline-none" />
              </div>
              {flashcards.map((fc, i) => (
                <div key={i} className="border border-[#eee] p-5 rounded-xl mb-5">
                  <div className="mb-6">
                    <label className="block mb-2.5 font-semibold text-sm text-[#555]">Front (Question)</label>
                    <input required type="text" value={fc.question} onChange={(e) => { const next = [...flashcards]; next[i].question = e.target.value; setFlashcards(next) }} className="w-full p-3.5 border-2 border-[#f0f0f0] rounded-xl text-[15px] box-border" />
                  </div>
                  <div className="mb-6">
                    <label className="block mb-2.5 font-semibold text-sm text-[#555]">Back (Answer)</label>
                    <textarea required value={fc.answer} onChange={(e) => { const next = [...flashcards]; next[i].answer = e.target.value; setFlashcards(next) }} className="w-full p-3.5 border-2 border-[#f0f0f0] rounded-xl text-[15px] box-border" />
                  </div>
                </div>
              ))}
              {editing.type !== 'flashcards' && (
                <button type="button" onClick={() => setFlashcards([...flashcards, emptyFlash()])} className="bg-[#f1f5f9] text-[#333] mb-5 p-3 rounded-[10px] font-semibold border-0 cursor-pointer w-full text-left">
                  + Add Another Flashcard
                </button>
              )}
              <button type="submit" className="bg-primary-strong text-white border-0 p-4 rounded-[14px] font-bold cursor-pointer w-full hover:bg-[#9a1418] hover:-translate-y-0.5">
                {editing.type === 'flashcards' ? 'Update Flashcard' : 'Save Flashcard'}
              </button>
            </form>
          </section>
        )}

        {tab === 'add-resource' && (
          <section className="bg-white p-10 rounded-[24px] shadow-[0_10px_30px_rgba(0,0,0,0.05)] mb-[30px] fade-in-anim max-[850px]:p-5 max-[850px]:rounded-xl">
            <h2>Add New Resource {editing.type === 'resources' && <span className="text-sm text-primary-strong font-normal ml-2.5">— Editing Mode</span>}</h2>
            <form onSubmit={saveResource}>
              <div className="mb-6">
                <label className="block mb-2.5 font-semibold text-sm text-[#555]">Subject</label>
                <input required value={resForm.subject} onChange={(e) => setResForm({ ...resForm, subject: e.target.value })} className="w-full p-3.5 border-2 border-[#f0f0f0] rounded-xl text-[15px] box-border" />
              </div>
              <div className="mb-6">
                <label className="block mb-2.5 font-semibold text-sm text-[#555]">Title</label>
                <input required value={resForm.title} onChange={(e) => setResForm({ ...resForm, title: e.target.value })} className="w-full p-3.5 border-2 border-[#f0f0f0] rounded-xl text-[15px] box-border" />
              </div>
              <div className="mb-6">
                <label className="block mb-2.5 font-semibold text-sm text-[#555]">Type</label>
                <select value={resForm.type} onChange={(e) => setResForm({ ...resForm, type: e.target.value })} className="w-full p-3.5 border-2 border-[#f0f0f0] rounded-xl text-[15px] box-border">
                  <option value="drive">📂 Google Drive</option>
                  <option value="youtube">🎥 YouTube Video</option>
                </select>
              </div>
              <div className="mb-6">
                <label className="block mb-2.5 font-semibold text-sm text-[#555]">URL</label>
                <input required type="url" value={resForm.url} onChange={(e) => setResForm({ ...resForm, url: e.target.value })} placeholder="https://..." className="w-full p-3.5 border-2 border-[#f0f0f0] rounded-xl text-[15px] box-border" />
              </div>
              <div className="mb-6">
                <label className="block mb-2.5 font-semibold text-sm text-[#555]">Cover image (optional)</label>
                <p className="text-xs text-[#999] mb-2.5">Shown on the resource card instead of the default folder/video icon.</p>
                {coverPreview ? (
                  <div className="flex items-center gap-4">
                    <img src={coverPreview} alt="Cover preview" className="w-24 h-16 object-cover rounded-lg border border-[#eee]" />
                    <button type="button" onClick={removeCover} className="text-primary-strong text-sm font-semibold bg-transparent border-0 cursor-pointer">
                      ✕ Remove cover
                    </button>
                  </div>
                ) : (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => pickCoverFile(e.target.files?.[0])}
                    className="w-full p-3 border-2 border-[#f0f0f0] rounded-xl text-sm box-border bg-white"
                  />
                )}
              </div>
              <button type="submit" disabled={coverUploading} className="bg-primary-strong text-white border-0 p-4 rounded-[14px] font-bold cursor-pointer w-full hover:bg-[#9a1418] hover:-translate-y-0.5 disabled:opacity-60">
                {coverUploading ? 'Uploading cover...' : editing.type === 'resources' ? 'Update Resource' : 'Save Resource'}
              </button>
            </form>
          </section>
        )}

        {tab === 'view-data' && (
          <section className="bg-white p-10 rounded-[24px] shadow-[0_10px_30px_rgba(0,0,0,0.05)] mb-[30px] fade-in-anim max-[850px]:p-5 max-[850px]:rounded-xl">
            <h2>Live Content Monitor</h2>
            <div className="mb-5 flex gap-2 flex-wrap">
              <button onClick={() => fetchList('quizzes')} className="border-0 rounded-md py-2 px-3 cursor-pointer bg-[#f1f5f9]">Quiz Data</button>
              <button onClick={() => fetchList('flashcards')} className="border-0 rounded-md py-2 px-3 cursor-pointer bg-[#f1f5f9]">Flashcard Data</button>
              <button onClick={() => fetchList('resources')} className="border-0 rounded-md py-2 px-3 cursor-pointer bg-[#f1f5f9]">Resources</button>
            </div>
            <div>
              {dataList.loading && <p>Loading...</p>}
              {dataList.error && <p>{dataList.error}</p>}
              {!dataList.loading && !dataList.col && <p className="text-[#aaa]">Select a category above to view items.</p>}
              {dataList.items.map((item) => {
                const summary = item.title
                  || (item.question ? (item.question.length > 30 ? item.question.slice(0, 30) : item.question) : null)
                  || (item.questions ? `Quiz: ${item.questions.length} questions` : 'No Title')
                return (
                  <div key={item.id} className="flex justify-between items-center p-[15px] border-b border-[#eee] max-[850px]:flex-col max-[850px]:items-start max-[850px]:gap-2.5">
                    <span><strong>[{item.subject}]</strong> {summary}</span>
                    <div className="flex gap-2.5 items-center">
                      <span onClick={() => startEdit(dataList.col, item)} className="text-[#2D2D2D] cursor-pointer font-bold bg-[#eee] py-[5px] px-3 rounded-lg">Edit</span>
                      <span onClick={() => deleteItem(dataList.col, item.id)} className="text-primary-strong cursor-pointer font-bold p-2">✕ Delete</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </main>

      {toast && (
        <div className="fixed bottom-[30px] left-1/2 -translate-x-1/2 bg-[#333] text-white py-[15px] px-[30px] rounded-[50px] z-[10000]">
          {toast}
        </div>
      )}
    </div>
  )
}
