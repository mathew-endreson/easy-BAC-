import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import AuthPanel from '../components/AuthPanel.jsx'
import { AuthField } from '../components/AuthField.jsx'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(email, password)
      navigate(user.role === 'staff' ? '/admin' : '/courses')
    } catch (err) {
      setError(err.data?.error === 'account_suspended' ? 'Your account has been suspended.' : 'Incorrect email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex bg-white">
      <AuthPanel
        headline="Welcome back !"
        body="with logging in you will restore your library and all the resources you where reviewing earlier"
      />

      <div className="flex-1 flex items-center justify-center px-6 py-12 sm:px-10 lg:px-16">
        <div className="w-full max-w-[680px]">
          <Link to="/" className="inline-flex items-center justify-center mb-8 text-[#5e8ab3]" aria-label="Back">
            <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
              <path d="M19 8H1M1 8L8 1M1 8L8 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>

          <h1 className="font-heading font-bold text-[28px] sm:text-[32px] text-black capitalize tracking-tight">
            Enter your information
          </h1>

          <form onSubmit={onSubmit} className="mt-12 flex flex-col gap-6">
            <AuthField
              label="Email"
              type="email"
              placeholder="MailAdress@mail.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <AuthField
              label="Password"
              type="password"
              placeholder="••••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {error && <p className="text-primary-strong text-ez-sm">{error}</p>}

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-[332px] h-[53px] rounded-full bg-[#cf111a] text-white font-heading font-semibold text-ez-lg hover:opacity-90 disabled:opacity-60"
              >
                {loading ? 'Logging in...' : 'log in'}
              </button>
            </div>
          </form>

          <p className="mt-6 text-ez-sm text-ink-muted text-center sm:text-right">
            No account? <Link to="/register" className="text-primary-strong">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
