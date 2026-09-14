import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { STREAMS, streamLabel } from '../../constants/streams.js'
import { getTeachers, createTeacher, updateTeacher, deleteTeacher } from '../../services/academic.js'

const inputCls = 'w-full p-3 border-2 border-border-card rounded-xl text-sm box-border focus:border-primary-strong focus:outline-none'
const emptyForm = { name: '', photoURL: '', bio: '', specialization: '', assignedStreamIds: [] }

// Super Admin → Teachers. First step of the requested workflow: Create Teacher
// → Assign Stream(s) → (then create their courses in the Courses tab). Teachers
// are content-provider records only — never authenticated users.
export default function AdminTeachers({ showToast }) {
  const { user } = useAuth()
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)

  async function load() {
    setLoading(true); setError('')
    try { setTeachers(await getTeachers()) }
    catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  function toggleStream(id) {
    setForm((f) => ({
      ...f,
      assignedStreamIds: f.assignedStreamIds.includes(id)
        ? f.assignedStreamIds.filter((s) => s !== id)
        : [...f.assignedStreamIds, id]
    }))
  }

  function startEdit(tc) {
    setEditingId(tc.id)
    setForm({ name: tc.name || '', photoURL: tc.photoURL || '', bio: tc.bio || '', specialization: tc.specialization || '', assignedStreamIds: tc.assignedStreamIds || [] })
  }
  function resetForm() { setEditingId(null); setForm(emptyForm) }

  async function submit(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    try {
      if (editingId) {
        await updateTeacher(editingId, form)
        showToast?.('Teacher updated')
      } else {
        await createTeacher(form, user?.uid)
        showToast?.('Teacher created')
      }
      resetForm()
      await load()
    } catch (e) { setError(e.message) }
  }

  async function archive(tc) {
    if (!confirm(`Archive ${tc.name}? Their existing courses stay published.`)) return
    try { await updateTeacher(tc.id, { status: tc.status === 'ARCHIVED' ? 'ACTIVE' : 'ARCHIVED' }); await load() }
    catch (e) { setError(e.message) }
  }
  async function remove(tc) {
    if (!confirm(`Permanently delete ${tc.name}? This does not delete their courses.`)) return
    try { await deleteTeacher(tc.id); await load() }
    catch (e) { setError(e.message) }
  }

  return (
    <section className="bg-surface p-10 rounded-[24px] shadow-[0_10px_30px_rgba(0,0,0,0.05)] mb-[30px] fade-in-anim max-[850px]:p-5 max-[850px]:rounded-xl">
      <h2>Teachers {editingId && <span className="text-sm text-primary-strong font-normal ml-2.5">— Editing Mode</span>}</h2>
      <p className="text-ink-muted text-sm mt-1 mb-6">Teachers are content-provider records managed entirely by you — they never log in.</p>

      {error && <p className="text-primary-strong text-sm mb-3">{error}</p>}

      <form onSubmit={submit} className="grid grid-cols-2 gap-4 mb-8 border border-border-soft rounded-xl p-5 max-[600px]:grid-cols-1">
        <div>
          <label className="block mb-1.5 font-semibold text-xs text-ink-muted">Name</label>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="e.g. Ahmed Benali" />
        </div>
        <div>
          <label className="block mb-1.5 font-semibold text-xs text-ink-muted">Specialization</label>
          <input value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} className={inputCls} placeholder="e.g. Mathematics" />
        </div>
        <div>
          <label className="block mb-1.5 font-semibold text-xs text-ink-muted">Photo URL</label>
          <input value={form.photoURL} onChange={(e) => setForm({ ...form, photoURL: e.target.value })} className={inputCls} placeholder="https://..." />
        </div>
        <div>
          <label className="block mb-1.5 font-semibold text-xs text-ink-muted">Bio</label>
          <input value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className={inputCls} />
        </div>
        <div className="col-span-2">
          <label className="block mb-2 font-semibold text-xs text-ink-muted">Target Stream(s)</label>
          <div className="flex flex-wrap gap-2">
            {STREAMS.map((s) => (
              <button key={s.id} type="button" onClick={() => toggleStream(s.id)}
                className={`text-xs px-3 py-1.5 rounded-full border ${form.assignedStreamIds.includes(s.id) ? 'bg-primary-soft dark:bg-primary/15 border-primary-strong text-primary-strong' : 'border-border-soft text-ink-muted'}`}>
                {s.icon} {streamLabel(s.id, 'ar')}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-ink-muted mt-1.5">Leave empty to make this teacher visible to students of every stream.</p>
        </div>
        <div className="col-span-2 flex gap-2">
          <button type="submit" className="bg-primary-strong text-white border-0 py-2.5 px-5 rounded-lg font-semibold cursor-pointer hover:bg-[#9a1418]">
            {editingId ? 'Save Changes' : '+ Create Teacher'}
          </button>
          {editingId && <button type="button" onClick={resetForm} className="bg-surface-muted text-ink-muted border-0 py-2.5 px-5 rounded-lg font-semibold cursor-pointer">Cancel</button>}
        </div>
      </form>

      {loading ? <p className="text-ink-muted text-sm">Loading…</p>
        : teachers.length === 0 ? <p className="text-ink-muted text-sm">No teachers yet — create one above.</p>
        : (
          <div className="grid grid-cols-3 gap-3 max-[850px]:grid-cols-2 max-[500px]:grid-cols-1">
            {teachers.map((tc) => (
              <div key={tc.id} className={`border rounded-xl p-4 ${tc.status === 'ARCHIVED' ? 'border-border-soft opacity-60' : 'border-border-soft'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-primary-soft dark:bg-primary/15 flex items-center justify-center text-primary-strong font-bold overflow-hidden">
                    {tc.photoURL ? <img src={tc.photoURL} alt="" className="w-full h-full object-cover" /> : (tc.name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{tc.name}</p>
                    <p className="text-xs text-ink-muted truncate">{tc.specialization || '—'}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {(tc.assignedStreamIds || []).length === 0
                    ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-muted text-ink-muted">All streams</span>
                    : tc.assignedStreamIds.map((id) => <span key={id} className="text-[10px] px-2 py-0.5 rounded-full bg-surface-muted text-ink-muted">{streamLabel(id, 'ar')}</span>)}
                </div>
                <div className="flex gap-2 text-xs">
                  <button onClick={() => startEdit(tc)} className="bg-surface-muted px-2.5 py-1 rounded-md font-semibold border-0 cursor-pointer">Edit</button>
                  <button onClick={() => archive(tc)} className="bg-surface-muted px-2.5 py-1 rounded-md font-semibold border-0 cursor-pointer">{tc.status === 'ARCHIVED' ? 'Activate' : 'Archive'}</button>
                  <button onClick={() => remove(tc)} className="text-primary-strong px-2.5 py-1 font-semibold border-0 bg-transparent cursor-pointer">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
    </section>
  )
}
