import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useLang } from '../contexts/LangContext.jsx'
import Icon from './ui/Icon.jsx'

// Full-screen, theme-aware loading state shown while auth resolves — a gently
// breathing brand mark instead of a generic spinner, so the very first thing a
// student sees on every protected route feels like part of this app.
export function FullScreenLoader({ label }) {
  const { t } = useLang()
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-bg-page text-ink z-[9998]">
      <img src="/assets/images/logo.svg" alt="" className="brand-loader-mark h-10 w-auto" />
      <div className="flex items-center gap-3">
        <p className="text-sm text-ink-muted">{label || t('loading')}</p>
        <span className="flex items-center gap-1" aria-hidden="true">
          <span className="brand-loader-dot w-1.5 h-1.5 rounded-full bg-primary" style={{ animationDelay: '0ms' }} />
          <span className="brand-loader-dot w-1.5 h-1.5 rounded-full bg-primary" style={{ animationDelay: '150ms' }} />
          <span className="brand-loader-dot w-1.5 h-1.5 rounded-full bg-primary" style={{ animationDelay: '300ms' }} />
        </span>
      </div>
    </div>
  )
}

// Shown instead of the app to a student whose account an admin disabled.
export function DisabledAccountScreen() {
  const { t, dir } = useLang()
  const { logout } = useAuth()
  return (
    <div dir={dir} className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-bg-page text-ink z-[9998] px-6 text-center">
      <span className="w-16 h-16 rounded-2xl bg-surface-muted flex items-center justify-center text-primary"><Icon name="lock" className="w-7 h-7" /></span>
      <h1 className="text-xl font-heading font-bold">{t('account-disabled-title')}</h1>
      <p className="text-ink-muted max-w-sm">{t('account-disabled-desc')}</p>
      <button onClick={logout} className="mt-2 px-5 py-2.5 rounded-pill bg-primary text-white font-semibold hover:bg-primary-strong transition-colors">
        {t('sign-out')}
      </button>
    </div>
  )
}

// Requires an authenticated user. Unauthenticated users are sent to /login with
// the attempted location preserved so they return there after signing in.
export function RequireAuth({ children }) {
  const { isAuthenticated, loading, isDisabled, isSuperAdmin } = useAuth()
  const location = useLocation()
  if (loading) return <FullScreenLoader />
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />
  if (isDisabled && !isSuperAdmin) return <DisabledAccountScreen />
  return children
}

// Requires a COMPLETE profile (wilaya + bacStream). Authenticated students with
// an incomplete profile are forced to /onboarding before any stream-gated page.
export function RequireProfile({ children }) {
  const { isAuthenticated, loading, profileComplete, isDisabled, isSuperAdmin } = useAuth()
  const location = useLocation()
  if (loading) return <FullScreenLoader />
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />
  if (isDisabled && !isSuperAdmin) return <DisabledAccountScreen />
  if (!profileComplete) return <Navigate to="/onboarding" replace />
  return children
}

// Requires super_admin. Non-admins are redirected to the student dashboard —
// this is real route protection, not just hidden links.
export function RequireAdmin({ children }) {
  const { isAuthenticated, loading, isSuperAdmin } = useAuth()
  const location = useLocation()
  if (loading) return <FullScreenLoader />
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />
  if (!isSuperAdmin) return <Navigate to="/library" replace />
  return children
}

// For /login and /register: if already signed in, skip the form. Sends admins to
// /admin, students with incomplete profiles to /onboarding, else to /library (or
// back to wherever they were headed).
export function RedirectIfAuthed({ children }) {
  const { isAuthenticated, loading, isSuperAdmin, profileComplete } = useAuth()
  const location = useLocation()
  if (loading) return <FullScreenLoader />
  if (isAuthenticated) {
    if (isSuperAdmin) return <Navigate to="/admin" replace />
    if (!profileComplete) return <Navigate to="/onboarding" replace />
    const dest = location.state?.from?.pathname || '/library'
    return <Navigate to={dest} replace />
  }
  return children
}
