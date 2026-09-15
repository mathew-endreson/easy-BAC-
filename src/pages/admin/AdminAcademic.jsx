import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { STREAMS, streamLabel } from '../../constants/streams.js'
import {
  getSubjects, createSubject, updateSubject, deleteSubject,
  getUnits, createUnit, updateUnit, deleteUnit
} from '../../services/academic.js'

// Hierarchical academic-structure manager for Super Admin:
//   Stream → Subject → Unit
// Every lesson / summary / quiz / flashcard set / video course hangs off a Unit,
// so this is the backbone the rest of the CMS references. Styled to match the
// existing admin CMS (light theme).

const inputCls = 'flex-1 p-2.5 border-2 border-border-card rounded-lg text-sm box-border focus:border-primary-strong focus:outline-none min-w-0'
const addBtnCls = 'bg-primary-strong text-white border-0 px-4 rounded-lg font-semibold cursor-pointer hover:bg-[#9a1418] whitespace-nowrap'

// `showCover` opts a row into editing an optional background-picture URL
// (used for Subjects — see SubjectCard in the student Library — not Units).
function Row({ item, onSave, onDelete, onSelect, selected, extra, showCover }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(item.name || '')
  const [cover, setCover] = useState(item.coverURL || '')

  function save() {
    if (!name.trim()) return
    onSave({ name: name.trim(), ...(showCover ? { coverURL: cover.trim() } : {}) })
    setEditing(false)
  }
  function cancel() {
    setName(item.name || '')
    setCover(item.coverURL || '')
    setEditing(false)
  }

  return (
    <div className={`flex items-center gap-2 p-2.5 border-b border-border-soft ${selected ? 'bg-primary-pale dark:bg-primary/10' : ''}`}>
      {editing ? (
        <div className="flex-1 flex flex-col gap-2 py-1">
          <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && save()} className={`${inputCls} w-full`} autoFocus placeholder="Name" />
          {showCover && (
            <input value={cover} onChange={(e) => setCover(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && save()} className={`${inputCls} w-full`} placeholder="Background picture URL (optional)" />
          )}
          <div className="flex items-center gap-3">
            <button onClick={save} className="text-primary-strong font-bold cursor-pointer bg-transparent border-0 text-sm">Save</button>
            <button onClick={cancel} className="text-ink-muted cursor-pointer bg-transparent border-0 text-sm">Cancel</button>
          </div>
        </div>
      ) : (
        <>
          {showCover && item.coverURL && (
            <img src={item.coverURL} alt="" className="w-8 h-8 rounded-md object-cover shrink-0" />
          )}
          <span
            onClick={onSelect}
            className={`flex-1 text-sm truncate ${onSelect ? 'cursor-pointer' : ''} ${selected ? 'text-primary-strong font-semibold' : ''}`}
          >
            <span className="text-ink-muted mr-2">{String(item.order ?? 0).padStart(2, '0')}</span>
            {item.name}
            {extra}
          </span>
          <button onClick={() => setEditing(true)} className="text-ink cursor-pointer bg-surface-muted py-1 px-2.5 rounded-md text-xs font-bold border-0">Edit</button>
          <button onClick={onDelete} className="text-primary-strong cursor-pointer bg-transparent border-0 text-sm">✕</button>
        </>
      )}
    </div>
  )
}

export default function AdminAcademic({ showToast }) {
  const { user } = useAuth()
  const adminId = user?.uid
  const [stream, setStream] = useState('')
  const [subjects, setSubjects] = useState([])
  const [selectedSubject, setSelectedSubject] = useState(null)
  const [units, setUnits] = useState([])
  const [newSubject, setNewSubject] = useState('')
  const [newSubjectCover, setNewSubjectCover] = useState('')
  const [newUnit, setNewUnit] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadSubjects = useCallback(async (streamId) => {
    if (!streamId) { setSubjects([]); return }
    setLoading(true); setError('')
    try { setSubjects(await getSubjects(streamId)) }
    catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [])

  const loadUnits = useCallback(async (subjectId) => {
    if (!subjectId) { setUnits([]); return }
    try { setUnits(await getUnits(subjectId)) }
    catch (e) { setError(e.message) }
  }, [])

  useEffect(() => { setSelectedSubject(null); setUnits([]); loadSubjects(stream) }, [stream, loadSubjects])

  async function addSubject() {
    if (!newSubject.trim() || !stream) return
    try {
      await createSubject({ name: newSubject, streamId: stream, order: subjects.length, coverURL: newSubjectCover }, adminId)
      setNewSubject('')
      setNewSubjectCover('')
      await loadSubjects(stream)
      showToast?.('Subject created')
    } catch (e) { setError(e.message) }
  }

  async function addUnit() {
    if (!newUnit.trim() || !selectedSubject) return
    try {
      await createUnit({ name: newUnit, streamId: stream, subjectId: selectedSubject.id, order: units.length }, adminId)
      setNewUnit('')
      await loadUnits(selectedSubject.id)
      showToast?.('Unit created')
    } catch (e) { setError(e.message) }
  }

  return (
    <section className="bg-surface p-10 rounded-[24px] shadow-[0_10px_30px_rgba(0,0,0,0.05)] mb-[30px] fade-in-anim max-[850px]:p-5 max-[850px]:rounded-xl">
      <h2>Academic Structure</h2>
      <p className="text-ink-muted text-sm mt-1 mb-5">Manage the Stream → Subject → Unit hierarchy that all lessons, summaries, quizzes, flashcards and video courses attach to.</p>

      <div className="flex gap-2 flex-wrap mb-6">
        {STREAMS.map((s) => (
          <button
            key={s.id}
            onClick={() => setStream(s.id)}
            className={`py-2 px-3.5 rounded-lg text-sm cursor-pointer border ${stream === s.id ? 'bg-primary-soft dark:bg-primary/15 text-primary-strong border-primary-strong' : 'bg-surface text-ink-muted border-border-soft'}`}
          >
            {s.icon} {streamLabel(s.id, 'ar')}
          </button>
        ))}
      </div>

      {error && <p className="text-primary-strong text-sm mb-3">{error}</p>}

      {!stream ? (
        <p className="text-ink-muted">Select a BAC stream above to manage its subjects and units.</p>
      ) : (
        <div className="grid grid-cols-2 gap-6 max-[850px]:grid-cols-1">
          <div className="border border-border-soft rounded-xl p-4">
            <h3 className="text-base font-bold mb-3">Subjects — {streamLabel(stream, 'ar')}</h3>
            <div className="flex gap-2 mb-2">
              <input value={newSubject} onChange={(e) => setNewSubject(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addSubject()} placeholder="New subject name" className={inputCls} />
              <button onClick={addSubject} className={addBtnCls}>+ Add</button>
            </div>
            <input value={newSubjectCover} onChange={(e) => setNewSubjectCover(e.target.value)} placeholder="Background picture URL (optional)" className={`${inputCls} w-full mb-3`} />
            {loading ? <p className="text-ink-muted text-sm">Loading…</p>
              : subjects.length === 0 ? <p className="text-ink-muted text-sm">No subjects yet.</p>
              : subjects.map((s) => (
                <Row
                  key={s.id}
                  item={s}
                  showCover
                  selected={selectedSubject?.id === s.id}
                  onSelect={() => { setSelectedSubject(s); loadUnits(s.id) }}
                  onSave={async (patch) => { await updateSubject(s.id, patch); loadSubjects(stream) }}
                  onDelete={async () => { if (confirm('Delete subject?')) { await deleteSubject(s.id); if (selectedSubject?.id === s.id) setSelectedSubject(null); loadSubjects(stream) } }}
                  extra={<span className="text-ink-muted text-xs ml-2">▸</span>}
                />
              ))}
          </div>

          <div className="border border-border-soft rounded-xl p-4">
            <h3 className="text-base font-bold mb-3">{selectedSubject ? `Units — ${selectedSubject.name}` : 'Units'}</h3>
            {!selectedSubject ? (
              <p className="text-ink-muted text-sm">Select a subject to manage its units.</p>
            ) : (
              <>
                <div className="flex gap-2 mb-3">
                  <input value={newUnit} onChange={(e) => setNewUnit(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addUnit()} placeholder="e.g. Complex Numbers" className={inputCls} />
                  <button onClick={addUnit} className={addBtnCls}>+ Add</button>
                </div>
                {units.length === 0 ? <p className="text-ink-muted text-sm">No units yet.</p>
                  : units.map((u) => (
                    <Row
                      key={u.id}
                      item={u}
                      onSave={async (patch) => { await updateUnit(u.id, patch); loadUnits(selectedSubject.id) }}
                      onDelete={async () => { if (confirm('Delete this unit?')) { await deleteUnit(u.id); loadUnits(selectedSubject.id) } }}
                    />
                  ))}
              </>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
