import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { logActivity, touchPresence } from '../services/activity.js'

// Renders nothing. Records, for signed-in students only (admins are excluded so
// they don't inflate the numbers they're reading):
//   • one `session_start` per browser session
//   • a `page_view` per navigation (same path re-logged at most every 30s)
//   • a presence heartbeat every 60s while the tab is visible
const HEARTBEAT_MS = 60 * 1000
const SAME_PATH_THROTTLE_MS = 30 * 1000
const SESSION_KEY = 'ezbac_session_logged'

export default function ActivityTracker() {
  const { user, profile } = useAuth()
  const { pathname } = useLocation()
  const last = useRef({ path: '', at: 0 })
  const pathRef = useRef(pathname)
  pathRef.current = pathname

  const tracked = Boolean(user && profile && profile.role !== 'super_admin')

  useEffect(() => {
    if (!tracked) return
    let firstThisSession = false
    try {
      if (!sessionStorage.getItem(SESSION_KEY)) { sessionStorage.setItem(SESSION_KEY, '1'); firstThisSession = true }
    } catch { /* storage blocked — skip session marker */ }
    if (firstThisSession) logActivity(user, profile, 'session_start', pathname)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracked, user?.uid])

  useEffect(() => {
    if (!tracked) return
    const now = Date.now()
    if (last.current.path === pathname && now - last.current.at < SAME_PATH_THROTTLE_MS) return
    last.current = { path: pathname, at: now }
    logActivity(user, profile, 'page_view', pathname)
    touchPresence(user, profile, pathname)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracked, pathname])

  useEffect(() => {
    if (!tracked) return
    const beat = () => { if (document.visibilityState === 'visible') touchPresence(user, profile, pathRef.current) }
    const id = setInterval(beat, HEARTBEAT_MS)
    document.addEventListener('visibilitychange', beat)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', beat) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracked, user?.uid])

  return null
}
