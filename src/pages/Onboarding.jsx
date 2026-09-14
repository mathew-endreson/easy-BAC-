import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, authErrorKey } from '../contexts/AuthContext.jsx'
import { useLang } from '../contexts/LangContext.jsx'
import { WILAYAS, wilayaLabel } from '../constants/wilayas.js'
import { STREAMS, streamLabel } from '../constants/streams.js'
import LanguageSelector from '../components/LanguageSelector.jsx'
import ThemeToggle from '../components/ThemeToggle.jsx'
import { Label, SelectInput, SubmitButton, Alert } from '../components/ui/Form.jsx'
import Icon from '../components/ui/Icon.jsx'

export default function Onboarding() {
  const { t, lang, dir } = useLang()
  const navigate = useNavigate()
  const { profile, profileComplete, completeProfile } = useAuth()
  const [wilaya, setWilaya] = useState('')
  const [stream, setStream] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // Prefill from any partial data, and skip onboarding entirely if already done.
  useEffect(() => {
    if (profileComplete) { navigate('/library', { replace: true }); return }
    if (profile) {
      if (profile.wilaya) setWilaya(profile.wilaya)
      if (profile.bacStream) setStream(profile.bacStream)
    }
  }, [profile, profileComplete, navigate])

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    if (!wilaya || !stream) { setError(t('err-required-fields')); return }
    setBusy(true)
    try {
      await completeProfile({ wilaya, bacStream: stream })
      navigate('/library', { replace: true })
    } catch (err) {
      setError(t(err.code && err.code.startsWith('err-') ? err.code : authErrorKey(err)))
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-page text-ink flex flex-col" dir={dir}>
      <header className="flex items-center justify-between gap-3 p-4 sm:p-6">
        <span className="text-xl font-heading font-bold text-primary">EZBAC</span>
        <div className="flex items-center gap-2" dir="ltr">
          <LanguageSelector />
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex items-start sm:items-center justify-center px-5 pb-12">
        <div className="w-full max-w-2xl bg-surface border border-border-soft rounded-3xl p-6 sm:p-10 shadow-sm">
          <div className="mb-8 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-primary-soft dark:bg-primary/15 flex items-center justify-center text-primary-strong"><Icon name="graduation" className="w-6 h-6" /></div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold mb-2">{t('onboarding-title')}</h1>
            <p className="text-ink-muted max-w-md mx-auto">{t('onboarding-subtitle')}</p>
          </div>

          <Alert tone="error">{error}</Alert>

          <form onSubmit={onSubmit} noValidate>
            <div className="mb-6">
              <Label htmlFor="wilaya">{t('onboarding-wilaya')} <span className="text-primary">*</span></Label>
              <SelectInput id="wilaya" value={wilaya} onChange={(e) => setWilaya(e.target.value)} required>
                <option value="" disabled>{t('onboarding-wilaya-ph')}</option>
                {WILAYAS.map((w) => (
                  <option key={w.code} value={w.code}>{wilayaLabel(w.code, lang)}</option>
                ))}
              </SelectInput>
            </div>

            <div className="mb-2">
              <Label>{t('onboarding-stream')} <span className="text-primary">*</span></Label>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-2">
              {STREAMS.map((s) => {
                const active = stream === s.id
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStream(s.id)}
                    aria-pressed={active}
                    className={`flex flex-col items-center text-center gap-2 p-4 rounded-2xl border transition-all
                                ${active
                                  ? 'border-primary bg-primary-soft/60 dark:bg-primary/15 ring-2 ring-primary/30'
                                  : 'border-border-card bg-surface hover:border-primary/50 hover:bg-surface-muted'}`}
                  >
                    <span className="text-2xl" aria-hidden="true">{s.icon}</span>
                    <span className={`text-sm font-medium leading-tight ${active ? 'text-primary' : 'text-ink'}`}>
                      {streamLabel(s.id, lang)}
                    </span>
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-ink-muted mb-6">{t('onboarding-why')}</p>

            <SubmitButton loading={busy} disabled={!wilaya || !stream}>{t('onboarding-finish')}</SubmitButton>
          </form>
        </div>
      </main>
    </div>
  )
}
