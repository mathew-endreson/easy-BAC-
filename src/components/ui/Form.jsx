// Reusable, theme-aware form primitives shared across auth, onboarding, admin
// and support forms. All colors come from theme tokens so light/dark just work.

const inputBase =
  'w-full px-4 py-3 rounded-xl text-[15px] bg-surface text-ink placeholder:text-ink-muted ' +
  'border border-border-card focus:border-primary focus:outline-none ' +
  'focus-visible:ring-2 focus-visible:ring-primary/30 transition-colors disabled:opacity-60'

export function Label({ htmlFor, children, hint }) {
  return (
    <label htmlFor={htmlFor} className="block mb-2 text-sm font-semibold text-ink">
      {children}
      {hint && <span className="ms-2 font-normal text-ink-muted">{hint}</span>}
    </label>
  )
}

export function TextInput({ id, ...props }) {
  return <input id={id} className={inputBase} {...props} />
}

export function SelectInput({ id, children, ...props }) {
  return (
    <select id={id} className={inputBase} {...props}>
      {children}
    </select>
  )
}

export function TextArea({ id, ...props }) {
  return <textarea id={id} className={`${inputBase} min-h-[110px] resize-y`} {...props} />
}

export function SubmitButton({ children, loading, disabled, ...props }) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-white
                 bg-primary hover:bg-primary-strong active:scale-[.99]
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50
                 disabled:opacity-60 disabled:cursor-not-allowed transition-all
                 dark:shadow-[0_0_24px_rgba(229,89,91,0.35)] dark:hover:shadow-[0_0_32px_rgba(229,89,91,0.5)]"
      {...props}
    >
      {loading && <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />}
      {children}
    </button>
  )
}

export function GoogleButton({ children, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl font-semibold
                 text-ink bg-surface border border-border-card hover:bg-surface-muted
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30
                 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z" />
      </svg>
      {children}
    </button>
  )
}

// Inline alert. `tone`: 'error' (default) | 'success' | 'info'.
export function Alert({ tone = 'error', children }) {
  if (!children) return null
  const tones = {
    error: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30',
    info: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/30'
  }
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`mb-4 px-4 py-3 rounded-xl border text-sm ${tones[tone]}`}>
      {children}
    </div>
  )
}
