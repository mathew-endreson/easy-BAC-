import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'

// Global Pomodoro timer. State lives here (not in any page), so the timer keeps
// running across route changes, component unmounts, language switches and theme
// switches, and recovers exactly after a refresh. Remaining time is always
// derived from an `endsAt` timestamp (never a blindly-decremented counter), so
// there is no drift and a reload restores the correct time.
//
// Durations preserve the app's existing modes (Focus 45m / Short 15m / Long 35m).
// Sound/volume/mute are persisted in the same localStorage-backed state object
// as the timer itself — previously `muted` lived in page-local component state
// forwarding into an in-memory ref, so it silently reset to unmuted on every
// navigation/reload; it's now a real, persisted preference like the rest.

export const POMODORO_MODES = [
  { id: 'focus', key: 'focus-timer', label: 'Focus', seconds: 45 * 60 },
  { id: 'short', key: 'short-break', label: 'Short Break', seconds: 15 * 60 },
  { id: 'long', key: 'long-break', label: 'Long Break', seconds: 35 * 60 }
]
const DURATIONS = Object.fromEntries(POMODORO_MODES.map((m) => [m.id, m.seconds]))
const KEY = 'ezbac_pomodoro'

export const SOUND_PRESETS = [
  { id: 'chime', labelKey: 'sound-chime' },
  { id: 'bell', labelKey: 'sound-bell' },
  { id: 'digital', labelKey: 'sound-digital' },
  { id: 'soft', labelKey: 'sound-soft' }
]
const DEFAULT_SOUND = 'chime'

const PomodoroContext = createContext(null)

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

// One short tone via Web Audio (no asset needed).
function tone(ctx, master, { freq, type = 'sine', start = 0, duration = 0.9, peak = 1 }) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain); gain.connect(master)
  osc.type = type
  osc.frequency.value = freq
  const t0 = ctx.currentTime + start
  gain.gain.setValueAtTime(0.0001, t0)
  gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
  osc.start(t0)
  osc.stop(t0 + duration + 0.05)
}

// Every preset is just a different oscillator shape/frequency/timing — zero new
// audio assets, same zero-cost approach as the original single chime.
const SOUND_BUILDERS = {
  chime: (ctx, master) => tone(ctx, master, { freq: 880, duration: 0.9 }),
  bell: (ctx, master) => {
    tone(ctx, master, { freq: 1046, duration: 0.5 })
    tone(ctx, master, { freq: 784, start: 0.15, duration: 0.65 })
  },
  digital: (ctx, master) => {
    tone(ctx, master, { freq: 660, type: 'square', duration: 0.12, peak: 0.5 })
    tone(ctx, master, { freq: 660, type: 'square', start: 0.18, duration: 0.12, peak: 0.5 })
  },
  soft: (ctx, master) => tone(ctx, master, { freq: 440, duration: 1.4, peak: 0.6 })
}

function playSound(soundId, volume) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const master = ctx.createGain()
    master.gain.value = Math.max(0, Math.min(1, volume))
    master.connect(ctx.destination)
    const build = SOUND_BUILDERS[soundId] || SOUND_BUILDERS[DEFAULT_SOUND]
    build(ctx, master)
    setTimeout(() => ctx.close(), 2000)
  } catch {
    /* audio not available */
  }
}

function initState() {
  const s = load()
  const mode = s?.mode && DURATIONS[s.mode] != null ? s.mode : 'focus'
  let completedSessions = s?.completedSessions || 0
  const prefs = {
    soundId: s?.soundId && SOUND_BUILDERS[s.soundId] ? s.soundId : DEFAULT_SOUND,
    volume: typeof s?.volume === 'number' ? Math.max(0, Math.min(1, s.volume)) : 0.6,
    muted: Boolean(s?.muted)
  }
  if (s?.isRunning && s?.endsAt) {
    const r = Math.round((s.endsAt - Date.now()) / 1000)
    if (r > 0) return { mode, isRunning: true, endsAt: s.endsAt, remaining: r, completedSessions, ...prefs }
    // Timer finished while the app was closed.
    if (mode === 'focus') completedSessions += 1
    return { mode, isRunning: false, endsAt: null, remaining: DURATIONS[mode], completedSessions, ...prefs }
  }
  return {
    mode,
    isRunning: false,
    endsAt: null,
    remaining: s?.remaining != null ? s.remaining : DURATIONS[mode],
    completedSessions,
    ...prefs
  }
}

export function PomodoroProvider({ children }) {
  const [state, setState] = useState(initState)
  // Sound prefs mirrored into a ref so the completion handler can read the
  // LATEST values without them being a dependency of the ticking effect below
  // (that effect must only restart on isRunning/endsAt/mode) — and, just as
  // important, so playing the sound stays a side effect outside of setState.
  // A functional setState updater is invoked twice by React 18 StrictMode in
  // dev (by design, to surface impure updaters), so anything inside one that
  // isn't a pure state transform — like triggering audio — would fire twice.
  const soundPrefsRef = useRef({ soundId: state.soundId, volume: state.volume, muted: state.muted })
  useEffect(() => {
    soundPrefsRef.current = { soundId: state.soundId, volume: state.volume, muted: state.muted }
  }, [state.soundId, state.volume, state.muted])

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
        const { soundId, volume, muted } = soundPrefsRef.current
        if (!muted) playSound(soundId, volume)
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

  const setSoundId = useCallback((soundId) => {
    if (!SOUND_BUILDERS[soundId]) return
    setState((prev) => ({ ...prev, soundId }))
  }, [])

  const setVolume = useCallback((volume) => {
    setState((prev) => ({ ...prev, volume: Math.max(0, Math.min(1, volume)) }))
  }, [])

  const setMuted = useCallback((muted) => {
    setState((prev) => ({ ...prev, muted: Boolean(muted) }))
  }, [])

  const previewSound = useCallback((soundId) => {
    if (!state.muted) playSound(soundId, state.volume)
  }, [state.muted, state.volume])

  const duration = DURATIONS[state.mode]
  const value = {
    ...state,
    duration,
    modes: POMODORO_MODES,
    sounds: SOUND_PRESETS,
    progress: duration > 0 ? 1 - state.remaining / duration : 0,
    start,
    pause,
    toggle,
    reset,
    setMode,
    setSoundId,
    setVolume,
    setMuted,
    previewSound
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
