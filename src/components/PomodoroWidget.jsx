import { useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { usePomodoro, formatDuration } from '../contexts/PomodoroContext.jsx'
import { useTodos } from '../contexts/TodoContext.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useLang } from '../contexts/LangContext.jsx'
import Icon from './ui/Icon.jsx'

// Persistent compact Pomodoro + To-Do control. Rendered once, OUTSIDE <Routes>,
// so both survive every navigation exactly like the timer already did. Hidden
// for guests and on non-student surfaces (landing/auth/onboarding/admin) and on
// the full Pomodoro page itself (which already shows both in full).
const HIDE_EXACT = ['/', '/login', '/register', '/onboarding']

export default function PomodoroWidget() {
  const { isAuthenticated, profileComplete } = useAuth()
  const { pathname } = useLocation()
  const { t } = useLang()
  const { remaining, isRunning, toggle, reset, setMode, mode, modes, progress, completedSessions } = usePomodoro()
  const { tasks, pending, addTask, toggleTask, deleteTask } = useTodos()
  const [panel, setPanel] = useState(null) // null | 'pomodoro' | 'todo'
  const [todoInput, setTodoInput] = useState('')

  if (!isAuthenticated || !profileComplete) return null
  if (HIDE_EXACT.includes(pathname) || pathname.startsWith('/admin') || pathname.startsWith('/pomodoro')) return null

  const ring = `conic-gradient(var(--tw-ring-color, #AB1017) ${Math.round(progress * 360)}deg, transparent 0deg)`

  function submitTodo() {
    if (!todoInput.trim()) return
    addTask(todoInput)
    setTodoInput('')
  }

  return (
    <div className="fixed bottom-4 end-4 max-md:bottom-[84px] z-[1200]">
      {panel === 'pomodoro' && (
        <div className="mb-3 w-64 rounded-2xl border border-border-soft bg-surface shadow-xl shadow-black/20 p-4 text-ink">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold">{t('pomodoro')}</span>
            <button onClick={() => setPanel(null)} aria-label={t('close')} className="w-8 h-8 flex items-center justify-center -me-1 rounded-full text-ink-muted hover:text-ink hover:bg-surface-muted transition-colors">
              <Icon name="close" className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-1.5 mb-4">
            {modes.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`flex-1 px-1 py-1.5 rounded-lg text-[11px] font-medium transition-colors
                            ${mode === m.id ? 'bg-primary text-white' : 'bg-surface-muted text-ink-muted hover:text-ink'}`}
              >
                {t(m.key)}
              </button>
            ))}
          </div>
          <div className="text-center text-4xl font-heading font-bold tabular-nums mb-4">{formatDuration(remaining)}</div>
          <div className="flex items-center justify-center gap-3">
            <button onClick={toggle}
              className="flex items-center justify-center w-11 h-11 rounded-full bg-primary text-white hover:bg-primary-strong transition-colors">
              <Icon name={isRunning ? 'pause' : 'play'} className="w-4 h-4" />
            </button>
            <button onClick={reset} aria-label="reset"
              className="flex items-center justify-center w-11 h-11 rounded-full bg-surface-muted text-ink border border-border-soft hover:bg-bg-card transition-colors">
              <Icon name="refresh" className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-ink-muted">
            <span>✓ {completedSessions}</span>
            <Link to="/pomodoro" className="hover:text-primary transition-colors no-underline">{t('focus-timer')} →</Link>
          </div>
        </div>
      )}

      {panel === 'todo' && (
        <div className="mb-3 w-72 rounded-2xl border border-border-soft bg-surface shadow-xl shadow-black/20 p-4 text-ink">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold">{t('todo-list')}</span>
            <button onClick={() => setPanel(null)} aria-label={t('close')} className="w-8 h-8 flex items-center justify-center -me-1 rounded-full text-ink-muted hover:text-ink hover:bg-surface-muted transition-colors">
              <Icon name="close" className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={todoInput}
              onChange={(e) => setTodoInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitTodo()}
              placeholder={t('add-task')}
              className="flex-1 h-9 px-3 rounded-lg border border-border-card bg-surface text-ink text-sm outline-none focus:border-primary"
            />
            <button onClick={submitTodo} aria-label={t('add-task')}
              className="w-9 h-9 shrink-0 rounded-lg bg-primary text-white flex items-center justify-center hover:bg-primary-strong transition-colors">
              <Icon name="plus" className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto no-scrollbar">
            {tasks.length === 0 ? (
              <p className="text-xs text-ink-muted text-center py-4">{t('add-task')}</p>
            ) : (
              tasks.map((task) => (
                <div key={task.id} className="flex items-center gap-2 group">
                  <button
                    onClick={() => toggleTask(task)}
                    aria-label={task.completed ? 'mark incomplete' : 'mark complete'}
                    className={`w-5 h-5 shrink-0 rounded-md border flex items-center justify-center text-[11px] font-bold transition-colors
                                ${task.completed ? 'bg-primary border-primary text-white' : 'border-border-card text-transparent'}`}
                  >
                    ✓
                  </button>
                  <span className={`flex-1 min-w-0 text-sm truncate ${task.completed ? 'line-through text-ink-muted' : 'text-ink'}`}>
                    {task.text}
                  </span>
                  <button onClick={() => deleteTask(task)} aria-label="delete"
                    className="w-7 h-7 flex items-center justify-center text-ink-muted hover:text-primary opacity-0 group-hover:opacity-100 max-md:opacity-100 transition-opacity shrink-0">
                    <Icon name="close" className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-ink-muted">
            <span>{pending.length} pending</span>
            <Link to="/pomodoro" className="hover:text-primary transition-colors no-underline">{t('todo-list')} →</Link>
          </div>
        </div>
      )}

      {/* Collapsed pill */}
      <div className="flex items-center gap-1.5 rounded-full border border-border-soft bg-surface shadow-lg shadow-black/20 ps-2 pe-1.5 py-1.5 text-ink">
        <button onClick={() => setPanel((p) => p === 'pomodoro' ? null : 'pomodoro')} className="flex items-center gap-2 min-h-10" aria-label={t('pomodoro')} title={t('pomodoro')}>
          <span className="relative flex items-center justify-center w-9 h-9 rounded-full shrink-0" style={{ background: ring }}>
            <span className="absolute inset-[3px] rounded-full bg-surface" />
            <span className="relative text-base leading-none">🍅</span>
          </span>
          <span className="text-sm font-semibold tabular-nums pe-1">{formatDuration(remaining)}</span>
        </button>
        <button onClick={toggle} aria-label={isRunning ? 'pause' : 'play'}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white hover:bg-primary-strong transition-colors shrink-0">
          <Icon name={isRunning ? 'pause' : 'play'} className="w-4 h-4" />
        </button>
        <button
          onClick={() => setPanel((p) => p === 'todo' ? null : 'todo')}
          aria-label={t('todo-list')} title={t('todo-list')}
          className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-colors shrink-0
                      ${panel === 'todo' ? 'bg-primary-soft text-primary-strong dark:bg-primary/15 dark:text-primary-glow' : 'text-ink-muted hover:text-ink hover:bg-surface-muted'}`}
        >
          <Icon name="checklist" className="w-4 h-4" />
          {pending.length > 0 && (
            <span className="absolute -top-0.5 -end-0.5 min-w-[14px] h-[14px] px-[3px] rounded-full bg-primary text-white text-[9px] font-bold leading-[14px] text-center">
              {pending.length > 9 ? '9+' : pending.length}
            </span>
          )}
        </button>
      </div>
    </div>
  )
}
