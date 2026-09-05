import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import AuthPanel from '../components/AuthPanel.jsx'
import { AuthField, AuthSelect } from '../components/AuthField.jsx'
import { wilayas } from '../lib/wilayas.js'

const bacStreams = [
  'شعبة علوم تجريبية', 'شعبة رياضيات', 'شعبة تسيير و اقتصاد',
  'شعبة اداب و فلسفة', 'شعبة لغات اجنبية', 'شعبة هندسة ميكانيكية',
  'شعبة هندسة كهربائية', 'شعبة هندسة مدنية'
]

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    firstName: '', lastName: '', phoneNumber: '', wilaya: '',
    email: '', password: '', bacStream: bacStreams[0]
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function update(field, value) { setForm((f) => ({ ...f, [field]: value })) }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { firstName, lastName, phoneNumber, wilaya, email, password, bacStream } = form
      const payload = { firstName, lastName, phoneNumber: phoneNumber || undefined, wilaya: wilaya || undefined, email, password, bacStream }
      await register(payload)
      navigate('/courses')
    } catch (err) {
      if (err.data?.error === 'email_taken') {
        setError('That email is already registered.')
      } else if (err.data?.error === 'invalid_input') {
        const firstIssue = Object.values(err.data.details?.fieldErrors ?? {})[0]?.[0]
        setError(firstIssue || 'Please check the fields and try again.')
      } else {
        setError('Could not create your account.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex bg-white">
      <AuthPanel
        headline="Let us be your trusted guide for your bac journey"
        body="with creating an account you will unlock a fully customized and personalized library that meets all your needs in one place!"
      />

      <div className="flex-1 flex items-center justify-center px-6 py-12 sm:px-10 lg:px-16">
        <div className="w-full max-w-[760px]">
          <h1 className="font-heading font-bold text-[28px] sm:text-[32px] text-black capitalize tracking-tight">
            Create an account
          </h1>
          <p className="mt-2 font-body font-light text-xs text-ink">
            **Fill this form with real information for a better experience
          </p>

          <form onSubmit={onSubmit} className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
            <AuthField
              label="First name"
              placeholder="Enter your name"
              required
              value={form.firstName}
              onChange={(e) => update('firstName', e.target.value)}
            />
            <AuthField
              label="Family name"
              placeholder="Enter your last name"
              required
              value={form.lastName}
              onChange={(e) => update('lastName', e.target.value)}
            />
            <AuthField
              label="Phone number"
              placeholder="+213-000-000-000"
              value={form.phoneNumber}
              onChange={(e) => update('phoneNumber', e.target.value)}
            />
            <AuthSelect
              label="Wilaya"
              options={wilayas}
              value={form.wilaya}
              onChange={(e) => update('wilaya', e.target.value)}
            />
            <AuthField
              label="Email"
              type="email"
              placeholder="MailAdress@mail.com"
              required
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
            />
            <AuthField
              label="Password"
              type="password"
              placeholder="••••••••••"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
            />

            <div className="sm:col-span-2">
              <AuthSelect
                label="BAC stream"
                options={bacStreams}
                value={form.bacStream}
                onChange={(e) => update('bacStream', e.target.value)}
              />
            </div>

            {error && <p className="sm:col-span-2 text-primary-strong text-ez-sm">{error}</p>}

            <div className="sm:col-span-2 mt-4 flex flex-wrap gap-4">
              <Link
                to="/login"
                className="shrink-0 w-[158px] h-[53px] flex items-center justify-center rounded-full border border-[#5e8ab3] text-[#5e8ab3] font-heading font-semibold text-ez-lg"
              >
                log in
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 min-w-[220px] h-[53px] rounded-full bg-[#cf111a] text-white font-heading font-semibold text-ez-lg hover:opacity-90 disabled:opacity-60"
              >
                {loading ? 'Creating account...' : 'Create your account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
