import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { STREAMS, streamLabel } from '../../constants/streams.js'
import { getTeachers } from '../../services/academic.js'
import SubjectUnitPicker from '../../components/SubjectUnitPicker.jsx'
import {
  getAllCourses, createCourse, updateCourse, deleteCourse, publishCourse, unpublishCourse,
  getVideosForCourse, addVideo, updateVideo, deleteVideo
} from '../../services/courses.js'

const inputCls = 'w-full p-3 border-2 border-border-card rounded-xl text-sm box-border focus:border-primary-strong focus:outline-none'
const emptyCourse = { title: '', description: '', coverURL: '', teacherId: '', streamId: '', subjectId: '', unitId: '' }
const emptyVideo = { title: '', videoURL: '', duration: '', order: 0 }

// Super Admin → Courses: the requested workflow end-to-end —
// Create Course → Assign Teacher + Stream + Subject + Unit → Add Videos → Publish.
// (Create the Teacher itself in the Teachers tab first.)
export default function AdminCourses({ showToast }) {
  const { user } = useAuth()
  const [courses, setCourses] = useState([])
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyCourse)
  const [editingCourseId, setEditingCourseId] = useState(null)
  const [selected, setSelected] = useState(null) // course being managed (videos)
  const [videos, setVideos] = useState([])
  const [videoForm, setVideoForm] = useState(emptyVideo)
  const [editingVideoId, setEditingVideoId] = useState(null)

  async function load() {
    setLoading(true); setError('')
    try {
      const [c, t] = await Promise.all([getAllCourses(), getTeachers()])
      setCourses(c); setTeachers(t)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  async function openCourse(course) {
    setSelected(course)
    setVideoForm(emptyVideo)
    setEditingVideoId(null)
    try { setVideos(await getVideosForCourse(course.id)) } catch (e) { setError(e.message) }
  }

  async function submitCourse(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    try {
      if (editingCourseId) {
        await updateCourse(editingCourseId, form)
        showToast?.('Course updated')
        setEditingCourseId(null)
      } else {
        await createCourse(form, user?.uid)
        showToast?.('Course created')
      }
      setForm(emptyCourse)
      await load()
    } catch (e) { setError(e.message) }
  }

  function startEditCourse(course) {
    setEditingCourseId(course.id)
    setForm({
      title: course.title || '', description: course.description || '', coverURL: course.coverURL || '',
      teacherId: course.teacherId || '', streamId: course.stream || '', subjectId: course.subjectId || '', unitId: course.unitId || ''
    })
  }

  function cancelEditCourse() {
    setEditingCourseId(null)
    setForm(emptyCourse)
  }

  async function togglePublish(course) {
    try {
      if (course.status === 'PUBLISHED') await unpublishCourse(course.id)
      else await publishCourse(course.id)
      await load()
      if (selected?.id === course.id) setSelected((s) => ({ ...s, status: s.status === 'PUBLISHED' ? 'UNPUBLISHED' : 'PUBLISHED' }))
    } catch (e) { setError(e.message) }
  }

  async function removeCourse(course) {
    if (!confirm(`Delete "${course.title}" and all its videos?`)) return
    try {
      const vids = await getVideosForCourse(course.id)
      await Promise.all(vids.map((v) => deleteVideo(v.id)))
      await deleteCourse(course.id)
      if (selected?.id === course.id) setSelected(null)
      if (editingCourseId === course.id) cancelEditCourse()
      await load()
    } catch (e) { setError(e.message) }
  }

  async function submitVideo(e) {
    e.preventDefault()
    if (!videoForm.title.trim() || !videoForm.videoURL.trim() || !selected) return
    try {
      if (editingVideoId) {
        await updateVideo(editingVideoId, {
          title: videoForm.title, videoURL: videoForm.videoURL, duration: videoForm.duration, order: videoForm.order
        })
        showToast?.('Video updated')
        setEditingVideoId(null)
      } else {
        await addVideo({
          courseId: selected.id, teacherId: selected.teacherId, streamId: selected.stream,
          subjectId: selected.subjectId, unitId: selected.unitId,
          title: videoForm.title, videoURL: videoForm.videoURL, duration: videoForm.duration, order: videos.length
        }, user?.uid)
        showToast?.('Video added')
      }
      setVideoForm(emptyVideo)
      setVideos(await getVideosForCourse(selected.id))
    } catch (e) { setError(e.message) }
  }

  function startEditVideo(video) {
    setEditingVideoId(video.id)
    setVideoForm({ title: video.title || '', videoURL: video.videoURL || '', duration: video.duration || '', order: video.order ?? 0 })
  }

  function cancelEditVideo() {
    setEditingVideoId(null)
    setVideoForm(emptyVideo)
  }

  async function removeVideo(video) {
    if (!confirm(`Delete video "${video.title}"?`)) return
    try {
      await deleteVideo(video.id)
      if (editingVideoId === video.id) cancelEditVideo()
      setVideos(await getVideosForCourse(selected.id))
    } catch (e) { setError(e.message) }
  }

  const teacherName = (id) => teachers.find((t) => t.id === id)?.name || '—'

  return (
    <section className="bg-surface p-10 rounded-[24px] shadow-[0_10px_30px_rgba(0,0,0,0.05)] mb-[30px] fade-in-anim max-[850px]:p-5 max-[850px]:rounded-xl">
      <h2>Video Courses</h2>
      <p className="text-ink-muted text-sm mt-1 mb-6">
        Create a course, assign a teacher + academic position, add videos, then publish. Only Super Admin creates/manages courses and videos.
      </p>

      {error && <p className="text-primary-strong text-sm mb-3">{error}</p>}

      {/* Create/edit course */}
      <form onSubmit={submitCourse} className="grid grid-cols-2 gap-4 mb-8 border border-border-soft rounded-xl p-5 max-[600px]:grid-cols-1">
        {editingCourseId && <p className="col-span-2 text-sm text-primary-strong font-semibold -mb-2">Editing course</p>}
        <div>
          <label className="block mb-1.5 font-semibold text-xs text-ink-muted">Course Title</label>
          <input required value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} className={inputCls} placeholder="e.g. Complete Complex Numbers Course" />
        </div>
        <div>
          <label className="block mb-1.5 font-semibold text-xs text-ink-muted">Teacher</label>
          <select value={form.teacherId} onChange={(e) => setForm((prev) => ({ ...prev, teacherId: e.target.value }))} className={inputCls}>
            <option value="">— None —</option>
            {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className="block mb-1.5 font-semibold text-xs text-ink-muted">Description</label>
          <input value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} className={inputCls} />
        </div>
        <div>
          <label className="block mb-1.5 font-semibold text-xs text-ink-muted">Cover Image URL</label>
          <input value={form.coverURL} onChange={(e) => setForm((prev) => ({ ...prev, coverURL: e.target.value }))} className={inputCls} placeholder="https://..." />
        </div>
        <div>
          <label className="block mb-1.5 font-semibold text-xs text-ink-muted">BAC Stream</label>
          <select value={form.streamId} onChange={(e) => setForm((prev) => ({ ...prev, streamId: e.target.value, subjectId: '', unitId: '' }))} className={inputCls}>
            <option value="">🌐 All streams</option>
            {STREAMS.map((s) => <option key={s.id} value={s.id}>{s.icon} {streamLabel(s.id, 'ar')}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          {/* SubjectUnitPicker fires onSubjectChange + onUnitChange synchronously
              on subject change — both must use the functional setState form, or
              the second call clobbers the first (this was the reported "subject
              selection doesn't save" bug). */}
          <SubjectUnitPicker stream={form.streamId} subjectId={form.subjectId} unitId={form.unitId}
            onSubjectChange={(v) => setForm((prev) => ({ ...prev, subjectId: v }))}
            onUnitChange={(v) => setForm((prev) => ({ ...prev, unitId: v }))} />
        </div>
        <div className="col-span-2 flex gap-2">
          <button type="submit" className="bg-primary-strong text-white border-0 py-2.5 px-5 rounded-lg font-semibold cursor-pointer hover:bg-[#9a1418]">
            {editingCourseId ? 'Save Changes' : '+ Create Course'}
          </button>
          {editingCourseId && <button type="button" onClick={cancelEditCourse} className="bg-surface-muted text-ink-muted border-0 py-2.5 px-5 rounded-lg font-semibold cursor-pointer">Cancel</button>}
        </div>
      </form>

      {loading ? <p className="text-ink-muted text-sm">Loading…</p>
        : courses.length === 0 ? <p className="text-ink-muted text-sm">No courses yet — create one above.</p>
        : (
          <div className="grid grid-cols-2 gap-6 max-[850px]:grid-cols-1">
            {/* Course list */}
            <div>
              <h3 className="text-base font-bold mb-3">All Courses</h3>
              <div className="flex flex-col gap-2">
                {courses.map((c) => (
                  <div key={c.id} onClick={() => openCourse(c)}
                    className={`p-3 rounded-xl border cursor-pointer ${selected?.id === c.id ? 'border-primary-strong bg-primary-pale dark:bg-primary/10' : 'border-border-soft'}`}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-sm truncate">{c.title}</p>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${c.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{c.status}</span>
                        <button onClick={(e) => { e.stopPropagation(); startEditCourse(c) }} className="text-xs font-semibold text-ink cursor-pointer bg-surface-muted border-0 py-1 px-2 rounded-md">Edit</button>
                      </div>
                    </div>
                    <p className="text-xs text-ink-muted mt-1">{teacherName(c.teacherId)} · {c.stream ? streamLabel(c.stream, 'ar') : 'All streams'}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected course: videos */}
            <div className="border border-border-soft rounded-xl p-4">
              {!selected ? (
                <p className="text-ink-muted text-sm">Select a course to manage its videos.</p>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold truncate">{selected.title}</h3>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => togglePublish(selected)} className={`text-xs px-3 py-1.5 rounded-lg font-semibold border-0 cursor-pointer ${selected.status === 'PUBLISHED' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {selected.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                      </button>
                      <button onClick={() => removeCourse(selected)} className="text-xs px-3 py-1.5 rounded-lg font-semibold border-0 bg-red-50 text-primary-strong cursor-pointer">Delete</button>
                    </div>
                  </div>

                  <form onSubmit={submitVideo} className="flex flex-col gap-2 mb-4">
                    {editingVideoId && <p className="text-xs text-primary-strong font-semibold">Editing video</p>}
                    <input required value={videoForm.title} onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })} placeholder="Video title" className={inputCls} />
                    <input required value={videoForm.videoURL} onChange={(e) => setVideoForm({ ...videoForm, videoURL: e.target.value })} placeholder="Video URL (YouTube, Dailymotion, Drive…)" className={inputCls} />
                    <div className="flex gap-2">
                      <input type="number" min="0" value={videoForm.duration} onChange={(e) => setVideoForm({ ...videoForm, duration: e.target.value })} placeholder="Duration (min)" className={inputCls} />
                      {/* Order is only meaningful (and only saved) when editing
                          an existing video — a new video is always appended at
                          the end (order: videos.length), so showing this field
                          during add would look editable while doing nothing. */}
                      {editingVideoId && (
                        <input type="number" min="0" value={videoForm.order} onChange={(e) => setVideoForm({ ...videoForm, order: e.target.value })} placeholder="Order" className={`${inputCls} max-w-[100px]`} />
                      )}
                      <button type="submit" className="bg-primary-strong text-white border-0 px-4 rounded-lg font-semibold cursor-pointer whitespace-nowrap">{editingVideoId ? 'Save' : '+ Add'}</button>
                      {editingVideoId && <button type="button" onClick={cancelEditVideo} className="bg-surface-muted text-ink-muted border-0 px-4 rounded-lg font-semibold cursor-pointer whitespace-nowrap">Cancel</button>}
                    </div>
                  </form>

                  {videos.length === 0 ? <p className="text-ink-muted text-sm">No videos yet.</p> : (
                    <div className="flex flex-col gap-2">
                      {videos.map((v, i) => (
                        <div key={v.id} className="flex items-center gap-2 p-2.5 border-b border-border-soft text-sm">
                          <span className="text-ink-muted w-5">{i + 1}.</span>
                          <span className="flex-1 truncate">{v.title}</span>
                          {v.duration > 0 && <span className="text-xs text-ink-muted shrink-0">{v.duration}min</span>}
                          <button onClick={() => startEditVideo(v)} className="text-xs font-semibold text-ink cursor-pointer bg-surface-muted border-0 py-1 px-2 rounded-md shrink-0">Edit</button>
                          <button onClick={() => removeVideo(v)} className="text-primary-strong bg-transparent border-0 cursor-pointer shrink-0">✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
    </section>
  )
}
