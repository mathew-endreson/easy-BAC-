import { useState } from 'react'
import DashboardNavbar from '../components/DashboardNavbar.jsx'
import { useLang } from '../contexts/LangContext.jsx'
import { usePomodoro, formatDuration } from '../contexts/PomodoroContext.jsx'
import { useTodos } from '../contexts/TodoContext.jsx'

// Full Pomodoro page. All timer + todo state now comes from the global
// PomodoroProvider / TodoProvider, so it stays in sync with the floating widget
// and survives navigation, refresh, language and theme changes.
export default function Pomodoro() {
  const { t } = useLang()
  const { mode, setMode, remaining, isRunning, toggle, reset, modes, setMuted: setPomoMuted } = usePomodoro()
  const { tasks, addTask, toggleTask, deleteTask, loading } = useTodos()
  const [todoInput, setTodoInput] = useState('')
  const [muted, setMuted] = useState(false)

  function submitTodo() {
    if (!todoInput.trim()) return
    addTask(todoInput)
    setTodoInput('')
  }

  function toggleMute() {
    const next = !muted
    setMuted(next)
    setPomoMuted(next)
  }

  return (
    <>
      <DashboardNavbar />

      <div className="mt-[100px] flex p-6 gap-6 max-lg:flex-col max-md:mt-5 max-md:p-3.5">
        <div className="flex-1 max-lg:order-[-1] max-lg:w-full">
          <div className="relative w-full h-full border border-border-soft rounded-[51px] p-10 flex flex-col items-center justify-start overflow-hidden bg-surface max-md:p-5 max-md:rounded-3xl">
            <img src="/assets/images/timerBG.svg" className="w-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-50 pointer-events-none z-0 dark:opacity-20" alt="" />

            <div className="relative z-10 w-full flex justify-between items-center">
              <h4>{t(modes.find((m) => m.id === mode)?.key || 'focus-timer')}</h4>
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleMute}
                  aria-pressed={muted}
                  title={muted ? 'Unmute' : 'Mute'}
                  className={`w-[43px] h-[43px] border-0 rounded-full p-2.5 cursor-pointer ${muted ? 'bg-surface-muted opacity-60' : 'bg-primary-soft'}`}
                >
                  <img src="/assets/icons/sound.svg" alt="sound" />
                </button>
              </div>
            </div>

            <div className="relative z-10 flex gap-4 mt-[156px] max-md:mt-10 max-md:flex-wrap max-md:justify-center max-md:gap-2">
              {modes.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`h-9 px-14 rounded-[13px] cursor-pointer max-md:px-5 max-md:text-[0.8rem] max-md:h-[34px] max-[480px]:px-3.5 max-[480px]:text-[0.75rem] ${
                    mode === m.id ? 'bg-primary-strong text-white border-0' : 'border border-primary-deep dark:border-border-card bg-transparent text-primary-deep dark:text-ink'
                  }`}
                >
                  {t(m.key)}
                </button>
              ))}
            </div>

            <div className="relative z-10 mt-6 text-[120px] font-body text-primary-deep dark:text-primary-glow text-center tabular-nums max-md:text-[56px] max-[480px]:text-[44px]">
              {formatDuration(remaining)}
            </div>

            <div className="relative z-10 mt-6 flex gap-4 max-md:mt-5">
              <button onClick={toggle} className={`h-[38px] px-[25px] border-0 rounded-[20px] cursor-pointer ${isRunning ? 'bg-[#ffc1c5]' : 'bg-primary-accent'}`}>
                <img src={isRunning ? '/assets/icons/pause.svg' : '/assets/icons/play.svg'} alt={isRunning ? 'pause' : 'play'} />
              </button>
              <button onClick={reset} className="h-[38px] px-[25px] border border-primary-deep dark:border-border-card bg-transparent rounded-[20px] cursor-pointer">
                <img src="/assets/icons/reset.svg" alt="reset" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-[0_0_30%] max-lg:w-full max-lg:mt-6">
          <div className="w-full bg-surface border border-border-card rounded-2xl p-4 max-md:p-3.5">
            <div className="flex justify-between items-center">
              <h4 className="text-primary-deep dark:text-primary-glow">{t('todo-list')}</h4>
            </div>

            <div className="flex gap-2.5 mt-5">
              <input
                type="text"
                value={todoInput}
                onChange={(e) => setTodoInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitTodo()}
                placeholder={t('add-task')}
                className="flex-1 h-[47px] rounded-xl border border-border-card bg-surface text-ink px-4 outline-none font-body focus:border-primary"
              />
              <button onClick={submitTodo} className="w-[47px] h-[47px] rounded-xl bg-primary-soft border-0 cursor-pointer flex items-center justify-center hover:bg-primary [&:hover>img]:invert">
                <img src="/assets/icons/add.svg" alt="add" />
              </button>
            </div>

            <hr className="my-[17px]" />

            <div className="todo-list-scroll flex flex-col gap-3">
              {loading ? (
                <p className="text-ink-muted text-sm text-center py-4">{t('loading')}</p>
              ) : tasks.length === 0 ? (
                <p className="text-ink-muted text-sm text-center py-4">{t('add-task')}</p>
              ) : (
                tasks.map((todo) => (
                  <div key={todo.id} className={`flex items-center gap-[15px] p-4 bg-surface border border-border-card rounded-[15px] transition hover:border-primary hover:translate-x-1.5 ${todo.completed ? 'bg-surface-muted opacity-70' : ''}`}>
                    <div onClick={() => toggleTask(todo)} className={`w-6 h-6 border-2 rounded-md flex items-center justify-center cursor-pointer text-white font-bold ${todo.completed ? 'bg-primary border-primary' : 'border-border-card'}`}>
                      {todo.completed ? '✓' : ''}
                    </div>
                    <div className={`flex-1 text-[15px] ${todo.completed ? 'line-through text-ink-muted' : 'text-ink'}`}>{todo.text}</div>
                    <button onClick={() => deleteTask(todo)} className="bg-transparent border-0 text-border-card text-lg cursor-pointer hover:text-primary">✕</button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
