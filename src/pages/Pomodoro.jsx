import { useEffect, useRef, useState } from 'react'
import DashboardNavbar from '../components/DashboardNavbar.jsx'
import { useLang } from '../contexts/LangContext.jsx'

const modes = [
  { time: '00:45:00', label: 'Focus', key: 'focus-timer' },
  { time: '00:15:00', label: 'Short Break', key: 'short-break' },
  { time: '00:35:00', label: 'Long Break', key: 'long-break' }
]

function parseTime(str) {
  const parts = str.split(':').map(Number)
  return parts[0] * 3600 + parts[1] * 60 + parts[2]
}
function formatTime(seconds) {
  const h = String(Math.floor(seconds / 3600)).padStart(2, '0')
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')
  const s = String(seconds % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
}

export default function Pomodoro() {
  const { t } = useLang()
  const [activeMode, setActiveMode] = useState(0)
  const [currentTime, setCurrentTime] = useState(45 * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [todos, setTodos] = useState(() => JSON.parse(localStorage.getItem('ezbac_todos') || '[]'))
  const [todoInput, setTodoInput] = useState('')
  const intervalRef = useRef(null)

  useEffect(() => {
    const savedEnd = localStorage.getItem('ezbac_timer_end')
    const savedRunning = localStorage.getItem('ezbac_timer_running') === 'true'
    if (savedEnd && savedRunning) {
      const remaining = Math.round((parseInt(savedEnd) - Date.now()) / 1000)
      if (remaining > 0) {
        setCurrentTime(remaining)
        startTimer(remaining)
      } else {
        localStorage.removeItem('ezbac_timer_end')
        localStorage.setItem('ezbac_timer_running', 'false')
      }
    } else {
      const base = parseInt(localStorage.getItem('ezbac_timer_base_seconds') || 45 * 60)
      setCurrentTime(base)
    }
    return () => clearInterval(intervalRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    localStorage.setItem('ezbac_todos', JSON.stringify(todos))
  }, [todos])

  function startTimer(initial) {
    const endTime = Date.now() + initial * 1000
    localStorage.setItem('ezbac_timer_end', endTime)
    localStorage.setItem('ezbac_timer_running', 'true')
    setIsRunning(true)
    clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      const remaining = Math.round((parseInt(localStorage.getItem('ezbac_timer_end')) - Date.now()) / 1000)
      if (remaining > 0) setCurrentTime(remaining)
      else stopTimer(true)
    }, 1000)
  }

  function stopTimer(finished = false) {
    clearInterval(intervalRef.current)
    intervalRef.current = null
    setIsRunning(false)
    localStorage.setItem('ezbac_timer_running', 'false')
    const baseDuration = parseTime(modes[activeMode].time)
    localStorage.setItem('ezbac_timer_base_seconds', finished ? baseDuration : currentTime)
    if (finished) {
      setCurrentTime(baseDuration)
      alert("Time's up! Great job!")
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
    localStorage.setItem('ezbac_timer_base_seconds', base)
  }

  function switchMode(i) {
    stopTimer()
    setActiveMode(i)
    const seconds = parseTime(modes[i].time)
    setCurrentTime(seconds)
    localStorage.setItem('ezbac_timer_base_seconds', seconds)
  }

  function addTodo() {
    if (!todoInput.trim()) return
    setTodos([...todos, { text: todoInput.trim(), completed: false, date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) }])
    setTodoInput('')
  }
  function toggleTodo(i) { setTodos(todos.map((t, idx) => idx === i ? { ...t, completed: !t.completed } : t)) }
  function deleteTodo(i) { setTodos(todos.filter((_, idx) => idx !== i)) }

  return (
    <>
      <DashboardNavbar />

      <div className="mt-[100px] flex p-6 gap-6 max-lg:flex-col max-md:mt-5 max-md:p-3.5">
        <div className="flex-1 max-lg:order-[-1] max-lg:w-full">
          <div className="relative w-full h-full border border-border-soft rounded-[51px] p-10 flex flex-col items-center justify-start overflow-hidden max-md:p-5 max-md:rounded-3xl">
            <img src="/assets/images/timerBG.svg" className="w-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-50 pointer-events-none z-0" alt="" />

            <div className="relative z-10 w-full flex justify-between items-center">
              <h4>{t(modes[activeMode].key)}</h4>
              <div className="flex items-center gap-4">
                <button className="w-[43px] h-[43px] bg-primary-soft border-0 rounded-full p-2.5 cursor-pointer">
                  <img src="/assets/icons/sound.svg" alt="sound" />
                </button>
                <img src="/assets/icons/edit.svg" className="w-[30px] h-[30px] cursor-pointer" alt="edit" />
              </div>
            </div>

            <div className="relative z-10 flex gap-4 mt-[156px] max-md:mt-10 max-md:flex-wrap max-md:justify-center max-md:gap-2">
              {modes.map((m, i) => (
                <button
                  key={m.label}
                  onClick={() => switchMode(i)}
                  className={`h-9 px-14 rounded-[13px] cursor-pointer max-md:px-5 max-md:text-[0.8rem] max-md:h-[34px] max-[480px]:px-3.5 max-[480px]:text-[0.75rem] ${
                    activeMode === i ? 'bg-primary-strong text-white border-0' : 'border border-primary-deep bg-transparent text-primary-deep'
                  }`}
                >
                  {t(m.key) === m.key ? m.label : t(m.key)}
                </button>
              ))}
            </div>

            <div className="relative z-10 mt-6 text-[120px] font-body text-primary-deep text-center max-md:text-[56px] max-[480px]:text-[44px]">
              {formatTime(currentTime)}
            </div>

            <div className="relative z-10 mt-6 flex gap-4 max-md:mt-5">
              <button onClick={togglePlay} className={`h-[38px] px-[25px] border-0 rounded-[20px] cursor-pointer ${isRunning ? 'bg-[#ffc1c5]' : 'bg-primary-accent'}`}>
                <img src={isRunning ? '/assets/icons/pause.svg' : '/assets/icons/play.svg'} alt="play" />
              </button>
              <button onClick={reset} className="h-[38px] px-[25px] border border-primary-deep bg-transparent rounded-[20px] cursor-pointer">
                <img src="/assets/icons/reset.svg" alt="reset" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-[0_0_30%] max-lg:w-full max-lg:mt-6">
          <div className="w-full bg-white border border-border-card p-4 max-md:rounded-2xl max-md:p-3.5">
            <div className="flex justify-between items-center">
              <h4 className="text-primary-deep">{t('todo-list')}</h4>
            </div>

            <div className="flex gap-2.5 mt-5">
              <input
                type="text"
                value={todoInput}
                onChange={(e) => setTodoInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTodo()}
                placeholder={t('add-task')}
                className="flex-1 h-[47px] rounded-xl border border-border-card px-4 outline-none font-body focus:border-primary"
              />
              <button onClick={addTodo} className="w-[47px] h-[47px] rounded-xl bg-primary-soft border-0 cursor-pointer flex items-center justify-center hover:bg-primary [&:hover>img]:invert">
                <img src="/assets/icons/add.svg" alt="add" />
              </button>
            </div>

            <hr className="my-[17px]" />

            <div className="todo-list-scroll flex flex-col gap-3">
              {todos.map((todo, i) => (
                <div key={i} className={`flex items-center gap-[15px] p-4 bg-white border border-border-card rounded-[15px] transition hover:border-primary hover:translate-x-1.5 ${todo.completed ? 'bg-[#F8F9FA] opacity-70' : ''}`}>
                  <div onClick={() => toggleTodo(i)} className={`w-6 h-6 border-2 rounded-md flex items-center justify-center cursor-pointer text-white font-bold ${todo.completed ? 'bg-primary border-primary' : 'border-border-card'}`}>
                    {todo.completed ? '✓' : ''}
                  </div>
                  <div className={`flex-1 text-[15px] ${todo.completed ? 'line-through text-[#94A3B8]' : 'text-ink'}`}>{todo.text}</div>
                  <button onClick={() => deleteTodo(i)} className="bg-transparent border-0 text-border-card text-lg cursor-pointer hover:text-primary">✕</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
