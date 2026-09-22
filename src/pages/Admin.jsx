import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import { STREAMS, streamLabel } from '../constants/streams.js'
import SubjectUnitPicker from '../components/SubjectUnitPicker.jsx'
import AdminAcademic from './admin/AdminAcademic.jsx'
import AdminStudents from './admin/AdminStudents.jsx'
import AdminTeachers from './admin/AdminTeachers.jsx'
import AdminCourses from './admin/AdminCourses.jsx'
import AdminMigrations from './admin/AdminMigrations.jsx'
import Icon from '../components/ui/Icon.jsx'

const emptyQuestion = () => ({ question: '', options: ['', '', '', ''], correctAnswer: '' })
const emptyFlash = () => ({ question: '', answer: '' })

// Shared multi-select stream picker. An empty selection = "All streams" (content
// with no stream tag is visible to every student — matches the platform's
// legacy-content policy). Content stores the selection as `streams: []`, plus
// `stream` (the first pick, or '') so older code/records keep working.
function StreamMultiSelect({ value, onChange }) {
  const toggle = (id) => onChange(value.includes(id) ? value.filter((s) => s !== id) : [...value, id])
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => onChange([])}
          className={`text-sm px-3.5 py-2 rounded-full border cursor-pointer ${value.length === 0 ? 'bg-primary-soft dark:bg-primary/15 border-primary-strong text-primary-strong' : 'border-border-soft text-ink-muted'}`}>
          🌐 All streams
        </button>
        {STREAMS.map((s) => (
          <button key={s.id} type="button" onClick={() => toggle(s.id)}
            className={`text-sm px-3.5 py-2 rounded-full border cursor-pointer ${value.includes(s.id) ? 'bg-primary-soft dark:bg-primary/15 border-primary-strong text-primary-strong' : 'border-border-soft text-ink-muted'}`}>
            {s.icon} {streamLabel(s.id, 'ar')}
          </button>
        ))}
      </div>
      <p className="text-xs text-ink-muted mt-1.5">Select one or more streams — or leave on "All streams" to show it to everyone.</p>
    </div>
  )
}

// A record's stream list, tolerating legacy single-`stream` documents.
const streamsOf = (item) => (item?.streams?.length ? item.streams : item?.stream ? [item.stream] : [])

export default function Admin() {
  const navigate = useNavigate()
  const { profile, logout } = useAuth()
  const [tab, setTab] = useState('students')
  const [toast, setToast] = useState('')

  // Quiz form
  const [qSubject, setQSubject] = useState('')
  const [qStreams, setQStreams] = useState([])
  const [qSubjectId, setQSubjectId] = useState('')
  const [qUnitId, setQUnitId] = useState('')
  const [questions, setQuestions] = useState([emptyQuestion()])

  // Flashcard form
  const [fSubject, setFSubject] = useState('')
  const [fStreams, setFStreams] = useState([])
  const [fSubjectId, setFSubjectId] = useState('')
  const [fUnitId, setFUnitId] = useState('')
  const [fSetTitle, setFSetTitle] = useState('')
  const [flashcards, setFlashcards] = useState([emptyFlash()])

  // Resource form
  const emptyRes = { subject: '', title: '', type: 'drive', url: '', streams: [], subjectId: '', unitId: '' }
  const [resForm, setResForm] = useState(emptyRes)

  // Edit state
  const [editing, setEditing] = useState({ id: null, type: null })

  // Data list
  const [dataList, setDataList] = useState({ col: null, items: [], loading: false, error: '' })

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
      streams: qStreams,
      stream: qStreams[0] || '', // legacy scalar, kept for any older code reading it directly
      subjectId: qSubjectId,
      unitId: qUnitId,
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
      setQStreams([])
      setQSubjectId('')
      setQUnitId('')
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
      const meta = { subject: fSubject, streams: fStreams, stream: fStreams[0] || '', subjectId: fSubjectId, unitId: fUnitId, setTitle: fSetTitle || fSubject }
      if (editing.type === 'flashcards' && editing.id) {
        // Preserve the card's existing setId (if any) — editing one card must
        // not split it out of its deck.
        await updateDoc(doc(db, 'flashcards', editing.id), { ...meta, question: flashcards[0].question, answer: flashcards[0].answer })
        showToast('Flashcard Updated!')
      } else {
        // Every card saved together in this submission shares one generated
        // setId, so they group into a single deck (see src/services/decks.js).
        const setId = doc(collection(db, 'flashcards')).id
        for (const fc of flashcards) {
          await addDoc(collection(db, 'flashcards'), { ...meta, setId, question: fc.question, answer: fc.answer })
        }
        showToast(`Saved ${flashcards.length} Flashcards!`)
      }
      setFSubject('')
      setFStreams([])
      setFSubjectId('')
      setFUnitId('')
      setFSetTitle('')
      setFlashcards([emptyFlash()])
      if (editing.type === 'flashcards') {
        await fetchList('flashcards')
        resetEdit()
      }
    } catch (err) { alert('Error: ' + err.message) }
  }

  async function saveResource(e) {
    e.preventDefault()
    if (!resForm.url.startsWith('http')) return alert('Please enter a valid URL')
    const data = { ...resForm, stream: resForm.streams[0] || '' } // legacy scalar, kept for any older code reading it directly
    try {
      if (editing.type === 'resources' && editing.id) {
        await updateDoc(doc(db, 'resources', editing.id), data)
        showToast('Resource Updated!')
      } else {
        await addDoc(collection(db, 'resources'), data)
        showToast('Resource Saved!')
      }
      setResForm(emptyRes)
      if (editing.type === 'resources') {
        await fetchList('resources')
        resetEdit()
      }
    } catch (err) { alert('Error: ' + err.message) }
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
      setQStreams(streamsOf(item))
      setQSubjectId(item.subjectId || '')
      setQUnitId(item.unitId || '')
      setQuestions((item.questions || []).map((q) => ({
        question: q.question || '',
        options: [q.options?.[0] || '', q.options?.[1] || '', q.options?.[2] || '', q.options?.[3] || ''],
        correctAnswer: q.correctAnswer || ''
      })))
    } else if (col === 'flashcards') {
      setTab('add-flash')
      setFSubject(item.subject || '')
      setFStreams(streamsOf(item))
      setFSubjectId(item.subjectId || '')
      setFUnitId(item.unitId || '')
      setFSetTitle(item.setTitle || '')
      setFlashcards([{ question: item.question || '', answer: item.answer || '' }])
    } else if (col === 'resources') {
      setTab('add-resource')
      setResForm({ subject: item.subject || '', title: item.title || '', type: item.type || 'drive', url: item.url || '', streams: streamsOf(item), subjectId: item.subjectId || '', unitId: item.unitId || '' })
    }
  }

  // Access is enforced by the <RequireAdmin> route guard — only super admins
  // ever render this component, so no in-component password gate is needed.
  async function handleSignOut() {
    await logout()
    navigate('/', { replace: true })
  }

  const navBtnBase = 'bg-transparent border-0 py-[15px] px-5 text-left rounded-[15px] cursor-pointer font-medium text-ink-muted w-full hover:bg-surface-muted hover:text-primary-strong'

  return (
    <div className="grid grid-cols-[280px_1fr] min-h-screen bg-bg-page text-ink max-[850px]:block" style={{ fontFamily: 'Outfit, sans-serif' }}>
      <aside className="bg-surface p-[40px_20px] border-r border-border-soft flex flex-col gap-4 max-[850px]:p-[15px] max-[850px]:flex-row max-[850px]:overflow-x-auto max-[850px]:whitespace-nowrap max-[850px]:gap-2.5 max-[850px]:border-r-0 max-[850px]:border-b max-[850px]:sticky max-[850px]:top-0 max-[850px]:z-[100]">
        <div className="px-5 mb-[30px] max-[850px]:hidden">
          <img src="/assets/images/logo.svg" alt="logo" className="h-[35px]" />
          <p className="text-ink-muted text-xs mt-[5px]">EzBac CMS v2.0</p>
        </div>
        {[
          { id: 'students', label: 'Students', icon: 'users' },
          { id: 'teachers', label: 'Teachers', icon: 'teacher' },
          { id: 'courses', label: 'Courses', icon: 'video' },
          { id: 'academic', label: 'Academic Structure', icon: 'library' },
          { id: 'add-quiz', label: 'Add Quiz', icon: 'quiz' },
          { id: 'add-flash', label: 'Add Flashcard', icon: 'cards' },
          { id: 'add-resource', label: 'Add Resource', icon: 'folder' },
          { id: 'view-data', label: 'View Data', icon: 'chart' },
          { id: 'migrations', label: 'Maintenance', icon: 'settings' }
        ].map((tabItem) => (
          <button
            key={tabItem.id}
            onClick={() => setTab(tabItem.id)}
            className={`${navBtnBase} flex items-center gap-2.5 ${tab === tabItem.id ? 'bg-primary-soft dark:bg-primary/15 text-primary-strong' : ''} max-[850px]:py-2.5 max-[850px]:px-[15px] max-[850px]:w-auto max-[850px]:whitespace-nowrap`}
          >
            <Icon name={tabItem.icon} className="w-[18px] h-[18px] shrink-0" />
            {tabItem.label}
          </button>
        ))}
        <hr className="w-full border-0 border-t border-border-soft my-5 max-[850px]:hidden" />
        {profile?.email && (
          <p className="px-5 text-[11px] text-ink-muted truncate max-[850px]:hidden" title={profile.email}>
            {profile.email}
          </p>
        )}
        <button onClick={() => navigate('/library')} className={`${navBtnBase} flex items-center gap-2.5 max-[850px]:py-2.5 max-[850px]:px-[15px] max-[850px]:w-auto max-[850px]:whitespace-nowrap`}>
          <Icon name="arrowLeft" className="w-[18px] h-[18px]" /> Exit Admin
        </button>
        <button onClick={handleSignOut} className={`${navBtnBase} flex items-center gap-2.5 max-[850px]:py-2.5 max-[850px]:px-[15px] max-[850px]:w-auto max-[850px]:whitespace-nowrap`}>
          <Icon name="lock" className="w-[18px] h-[18px]" /> Sign out
        </button>
      </aside>

      <main className="p-10 max-w-[1000px] mx-auto w-full max-[850px]:p-[15px]">
        {tab === 'students' && <AdminStudents showToast={showToast} />}
        {tab === 'teachers' && <AdminTeachers showToast={showToast} />}
        {tab === 'courses' && <AdminCourses showToast={showToast} />}
        {tab === 'academic' && <AdminAcademic showToast={showToast} />}
        {tab === 'migrations' && <AdminMigrations showToast={showToast} />}

        {tab === 'add-quiz' && (
          <section className="bg-surface p-10 rounded-[24px] shadow-[0_10px_30px_rgba(0,0,0,0.05)] mb-[30px] fade-in-anim max-[850px]:p-5 max-[850px]:rounded-xl">
            <h2>Add New Quiz {editing.type === 'quizzes' && <span className="text-sm text-primary-strong font-normal ml-2.5">— Editing Mode</span>}</h2>
            <form onSubmit={saveQuiz}>
              <div className="mb-6">
                <label className="block mb-2.5 font-semibold text-sm text-ink-muted">Subject</label>
                <input value={qSubject} onChange={(e) => setQSubject(e.target.value)} required placeholder="e.g. History, Math, SVT..." className="w-full p-3.5 border-2 border-border-card rounded-xl text-[15px] box-border focus:border-primary-strong focus:outline-none" />
              </div>
              <div className="mb-6">
                <label className="block mb-2.5 font-semibold text-sm text-ink-muted">BAC Stream(s)</label>
                <StreamMultiSelect value={qStreams} onChange={(v) => { setQStreams(v); setQSubjectId(''); setQUnitId('') }} />
              </div>
              <div className="mb-6">
                <SubjectUnitPicker stream={qStreams[0] || ''} subjectId={qSubjectId} unitId={qUnitId} onSubjectChange={setQSubjectId} onUnitChange={setQUnitId} />
              </div>

              {questions.map((q, i) => (
                <div key={i} className="border border-border-soft p-5 rounded-xl mb-5">
                  <div className="mb-6">
                    <label className="block mb-2.5 font-semibold text-sm text-ink-muted">Question {i + 1}</label>
                    <textarea required value={q.question} onChange={(e) => { const next = [...questions]; next[i].question = e.target.value; setQuestions(next) }} placeholder="Enter the question..." className="w-full p-3.5 border-2 border-border-card rounded-xl text-[15px] box-border" />
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[0, 1, 2, 3].map((j) => (
                      <div key={j} className="mb-6">
                        <label className="block mb-2.5 font-semibold text-sm text-ink-muted">Opt {j + 1}</label>
                        <input required type="text" value={q.options[j]} onChange={(e) => { const next = [...questions]; next[i].options[j] = e.target.value; setQuestions(next) }} className="w-full p-3.5 border-2 border-border-card rounded-xl text-[15px] box-border" />
                      </div>
                    ))}
                  </div>
                  <div className="mb-6">
                    <label className="block mb-2.5 font-semibold text-sm text-ink-muted">Correct Answer (Exact match)</label>
                    <input required type="text" value={q.correctAnswer} onChange={(e) => { const next = [...questions]; next[i].correctAnswer = e.target.value; setQuestions(next) }} className="w-full p-3.5 border-2 border-border-card rounded-xl text-[15px] box-border" />
                  </div>
                </div>
              ))}

              <button type="button" onClick={() => setQuestions([...questions, emptyQuestion()])} className="bg-surface-muted text-ink mb-5 p-3 rounded-[10px] font-semibold border-0 cursor-pointer w-full text-left">
                + Add Another Question
              </button>

              <button type="submit" className="bg-primary-strong text-white border-0 p-4 rounded-[14px] font-bold cursor-pointer w-full hover:bg-[#9a1418] hover:-translate-y-0.5">
                {editing.type === 'quizzes' ? 'Update Quiz Package' : 'Save Quiz Package'}
              </button>
            </form>
          </section>
        )}

        {tab === 'add-flash' && (
          <section className="bg-surface p-10 rounded-[24px] shadow-[0_10px_30px_rgba(0,0,0,0.05)] mb-[30px] fade-in-anim max-[850px]:p-5 max-[850px]:rounded-xl">
            <h2>Add New Flashcard {editing.type === 'flashcards' && <span className="text-sm text-primary-strong font-normal ml-2.5">— Editing Mode</span>}</h2>
            <form onSubmit={saveFlashcards}>
              <div className="mb-6">
                <label className="block mb-2.5 font-semibold text-sm text-ink-muted">Subject</label>
                <input required value={fSubject} onChange={(e) => setFSubject(e.target.value)} placeholder="e.g. Physics" className="w-full p-3.5 border-2 border-border-card rounded-xl text-[15px] box-border focus:border-primary-strong focus:outline-none" />
              </div>
              <div className="mb-6">
                <label className="block mb-2.5 font-semibold text-sm text-ink-muted">Deck / Set Title <span className="font-normal text-ink-muted">(optional — defaults to subject)</span></label>
                <input value={fSetTitle} onChange={(e) => setFSetTitle(e.target.value)} placeholder="e.g. Complex Numbers — Key Formulas" className="w-full p-3.5 border-2 border-border-card rounded-xl text-[15px] box-border focus:border-primary-strong focus:outline-none" />
                <p className="text-xs text-ink-muted mt-1.5">All cards saved together below become one deck students study and track together.</p>
              </div>
              <div className="mb-6">
                <label className="block mb-2.5 font-semibold text-sm text-ink-muted">BAC Stream(s)</label>
                <StreamMultiSelect value={fStreams} onChange={(v) => { setFStreams(v); setFSubjectId(''); setFUnitId('') }} />
              </div>
              <div className="mb-6">
                <SubjectUnitPicker stream={fStreams[0] || ''} subjectId={fSubjectId} unitId={fUnitId} onSubjectChange={setFSubjectId} onUnitChange={setFUnitId} />
              </div>
              {flashcards.map((fc, i) => (
                <div key={i} className="border border-border-soft p-5 rounded-xl mb-5">
                  <div className="mb-6">
                    <label className="block mb-2.5 font-semibold text-sm text-ink-muted">Front (Question)</label>
                    <input required type="text" value={fc.question} onChange={(e) => { const next = [...flashcards]; next[i].question = e.target.value; setFlashcards(next) }} className="w-full p-3.5 border-2 border-border-card rounded-xl text-[15px] box-border" />
                  </div>
                  <div className="mb-6">
                    <label className="block mb-2.5 font-semibold text-sm text-ink-muted">Back (Answer)</label>
                    <textarea required value={fc.answer} onChange={(e) => { const next = [...flashcards]; next[i].answer = e.target.value; setFlashcards(next) }} className="w-full p-3.5 border-2 border-border-card rounded-xl text-[15px] box-border" />
                  </div>
                </div>
              ))}
              {editing.type !== 'flashcards' && (
                <button type="button" onClick={() => setFlashcards([...flashcards, emptyFlash()])} className="bg-surface-muted text-ink mb-5 p-3 rounded-[10px] font-semibold border-0 cursor-pointer w-full text-left">
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
          <section className="bg-surface p-10 rounded-[24px] shadow-[0_10px_30px_rgba(0,0,0,0.05)] mb-[30px] fade-in-anim max-[850px]:p-5 max-[850px]:rounded-xl">
            <h2>Add New Resource {editing.type === 'resources' && <span className="text-sm text-primary-strong font-normal ml-2.5">— Editing Mode</span>}</h2>
            <form onSubmit={saveResource}>
              <div className="mb-6">
                <label className="block mb-2.5 font-semibold text-sm text-ink-muted">Subject</label>
                <input required value={resForm.subject} onChange={(e) => setResForm({ ...resForm, subject: e.target.value })} className="w-full p-3.5 border-2 border-border-card rounded-xl text-[15px] box-border" />
              </div>
              <div className="mb-6">
                <label className="block mb-2.5 font-semibold text-sm text-ink-muted">BAC Stream(s)</label>
                <StreamMultiSelect value={resForm.streams} onChange={(v) => setResForm((f) => ({ ...f, streams: v, subjectId: '', unitId: '' }))} />
              </div>
              <div className="mb-6">
                <SubjectUnitPicker
                  stream={resForm.streams[0] || ''}
                  subjectId={resForm.subjectId}
                  unitId={resForm.unitId}
                  onSubjectChange={(v) => setResForm((f) => ({ ...f, subjectId: v }))}
                  onUnitChange={(v) => setResForm((f) => ({ ...f, unitId: v }))}
                />
              </div>
              <div className="mb-6">
                <label className="block mb-2.5 font-semibold text-sm text-ink-muted">Title</label>
                <input required value={resForm.title} onChange={(e) => setResForm({ ...resForm, title: e.target.value })} className="w-full p-3.5 border-2 border-border-card rounded-xl text-[15px] box-border" />
              </div>
              <div className="mb-6">
                <label className="block mb-2.5 font-semibold text-sm text-ink-muted">Type</label>
                <select value={resForm.type} onChange={(e) => setResForm({ ...resForm, type: e.target.value })} className="w-full p-3.5 border-2 border-border-card rounded-xl text-[15px] box-border">
                  <option value="drive">📂 Google Drive</option>
                  <option value="youtube">🎥 YouTube Video</option>
                </select>
              </div>
              <div className="mb-6">
                <label className="block mb-2.5 font-semibold text-sm text-ink-muted">URL</label>
                <input required type="url" value={resForm.url} onChange={(e) => setResForm({ ...resForm, url: e.target.value })} placeholder="https://..." className="w-full p-3.5 border-2 border-border-card rounded-xl text-[15px] box-border" />
              </div>
              <button type="submit" className="bg-primary-strong text-white border-0 p-4 rounded-[14px] font-bold cursor-pointer w-full hover:bg-[#9a1418] hover:-translate-y-0.5">
                {editing.type === 'resources' ? 'Update Resource' : 'Save Resource'}
              </button>
            </form>
          </section>
        )}

        {tab === 'view-data' && (
          <section className="bg-surface p-10 rounded-[24px] shadow-[0_10px_30px_rgba(0,0,0,0.05)] mb-[30px] fade-in-anim max-[850px]:p-5 max-[850px]:rounded-xl">
            <h2>Live Content Monitor</h2>
            <div className="mb-5 flex gap-2 flex-wrap">
              <button onClick={() => fetchList('quizzes')} className="border-0 rounded-md py-2 px-3 cursor-pointer bg-surface-muted">Quiz Data</button>
              <button onClick={() => fetchList('flashcards')} className="border-0 rounded-md py-2 px-3 cursor-pointer bg-surface-muted">Flashcard Data</button>
              <button onClick={() => fetchList('resources')} className="border-0 rounded-md py-2 px-3 cursor-pointer bg-surface-muted">Resources</button>
            </div>
            <div>
              {dataList.loading && <p>Loading...</p>}
              {dataList.error && <p>{dataList.error}</p>}
              {!dataList.loading && !dataList.col && <p className="text-ink-muted">Select a category above to view items.</p>}
              {dataList.items.map((item) => {
                const summary = item.title
                  || (item.question ? (item.question.length > 30 ? item.question.slice(0, 30) : item.question) : null)
                  || (item.questions ? `Quiz: ${item.questions.length} questions` : 'No Title')
                const itemStreams = streamsOf(item)
                return (
                  <div key={item.id} className="flex justify-between items-center p-[15px] border-b border-border-soft max-[850px]:flex-col max-[850px]:items-start max-[850px]:gap-2.5">
                    <span>
                      <strong>[{item.subject}]</strong> {summary}
                      {itemStreams.length === 0 ? (
                        <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full bg-surface-muted text-ink-muted">🌐 All</span>
                      ) : itemStreams.map((id) => (
                        <span key={id} className="ml-2 text-[11px] px-2 py-0.5 rounded-full bg-surface-muted text-ink-muted">{streamLabel(id, 'ar')}</span>
                      ))}
                    </span>
                    <div className="flex gap-2.5 items-center">
                      <span onClick={() => startEdit(dataList.col, item)} className="text-ink cursor-pointer font-bold bg-surface-muted py-[5px] px-3 rounded-lg">Edit</span>
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
