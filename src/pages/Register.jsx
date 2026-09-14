import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth, authErrorKey } from '../contexts/AuthContext.jsx'
import { useLang } from '../contexts/LangContext.jsx'
import AuthShell from '../components/AuthShell.jsx'
import { Label, TextInput, SubmitButton, GoogleButton, Alert } from '../components/ui/Form.jsx'

export default function Register() {
  const { t } = useLang()
  const { registerWithEmail, loginWithGoogle } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    if (!name || !email || !password) { setError(t('err-required-fields')); return }
    if (password.length < 6) { setError(t('err-weak-password')); return }
    if (password !== confirm) { setError(t('err-password-match')); return }
    setBusy(true)
    try {
      // On success the RedirectIfAuthed guard sends new users to /onboarding
      // (profile not yet complete).
      await registerWithEmail(name, email, password)
    } catch (err) {
      setError(t(authErrorKey(err)))
      setBusy(false)
    }
  }

  async function onGoogle() {
    setError('')
    setBusy(true)
    try {
      await loginWithGoogle()
    } catch (err) {
      setError(t(authErrorKey(err)))
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title={t('auth-register-title')}
      subtitle={t('auth-register-subtitle')}
      footer={
        <span>
          {t('auth-have-account')}{' '}
          <Link to="/login" className="text-primary font-semibold hover:underline no-underline">
            {t('sign-in')}
          </Link>
        </span>
      }
    >
      <Alert tone="error">{error}</Alert>

      <GoogleButton onClick={onGoogle} disabled={busy}>{t('auth-google')}</GoogleButton>

      <div className="flex items-center gap-3 my-5 text-ink-muted text-xs uppercase tracking-wide">
        <span className="flex-1 h-px bg-border-soft" />
        {t('auth-or')}
        <span className="flex-1 h-px bg-border-soft" />
      </div>

      <form onSubmit={onSubmit} noValidate>
        <div className="mb-4">
          <Label htmlFor="name">{t('auth-name')}</Label>
          <TextInput id="name" type="text" autoComplete="name" value={name}
            onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="mb-4">
          <Label htmlFor="email">{t('auth-email')}</Label>
          <TextInput id="email" type="email" autoComplete="email" value={email}
            onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
        </div>
        <div className="mb-4">
          <Label htmlFor="password">{t('auth-password')}</Label>
          <TextInput id="password" type="password" autoComplete="new-password" value={password}
            onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
        </div>
        <div className="mb-6">
          <Label htmlFor="confirm">{t('auth-confirm-password')}</Label>
          <TextInput id="confirm" type="password" autoComplete="new-password" value={confirm}
            onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" required />
        </div>
        <SubmitButton loading={busy}>{t('auth-register-cta')}</SubmitButton>
      </form>
    </AuthShell>
  )
}
