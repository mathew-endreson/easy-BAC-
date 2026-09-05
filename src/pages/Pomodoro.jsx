import { useEffect, useRef, useState } from 'react'
import DashboardNavbar from '../components/DashboardNavbar.jsx'
import { useLang } from '../contexts/LangContext.jsx'

const modes = [
  { time: '00:45:00', label: 'Focus', key: 'focus-timer' },
  { time: '00:15:00', label: 'Short Break', key: 'short-break' },
  { time: '00:35:00', label: 'Long Break', key: 'long-break' }
]

const RADIUS = 130
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const SESSIONS_KEY = 'ezbac_pomodoro_sessions'
const todayKey = () => new Date().toISOString().slice(0, 10)

function parseTime(str) {
  const parts = str.split(':').map(Number)
  return parts[0] * 3600 + parts[1] * 60 + parts[2]
}
function formatTime(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')
  const s = String(seconds % 60).padStart(2, '0')
  return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`
}
function loadSessions() {
  try {
    const data = JSON.parse(localStorage.getItem(SESSIONS_KEY) || '{}')
    return data[todayKey()] || 0
  } catch {
    return 0
  }
}

export default function Pomodoro() {
  const { t } = useLang()
  const [activeMode, setActiveMode] = useState(0)
  const [currentTime, setCurrentTime] = useState(45 * 60)
  const [preciseRemainingMs, setPreciseRemainingMs] = useState(45 * 60 * 1000)
  const [isRunning, setIsRunning] = useState(false)
  const [sessionsToday, setSessionsToday] = useState(loadSessions)
  const [todos, setTodos] = useState(() => JSON.parse(localStorage.getItem('ezbac_todos') || '[]'))
  const [todoInput, setTodoInput] = useState('')
  const rafRef = useRef(null)

  // Drives both the countdown text and the ring from the real wall-clock end
  // time on every animation frame, instead of a 1s setInterval + a CSS
  // transition guessing at the gap — that combination drifted visibly
  // whenever the interval callback fired a few ms early/late.
  function runLoop(endTime) {
    cancelAnimationFrame(rafRef.current)
    const tick = () => {
      const remainingMs = endTime - Date.now()
      if (remainingMs <= 0) {
        setPreciseRemainingMs(0)
        stopTimer(true)
        return
      }
      setPreciseRemainingMs(remainingMs)
      setCurrentTime(Math.ceil(remainingMs / 1000))
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  useEffect(() => {
    const savedEnd = localStorage.getItem('ezbac_timer_end')
    const savedRunning = localStorage.getItem('ezbac_timer_running') === 'true'
    if (savedEnd && savedRunning) {
      const endTime = parseInt(savedEnd)
      const remainingMs = endTime - Date.now()
      if (remainingMs > 0) {
        setIsRunning(true)
        runLoop(endTime)
      } else {
        localStorage.removeItem('ezbac_timer_end')
        localStorage.setItem('ezbac_timer_running', 'false')
        const base = parseInt(localStorage.getItem('ezbac_timer_base_seconds') || 45 * 60)
        setCurrentTime(base)
        setPreciseRemainingMs(base * 1000)
      }
    } else {
      const base = parseInt(localStorage.getItem('ezbac_timer_base_seconds') || 45 * 60)
      setCurrentTime(base)
      setPreciseRemainingMs(base * 1000)
    }
    return () => cancelAnimationFrame(rafRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    localStorage.setItem('ezbac_todos', JSON.stringify(todos))
  }, [todos])

  function recordSession() {
    try {
      const data = JSON.parse(localStorage.getItem(SESSIONS_KEY) || '{}')
      const key = todayKey()
      data[key] = (data[key] || 0) + 1
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(data))
      setSessionsToday(data[key])
    } catch {
      // ignore storage errors
    }
  }

  function startTimer(initialSeconds) {
    const endTime = Date.now() + initialSeconds * 1000
    localStorage.setItem('ezbac_timer_end', endTime)
    localStorage.setItem('ezbac_timer_running', 'true')
    setIsRunning(true)
    runLoop(endTime)
  }

  function stopTimer(finished = false) {
    cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    setIsRunning(false)
    localStorage.setItem('ezbac_timer_running', 'false')
    const baseDuration = parseTime(modes[activeMode].time)
    localStorage.setItem('ezbac_timer_base_seconds', finished ? baseDuration : currentTime)
    if (finished) {
      setCurrentTime(baseDuration)
      setPreciseRemainingMs(baseDuration * 1000)
      if (activeMode === 0) recordSession()
    }
  }

  function togglePlay() {
    if (isRunning) stopTimer()
    else startTimer(currentTime)
  }

  function reset() {
    stopTimer()
    const base = parseTime(modes[activeMode].time)
    setCurrentTime(base)
    setPreciseRemainingMs(base * 1000)
    localStorage.setItem('ezbac_timer_base_seconds', base)
  }

  function switchMode(i) {
    stopTimer()
    setActiveMode(i)
    const seconds = parseTime(modes[i].time)
    setCurrentTime(seconds)
    setPreciseRemainingMs(seconds * 1000)
    localStorage.setItem('ezbac_timer_base_seconds', seconds)
  }

  function addTodo() {
    if (!todoInput.trim()) return
    setTodos([...todos, { text: todoInput.trim(), completed: false, date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) }])
    setTodoInput('')
  }
  function toggleTodo(i) { setTodos(todos.map((td, idx) => idx === i ? { ...td, completed: !td.completed } : td)) }
  function deleteTodo(i) { setTodos(todos.filter((_, idx) => idx !== i)) }

  const total = parseTime(modes[activeMode].time)
  const progress = total > 0 ? preciseRemainingMs / (total * 1000) : 0
  const dashoffset = CIRCUMFERENCE * (1 - progress)
  const doneCount = todos.filter((td) => td.completed).length

  return (
    <div style={{ fontFamily: 'Outfit, sans-serif' }}>
      <DashboardNavbar />

      <div className="ez-container mt-[110px] max-md:mt-5 max-md:px-3.5 pb-16">
        <div className="mb-8">
          <h1 className="font-heading font-extrabold text-3xl max-md:text-2xl">Study Timer</h1>
          <p className="text-ink-muted mt-1">Stay focused with timed sessions and short breaks.</p>
        </div>

        <div className="flex gap-8 max-lg:flex-col">
          <div className="flex-1">
            <div className="border border-border-light rounded-[32px] bg-white p-10 flex flex-col items-center max-md:p-6">
              <div className="inline-flex bg-bg-card rounded-pill p-1.5 gap-1">
                {modes.map((m, i) => (
                  <button
                    key={m.label}
                    onClick={() => switchMode(i)}
                    className={`h-10 px-6 rounded-pill text-sm font-medium cursor-pointer transition max-md:px-3.5 max-md:text-xs ${
                      activeMode === i ? 'bg-primary text-white shadow-sm' : 'bg-transparent text-ink-muted hover:text-ink'
                    }`}
                  >
                    {t(m.key) === m.key ? m.label : t(m.key)}
                  </button>
                ))}
              </div>

              <div className="relative mt-10 mb-6 w-[280px] h-[280px] max-md:w-[220px] max-md:h-[220px]">
                <svg viewBox="0 0 280 280" className="-rotate-90 w-full h-full">
                  <circle cx="140" cy="140" r={RADIUS} fill="none" stroke="#F4F5FF" strokeWidth="16" />
                  <circle
                    cx="140" cy="140" r={RADIUS} fill="none" stroke="#AB1017" strokeWidth="16" strokeLinecap="round"
                    strokeDasharray={CIRCUMFERENCE} strokeDashoffset={dashoffset}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-body font-semibold text-primary-deep text-[52px] max-md:text-[38px] tabular-nums leading-none">
                    {formatTime(currentTime)}
                  </span>
                  <span className="text-ink-muted text-sm mt-2">{isRunning ? 'in progress' : 'paused'}</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={reset}
                  aria-label="Reset"
                  className="w-14 h-14 rounded-full border border-border-light bg-white cursor-pointer flex items-center justify-center hover:bg-[#f9f9f9] transition"
                >
                  <img src="/assets/icons/reset.svg" alt="" className="w-5 h-5" />
                </button>
                <button
                  onClick={togglePlay}
                  aria-label={isRunning ? 'Pause' : 'Play'}
                  className="w-20 h-20 rounded-full border-0 bg-primary text-white cursor-pointer flex items-center justify-center shadow-[0_10px_25px_rgba(171,16,23,0.35)] hover:shadow-[0_14px_30px_rgba(171,16,23,0.45)] hover:-translate-y-0.5 transition"
                >
                  <img src={isRunning ? '/assets/icons/pause.svg' : '/assets/icons/play.svg'} alt="" className="w-7 h-7 invert" />
                </button>
                <button
                  aria-label="Mute"
                  className="w-14 h-14 rounded-full border border-border-light bg-white cursor-pointer flex items-center justify-center hover:bg-[#f9f9f9] transition"
                >
                  <img src="/assets/icons/sound.svg" alt="" className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-2 mt-10">
                {Array.from({ length: Math.max(sessionsToday, 4) }).map((_, i) => (
                  <span key={i} className={`w-2.5 h-2.5 rounded-full ${i < sessionsToday ? 'bg-primary' : 'bg-border-light'}`} />
                ))}
              </div>
              <p className="text-sm text-ink-muted mt-3">
                {sessionsToday === 0 ? 'No focus sessions completed yet today' : `${sessionsToday} focus session${sessionsToday === 1 ? '' : 's'} completed today`}
              </p>
            </div>
          </div>

          <div className="flex-[0_0_360px] max-lg:flex-none max-lg:w-full">
            <div className="border border-border-light rounded-[32px] bg-white p-6">
              <div className="flex justify-between items-center">
                <h4 className="font-heading text-xl">{t('todo-list')}</h4>
                {todos.length > 0 && <span className="text-xs text-ink-muted">{doneCount}/{todos.length} done</span>}
              </div>

              <div className="flex gap-2.5 mt-5">
                <input
                  type="text"
                  value={todoInput}
                  onChange={(e) => setTodoInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTodo()}
                  placeholder={t('add-task')}
                  className="flex-1 h-12 rounded-2xl bg-bg-card px-4 outline-none font-body text-sm focus:ring-2 focus:ring-primary/30"
                />
                <button onClick={addTodo} className="w-12 h-12 rounded-2xl bg-primary border-0 cursor-pointer flex items-center justify-center hover:bg-primary-strong transition shrink-0">
                  <img src="/assets/icons/add.svg" alt="add" className="w-4 h-4 invert" />
                </button>
              </div>

              <div className="todo-list-scroll flex flex-col gap-2.5 mt-5 max-h-[420px]">
                {todos.length === 0 && (
                  <p className="text-sm text-ink-muted text-center py-10">Nothing on your list yet — add a task to get started.</p>
                )}
                {todos.map((todo, i) => (
                  <div key={i} className={`flex items-center gap-3 p-3.5 rounded-2xl border border-border-light transition hover:border-primary/40 ${todo.completed ? 'bg-[#FAFAFA]' : 'bg-white'}`}>
                    <button
                      onClick={() => toggleTodo(i)}
                      className={`w-6 h-6 shrink-0 rounded-md flex items-center justify-center cursor-pointer text-white text-xs font-bold transition ${todo.completed ? 'bg-primary' : 'border-2 border-border-card'}`}
                    >
                      {todo.completed ? '✓' : ''}
                    </button>
                    <div className={`flex-1 text-sm ${todo.completed ? 'line-through text-ink-muted' : 'text-ink'}`}>{todo.text}</div>
                    <button onClick={() => deleteTodo(i)} className="bg-transparent border-0 text-ink-muted text-base cursor-pointer hover:text-primary-strong shrink-0">✕</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
