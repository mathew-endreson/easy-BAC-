import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'

// Global Pomodoro timer. State lives here (not in any page), so the timer keeps
// running across route changes, component unmounts, language switches and theme
// switches, and recovers exactly after a refresh. Remaining time is always
// derived from an `endsAt` timestamp (never a blindly-decremented counter), so
// there is no drift and a reload restores the correct time.
//
// Durations preserve the app's existing modes (Focus 45m / Short 15m / Long 35m).

export const POMODORO_MODES = [
  { id: 'focus', key: 'focus-timer', label: 'Focus', seconds: 45 * 60 },
  { id: 'short', key: 'short-break', label: 'Short Break', seconds: 15 * 60 },
  { id: 'long', key: 'long-break', label: 'Long Break', seconds: 35 * 60 }
]
const DURATIONS = Object.fromEntries(POMODORO_MODES.map((m) => [m.id, m.seconds]))
const KEY = 'ezbac_pomodoro'

const PomodoroContext = createContext(null)

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

// Short completion chime via Web Audio (no asset needed). Best-effort.
function playChime() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.type = 'sine'; osc.frequency.value = 880
    gain.gain.setValueAtTime(0.0001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.9)
    osc.start(); osc.stop(ctx.currentTime + 0.95)
    osc.onended = () => ctx.close()
  } catch {
    /* audio not available */
  }
}

function initState() {
  const s = load()
  const mode = s?.mode && DURATIONS[s.mode] != null ? s.mode : 'focus'
  let completedSessions = s?.completedSessions || 0
  if (s?.isRunning && s?.endsAt) {
    const r = Math.round((s.endsAt - Date.now()) / 1000)
    if (r > 0) return { mode, isRunning: true, endsAt: s.endsAt, remaining: r, completedSessions }
    // Timer finished while the app was closed.
    if (mode === 'focus') completedSessions += 1
    return { mode, isRunning: false, endsAt: null, remaining: DURATIONS[mode], completedSessions }
  }
  return {
    mode,
    isRunning: false,
    endsAt: null,
    remaining: s?.remaining != null ? s.remaining : DURATIONS[mode],
    completedSessions
  }
}

export function PomodoroProvider({ children }) {
  const [state, setState] = useState(initState)
  const muteRef = useRef(false)

  // Persist every change so a refresh recovers exactly.
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* ignore */ }
  }, [state])

  // Tick only while running; recompute from endsAt (drift-free) and handle
  // completion. 250ms cadence keeps the display smooth; nothing is written to
  // Firestore here.
  useEffect(() => {
    if (!state.isRunning || !state.endsAt) return
    const endsAt = state.endsAt
    const mode = state.mode
    const id = setInterval(() => {
      const r = Math.round((endsAt - Date.now()) / 1000)
      if (r > 0) {
        setState((prev) => (prev.isRunning ? { ...prev, remaining: r } : prev))
      } else {
        clearInterval(id)
        if (!muteRef.current) playChime()
        setState((prev) => ({
          ...prev,
          isRunning: false,
          endsAt: null,
          remaining: DURATIONS[prev.mode],
          completedSessions: prev.completedSessions + (mode === 'focus' ? 1 : 0)
        }))
      }
    }, 250)
    return () => clearInterval(id)
  }, [state.isRunning, state.endsAt, state.mode])

  const start = useCallback(() => {
    setState((prev) => {
      if (prev.isRunning) return prev
      const secs = prev.remaining > 0 ? prev.remaining : DURATIONS[prev.mode]
      return { ...prev, isRunning: true, endsAt: Date.now() + secs * 1000, remaining: secs }
    })
  }, [])

  const pause = useCallback(() => {
    setState((prev) => {
      if (!prev.isRunning) return prev
      const r = prev.endsAt ? Math.max(0, Math.round((prev.endsAt - Date.now()) / 1000)) : prev.remaining
      return { ...prev, isRunning: false, endsAt: null, remaining: r }
    })
  }, [])

  const toggle = useCallback(() => {
    setState((prev) => {
      if (prev.isRunning) {
        const r = prev.endsAt ? Math.max(0, Math.round((prev.endsAt - Date.now()) / 1000)) : prev.remaining
        return { ...prev, isRunning: false, endsAt: null, remaining: r }
      }
      const secs = prev.remaining > 0 ? prev.remaining : DURATIONS[prev.mode]
      return { ...prev, isRunning: true, endsAt: Date.now() + secs * 1000, remaining: secs }
    })
  }, [])

  const reset = useCallback(() => {
    setState((prev) => ({ ...prev, isRunning: false, endsAt: null, remaining: DURATIONS[prev.mode] }))
  }, [])

  const setMode = useCallback((modeId) => {
    if (DURATIONS[modeId] == null) return
    setState((prev) => ({ ...prev, mode: modeId, isRunning: false, endsAt: null, remaining: DURATIONS[modeId] }))
  }, [])

  const duration = DURATIONS[state.mode]
  const value = {
    ...state,
    duration,
    modes: POMODORO_MODES,
    progress: duration > 0 ? 1 - state.remaining / duration : 0,
    start,
    pause,
    toggle,
    reset,
    setMode,
    setMuted: (m) => { muteRef.current = m }
  }

  return <PomodoroContext.Provider value={value}>{children}</PomodoroContext.Provider>
}

// mm:ss, or h:mm:ss when an hour or more.
export function formatDuration(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(sec).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

export function usePomodoro() {
  const ctx = useContext(PomodoroContext)
  if (!ctx) throw new Error('usePomodoro must be used within <PomodoroProvider>')
  return ctx
}
