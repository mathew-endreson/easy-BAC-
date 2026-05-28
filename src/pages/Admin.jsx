import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase.js'

const emptyQuestion = () => ({ question: '', options: ['', '', '', ''], correctAnswer: '' })
const emptyFlash = () => ({ question: '', answer: '' })

export default function Admin() {
  const navigate = useNavigate()
  const [authed, setAuthed] = useState(false)
  const [pass, setPass] = useState('')
  const [tab, setTab] = useState('add-quiz')
  const [toast, setToast] = useState('')

  // Quiz form
  const [qSubject, setQSubject] = useState('')
  const [questions, setQuestions] = useState([emptyQuestion()])

  // Flashcard form
  const [fSubject, setFSubject] = useState('')
  const [flashcards, setFlashcards] = useState([emptyFlash()])

  // Resource form
  const [resForm, setResForm] = useState({ subject: '', title: '', type: 'drive', url: '' })

  // Edit state
  const [editing, setEditing] = useState({ id: null, type: null })

  // Data list
  const [dataList, setDataList] = useState({ col: null, items: [], loading: false, error: '' })

  function checkAuth() {
    if (pass === 'admin123') setAuthed(true)
    else alert('Incorrect Password!')
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

  async function saveResource(e) {
    e.preventDefault()
    if (!resForm.url.startsWith('http')) return alert('Please enter a valid URL')
    try {
      if (editing.type === 'resources' && editing.id) {
        await updateDoc(doc(db, 'resources', editing.id), resForm)
        showToast('Resource Updated!')
      } else {
        await addDoc(collection(db, 'resources'), resForm)
        showToast('Resource Saved!')
      }
      setResForm({ subject: '', title: '', type: 'drive', url: '' })
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
      setResForm({ subject: item.subject || '', title: item.title || '', type: item.type || 'drive', url: item.url || '' })
    }
  }

  if (!authed) {
    return (
      <div className="fixed inset-0 bg-white z-[9999] flex items-center justify-center flex-col" style={{ fontFamily: 'Outfit, sans-serif' }}>
        <div className="bg-white p-10 rounded-[24px] shadow-[0_10px_30px_rgba(0,0,0,0.05)] text-center w-80">
          <img src="/assets/images/logo.svg" alt="logo" className="h-10 mb-5 mx-auto" />
          <h2>Admin Login</h2>
          <input
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && checkAuth()}
            placeholder="Enter Password"
            className="w-full p-[15px] my-5 border-2 border-[#eee] rounded-xl text-base box-border"
          />
          <button onClick={checkAuth} className="bg-primary-strong text-white border-0 p-4 rounded-[14px] font-bold cursor-pointer w-full hover:bg-[#9a1418] hover:-translate-y-0.5">
            Access Portal
          </button>
        </div>
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
        <button onClick={() => navigate('/home')} className={`${navBtnBase} max-[850px]:py-2.5 max-[850px]:px-[15px] max-[850px]:w-auto max-[850px]:whitespace-nowrap`}>
          ⬅ Exit Admin
        </button>
      </aside>

      <main className="p-10 max-w-[1000px] mx-auto w-full max-[850px]:p-[15px]">
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
              <button type="submit" className="bg-primary-strong text-white border-0 p-4 rounded-[14px] font-bold cursor-pointer w-full hover:bg-[#9a1418] hover:-translate-y-0.5">
                {editing.type === 'resources' ? 'Update Resource' : 'Save Resource'}
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
