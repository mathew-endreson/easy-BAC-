import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth, authErrorKey } from '../contexts/AuthContext.jsx'
import { useLang } from '../contexts/LangContext.jsx'
import AuthShell from '../components/AuthShell.jsx'
import { Label, TextInput, SubmitButton, GoogleButton, Alert } from '../components/ui/Form.jsx'

export default function Login() {
  const { t } = useLang()
  const { loginWithEmail, loginWithGoogle, resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  // On success we do NOT navigate manually — the RedirectIfAuthed guard wrapping
  // this route sends the user to the right place once the profile has loaded.
  async function onSubmit(e) {
    e.preventDefault()
    setError(''); setNotice('')
    if (!email || !password) { setError(t('err-required-fields')); return }
    setBusy(true)
    try {
      await loginWithEmail(email, password)
    } catch (err) {
      setError(t(authErrorKey(err)))
      setBusy(false)
    }
  }

  async function onGoogle() {
    setError(''); setNotice('')
    setBusy(true)
    try {
      await loginWithGoogle()
    } catch (err) {
      setError(t(authErrorKey(err)))
      setBusy(false)
    }
  }

  async function onForgot() {
    setError(''); setNotice('')
    if (!email) { setError(t('err-invalid-email')); return }
    try {
      await resetPassword(email)
      setNotice(t('auth-reset-sent'))
    } catch (err) {
      setError(t(authErrorKey(err)))
    }
  }

  return (
    <AuthShell
      title={t('auth-login-title')}
      subtitle={t('auth-login-subtitle')}
      footer={
        <span>
          {t('auth-no-account')}{' '}
          <Link to="/register" className="text-primary font-semibold hover:underline no-underline">
            {t('sign-up')}
          </Link>
        </span>
      }
    >
      <Alert tone="error">{error}</Alert>
      <Alert tone="success">{notice}</Alert>

      <GoogleButton onClick={onGoogle} disabled={busy}>{t('auth-google')}</GoogleButton>

      <div className="flex items-center gap-3 my-5 text-ink-muted text-xs uppercase tracking-wide">
        <span className="flex-1 h-px bg-border-soft" />
        {t('auth-or')}
        <span className="flex-1 h-px bg-border-soft" />
      </div>

      <form onSubmit={onSubmit} noValidate>
        <div className="mb-4">
          <Label htmlFor="email">{t('auth-email')}</Label>
          <TextInput id="email" type="email" autoComplete="email" value={email}
            onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
        </div>
        <div className="mb-2">
          <Label htmlFor="password">{t('auth-password')}</Label>
          <TextInput id="password" type="password" autoComplete="current-password" value={password}
            onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
        </div>
        <div className="mb-5 text-end">
          <button type="button" onClick={onForgot} className="text-sm text-ink-muted hover:text-primary transition-colors">
            {t('auth-forgot')}
          </button>
        </div>
        <SubmitButton loading={busy}>{t('auth-login-cta')}</SubmitButton>
      </form>
    </AuthShell>
  )
}
