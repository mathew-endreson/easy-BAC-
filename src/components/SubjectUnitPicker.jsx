import { useEffect, useState } from 'react'
import { getSubjects, getUnits } from '../services/academic.js'

// Cascading Subject → Unit selector for admin content forms. Loads subjects for
// the chosen stream, then units for the chosen subject. Controlled by the parent
// (which stores subjectId/unitId on the content document). Styled to match the
// existing admin CMS inputs (light theme).
const inputCls = 'w-full p-3.5 border-2 border-[#f0f0f0] rounded-xl text-[15px] box-border focus:border-primary-strong focus:outline-none'

export default function SubjectUnitPicker({ stream, subjectId, unitId, onSubjectChange, onUnitChange }) {
  const [subjects, setSubjects] = useState([])
  const [units, setUnits] = useState([])
  const [loadingSubjects, setLoadingSubjects] = useState(false)
  const [loadingUnits, setLoadingUnits] = useState(false)

  useEffect(() => {
    let cancelled = false
    if (!stream) { setSubjects([]); return }
    setLoadingSubjects(true)
    getSubjects(stream)
      .then((s) => { if (!cancelled) setSubjects(s) })
      .catch(() => { if (!cancelled) setSubjects([]) })
      .finally(() => { if (!cancelled) setLoadingSubjects(false) })
    return () => { cancelled = true }
  }, [stream])

  useEffect(() => {
    let cancelled = false
    if (!subjectId) { setUnits([]); return }
    setLoadingUnits(true)
    getUnits(subjectId)
      .then((u) => { if (!cancelled) setUnits(u) })
      .catch(() => { if (!cancelled) setUnits([]) })
      .finally(() => { if (!cancelled) setLoadingUnits(false) })
    return () => { cancelled = true }
  }, [subjectId])

  return (
    <div className="grid grid-cols-2 gap-4 max-[600px]:grid-cols-1">
      <div>
        <label className="block mb-2.5 font-semibold text-sm text-[#555]">Subject</label>
        <select
          className={inputCls}
          value={subjectId || ''}
          disabled={!stream || loadingSubjects}
          onChange={(e) => { onSubjectChange(e.target.value); onUnitChange('') }}
        >
          <option value="">{!stream ? 'Pick a stream first' : loadingSubjects ? 'Loading…' : '— None —'}</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div>
        <label className="block mb-2.5 font-semibold text-sm text-[#555]">Unit</label>
        <select
          className={inputCls}
          value={unitId || ''}
          disabled={!subjectId || loadingUnits}
          onChange={(e) => onUnitChange(e.target.value)}
        >
          <option value="">{!subjectId ? 'Pick a subject first' : loadingUnits ? 'Loading…' : '— None —'}</option>
          {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </div>
    </div>
  )
}
