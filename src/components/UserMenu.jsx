import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useLang } from '../contexts/LangContext.jsx'
import Icon from './ui/Icon.jsx'

// Authenticated-user dropdown: avatar/initial trigger → profile, admin (super
// admin only) and sign-out. Falls back to a Sign-in link for guests. Fully
// theme-aware and closes on outside click / Escape.
export default function UserMenu() {
  const { user, profile, isAuthenticated, isSuperAdmin, logout } = useAuth()
  const { t, dir } = useLang()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onClick); document.removeEventListener('keydown', onKey) }
  }, [open])

  if (!isAuthenticated) {
    return (
      <Link to="/login" className="px-4 py-2 rounded-[10px] text-sm font-semibold text-white bg-primary hover:bg-primary-strong no-underline transition-colors">
        {t('sign-in')}
      </Link>
    )
  }

  const name = profile?.displayName || user?.displayName || user?.email || 'Student'
  const initial = name.trim().charAt(0).toUpperCase()
  const photo = profile?.photoURL || user?.photoURL

  async function onSignOut() {
    setOpen(false)
    await logout()
    navigate('/', { replace: true })
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center justify-center w-9 h-9 rounded-full overflow-hidden border border-border-card bg-primary text-white font-semibold
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        title={name}
      >
        {photo
          ? <img src={photo} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          : <span aria-hidden="true">{initial}</span>}
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute top-full mt-2 min-w-[200px] py-1.5 z-[2000] rounded-xl border border-border-soft bg-surface shadow-lg shadow-black/10
                      ${dir === 'rtl' ? 'left-0' : 'right-0'}`}
        >
          <Link to="/profile" role="menuitem" onClick={() => setOpen(false)}
            className="block px-4 py-2 border-b border-border-soft no-underline hover:bg-surface-muted">
            <p className="text-sm font-semibold text-ink truncate">{name}</p>
            {user?.email && <p className="text-xs text-ink-muted truncate">{user.email}</p>}
          </Link>
          {isSuperAdmin && (
            <Link to="/admin" role="menuitem" onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-ink hover:bg-surface-muted no-underline">
              <Icon name="settings" className="w-4 h-4" /> {t('admin')}
            </Link>
          )}
          <button role="menuitem" onClick={onSignOut}
            className="w-full text-start px-4 py-2 text-sm text-primary hover:bg-surface-muted">
            {t('sign-out')}
          </button>
        </div>
      )}
    </div>
  )
}
