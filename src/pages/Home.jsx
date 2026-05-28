import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs } from 'firebase/firestore'
import DashboardNavbar from '../components/DashboardNavbar.jsx'
import { db } from '../firebase.js'

export default function Home() {
  const navigate = useNavigate()
  const [flashcards, setFlashcards] = useState([])
  const [resources, setResources] = useState([])
  const [todos, setTodos] = useState(() => JSON.parse(localStorage.getItem('ezbac_todos') || '[]'))
  const [addOpen, setAddOpen] = useState(false)
  const [todoInput, setTodoInput] = useState('')
  const [timerDisplay, setTimerDisplay] = useState('45:00')
  const [timerRunning, setTimerRunning] = useState(localStorage.getItem('ezbac_timer_running') === 'true')
  const homeTimerRef = useRef(null)
  const flashScroll = useRef(null)
  const resScroll = useRef(null)

  useEffect(() => {
    async function load() {
      try {
        const flashSnap = await getDocs(collection(db, 'flashcards'))
        setFlashcards(flashSnap.docs.map((d) => ({ id: d.id, ...d.data() })))
        const resSnap = await getDocs(collection(db, 'resources'))
        setResources(resSnap.docs.map((d) => ({ id: d.id, ...d.data() })))
      } catch (e) {
        console.error('Dashboard Load Error:', e)
      }
    }
    load()
  }, [])

  useEffect(() => {
    localStorage.setItem('ezbac_todos', JSON.stringify(todos))
  }, [todos])

  useEffect(() => {
    function tick() {
      const savedEnd = localStorage.getItem('ezbac_timer_end')
      const running = localStorage.getItem('ezbac_timer_running') === 'true'
      const base = parseInt(localStorage.getItem('ezbac_timer_base_seconds') || 45 * 60)
      let seconds = base
      if (savedEnd && running) {
        const r = Math.round((parseInt(savedEnd) - Date.now()) / 1000)
        seconds = r > 0 ? r : base
        if (r <= 0) {
          localStorage.setItem('ezbac_timer_running', 'false')
          setTimerRunning(false)
        }
      }
      const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')
      const s = String(seconds % 60).padStart(2, '0')
      setTimerDisplay(`${m}:${s}`)
    }
    tick()
    homeTimerRef.current = setInterval(tick, 1000)
    return () => clearInterval(homeTimerRef.current)
  }, [])

  function togglePomodoro() {
    const isRunning = localStorage.getItem('ezbac_timer_running') === 'true'
    if (isRunning) {
      localStorage.setItem('ezbac_timer_running', 'false')
      const savedEnd = localStorage.getItem('ezbac_timer_end')
      const remaining = Math.round((parseInt(savedEnd) - Date.now()) / 1000)
      localStorage.setItem('ezbac_timer_base_seconds', remaining > 0 ? remaining : 45 * 60)
      localStorage.removeItem('ezbac_timer_end')
      setTimerRunning(false)
    } else {
      const base = parseInt(localStorage.getItem('ezbac_timer_base_seconds') || 45 * 60)
      localStorage.setItem('ezbac_timer_end', Date.now() + base * 1000)
      localStorage.setItem('ezbac_timer_running', 'true')
      setTimerRunning(true)
    }
  }

  function handleFilter(filter) {
    localStorage.setItem('courseFilter', filter)
    if (filter === 'resume') navigate('/library')
    else navigate('/games')
  }

  function handleCard(item, category) {
    const subject = item.subject || 'General'
    if (category === 'flashcard') {
      localStorage.setItem('selectedFlashSubject', subject)
      navigate('/flashcard')
    } else {
      navigate('/library')
    }
  }

  function addTodo() {
    if (!todoInput.trim()) return
    setTodos([
      ...todos,
      { text: todoInput.trim(), completed: false, date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) }
    ])
    setTodoInput('')
    setAddOpen(false)
  }

  function toggleTodo(i) { setTodos(todos.map((t, idx) => idx === i ? { ...t, completed: !t.completed } : t)) }
  function deleteTodo(i) { setTodos(todos.filter((_, idx) => idx !== i)) }

  function scrollBy(ref, amount) {
    if (!ref.current) return
    ref.current.scrollBy({ left: amount, behavior: 'smooth' })
  }

  function renderCard(item, category) {
    const subject = item.subject || 'General'
    const title = item.title || item.question || 'Untitled'
    return (
      <div
        key={item.id}
        onClick={() => handleCard(item, category)}
        className="course-card bg-white border border-border-soft rounded-[30px] p-5 flex flex-col min-h-[220px] relative cursor-pointer transition hover:-translate-y-1.5 hover:shadow-[0_15px_30px_rgba(0,0,0,0.06)]"
      >
        <div className="flex justify-center"><img src="/assets/icons/book.svg" alt="" className="h-10" /></div>
        <div className="flex gap-2 mt-[30px]">
          <span className="text-base text-primary-strong bg-primary-soft py-1 px-2.5 rounded-[20px] max-[480px]:text-[0.75rem]">{category}</span>
          <span className="text-base text-primary-strong bg-primary-soft py-1 px-2.5 rounded-[20px] max-[480px]:text-[0.75rem]">{subject}</span>
        </div>
        <h4 className="mt-5 text-ez-xl max-[480px]:text-[1.1rem]">{title}</h4>
        <div className="mt-auto flex justify-end"><img src="/assets/icons/save.svg" className="w-[15px] cursor-pointer hover:scale-125" alt="" /></div>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: 'Outfit, sans-serif' }}>
      <DashboardNavbar />

      <div className="mt-[100px] flex gap-5 p-[30px_26px] max-lg:flex-col max-md:mt-5 max-md:p-[16px_14px] max-[480px]:p-[12px_10px]">
        <div className="w-4/5 max-lg:w-full">
          <div className="gap-2">
            <h1 className="text-ez-4xl max-md:text-[1.8rem] max-[480px]:text-[1.5rem]">Welcome to EZBAC</h1>
            <p className="text-ez-base text-ink-muted max-md:text-[0.9rem]">Let's start your journey to an easier BAC!</p>
          </div>

          <div className="flex flex-wrap gap-2 justify-start mt-8 max-md:gap-1.5 max-md:mt-5">
            {[
              { f: 'resume', icon: '/assets/icons/resume.svg', label: 'Resumes' },
              { f: 'test', icon: '/assets/icons/tests.svg', label: 'Quiz' },
              { f: 'flashcard', icon: '/assets/icons/flashcards.svg', label: 'Flashcards' }
            ].map((b) => (
              <button
                key={b.f}
                onClick={() => handleFilter(b.f)}
                className="flex items-center gap-2 h-11 px-[25px] border border-border-soft rounded-[15px] bg-white cursor-pointer text-base text-ink hover:bg-[#f9f9f9] max-md:px-3.5 max-md:h-[38px] max-md:text-[0.85rem]"
              >
                <img src={b.icon} alt="" className="h-5" />
                <span>{b.label}</span>
              </button>
            ))}
          </div>

          <div className="mt-8 flex justify-between items-center">
            <h3 className="text-ez-2xl max-md:text-[1.3rem]">Continue Learning</h3>
            <div className="flex gap-2.5">
              <img src="/assets/icons/arrow-left.svg" onClick={() => scrollBy(flashScroll, -500)} className="w-5 cursor-pointer hover:scale-110" alt="" />
              <img src="/assets/icons/arrow-right.svg" onClick={() => scrollBy(flashScroll, 500)} className="w-5 cursor-pointer hover:scale-110" alt="" />
            </div>
          </div>
          <div>
            <div className="horizontal-courses" ref={flashScroll}>
              {flashcards.length === 0
                ? <p className="p-5 text-[#888] text-sm">No flashcards available yet.</p>
                : flashcards.slice(0, 6).map((f) => renderCard(f, 'flashcard'))}
            </div>
          </div>

          <div className="mt-8 flex justify-between items-center">
            <h3 className="text-ez-2xl max-md:text-[1.3rem]">Recently Viewed Resumes</h3>
            <div className="flex gap-2.5">
              <img src="/assets/icons/arrow-left.svg" onClick={() => scrollBy(resScroll, -500)} className="w-5 cursor-pointer hover:scale-110" alt="" />
              <img src="/assets/icons/arrow-right.svg" onClick={() => scrollBy(resScroll, 500)} className="w-5 cursor-pointer hover:scale-110" alt="" />
            </div>
          </div>
          <div>
            <div className="horizontal-courses" ref={resScroll}>
              {resources.length === 0
                ? <p className="p-5 text-[#888] text-sm">No resources available yet.</p>
                : resources.slice(0, 6).map((r) => renderCard(r, 'resource'))}
            </div>
          </div>
        </div>

        <div className="w-1/5 sticky top-[100px] self-start max-lg:w-full max-lg:static max-lg:order-[-1] max-lg:mb-5">
          <div className="mb-6 border border-border-light rounded-[24px] p-[23px] bg-white">
            <h4 className="text-ez-lg">Pomodoro</h4>
            <div className="mt-[110px] text-center max-md:mt-10">
              <h1 className="text-ez-4xl">{timerDisplay}</h1>
            </div>
            <div className="mt-[74px] flex justify-center gap-3.5 max-md:mt-[30px]">
              <button onClick={togglePomodoro} className="bg-primary-accent border-0 rounded-[38px] py-3 px-6 cursor-pointer flex items-center justify-center">
                <img src={timerRunning ? '/assets/icons/pause.svg' : '/assets/icons/play.svg'} className="w-[18px]" alt="play" />
              </button>
              <button onClick={() => navigate('/pomodoro')} className="bg-primary-glow border-0 rounded-[38px] py-3 px-6 cursor-pointer flex items-center justify-center">
                <img src="/assets/icons/more.svg" className="w-[18px]" alt="more" />
              </button>
            </div>
          </div>

          <div className="mb-6 border border-border-light rounded-[24px] p-[23px] bg-white">
            <div className="flex items-center justify-between">
              <h4 className="text-ez-lg">To-Do list</h4>
              <button onClick={() => setAddOpen(!addOpen)} className="p-2.5 rounded-[11px] bg-border-light border-0 cursor-pointer text-ez-2xl text-primary-dark hover:scale-105">+</button>
            </div>
            {addOpen && (
              <div className="mt-5">
                <input
                  autoFocus
                  type="text"
                  value={todoInput}
                  onChange={(e) => setTodoInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTodo()}
                  placeholder="Add a new task..."
                  className="w-full p-2.5 rounded-[10px] border border-border-light"
                />
              </div>
            )}
            <div className="mt-[42px] flex flex-col gap-[42px]">
              {todos.map((todo, i) => (
                <div key={i} className={`flex items-start gap-3 transition ${todo.completed ? 'opacity-60 translate-y-2.5' : ''}`}>
                  <div onClick={() => toggleTodo(i)} className="w-[30px] h-[30px] border border-border-light rounded-md cursor-pointer flex-shrink-0 flex items-center justify-center">
                    {todo.completed ? '✓' : ''}
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-ez-lg ${todo.completed ? 'line-through' : ''}`}>{todo.text}</h3>
                    <p className="text-ez-sm text-primary-accent">{todo.date || 'Today'}</p>
                  </div>
                  <div onClick={() => deleteTodo(i)} className="cursor-pointer text-lg">✕</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
