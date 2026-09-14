import { createContext, useContext, useEffect, useState, useCallback } from 'react'

const STORAGE_KEY = 'ezbac_theme'
const ThemeContext = createContext({ theme: 'light', isDark: false, toggle: () => {}, setTheme: () => {} })

function systemPrefersDark() {
  return typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : false
}

function readStored() {
  try {
    return localStorage.getItem(STORAGE_KEY) // 'light' | 'dark' | null
  } catch {
    return null
  }
}

// Resolve the concrete mode ('light'|'dark') from a stored preference.
// A null/'system' preference follows the OS setting.
function resolve(pref) {
  if (pref === 'light' || pref === 'dark') return pref
  return systemPrefersDark() ? 'dark' : 'light'
}

export function ThemeProvider({ children }) {
  // `pref` is what the user chose (may be 'system'); `theme` is the resolved mode.
  const [pref, setPref] = useState(() => readStored() || 'system')
  const [theme, setThemeState] = useState(() => resolve(readStored()))

  // Apply the resolved theme to <html> as the `.dark` class.
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
  }, [theme])

  // Persist the preference and keep the resolved theme in sync.
  useEffect(() => {
    try {
      if (pref === 'system') localStorage.removeItem(STORAGE_KEY)
      else localStorage.setItem(STORAGE_KEY, pref)
    } catch {
      /* storage may be unavailable (private mode); theme still applies in-memory */
    }
    setThemeState(resolve(pref))
  }, [pref])

  // While following the system, react to OS theme changes live.
  useEffect(() => {
    if (pref !== 'system' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => setThemeState(systemPrefersDark() ? 'dark' : 'light')
    mq.addEventListener?.('change', handler)
    return () => mq.removeEventListener?.('change', handler)
  }, [pref])

  const toggle = useCallback(() => {
    setPref((p) => (resolve(p) === 'dark' ? 'light' : 'dark'))
  }, [])

  const setTheme = useCallback((t) => setPref(t), [])

  return (
    <ThemeContext.Provider value={{ theme, pref, isDark: theme === 'dark', toggle, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
