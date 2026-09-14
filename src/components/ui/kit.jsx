import { Link } from 'react-router-dom'
import Icon from './Icon.jsx'

// Shared, theme-aware presentational primitives used across the student
// experience (Home, Library, Progress, Favorites, Study Plans, Support). Every
// color is a theme token so light/dark are consistent by construction. Keeping
// these in one place prevents the "many inconsistent card styles" problem.

export function ProgressBar({ value = 0, className = '' }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div className={`w-full h-2 rounded-full bg-surface-muted overflow-hidden ${className}`} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${pct}%` }} />
    </div>
  )
}

const TONES = {
  neutral: 'bg-surface-muted text-ink-muted',
  primary: 'bg-primary-soft text-primary-strong dark:bg-primary/15 dark:text-primary-glow',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  danger: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300'
}
export function StatusBadge({ tone = 'neutral', children }) {
  return <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${TONES[tone] || TONES.neutral}`}>{children}</span>
}

export function Card({ as: As = 'div', className = '', children, ...props }) {
  return (
    <As className={`bg-surface border border-border-soft rounded-2xl ${className}`} {...props}>
      {children}
    </As>
  )
}

export function SectionHeader({ title, action, className = '' }) {
  return (
    <div className={`flex items-center justify-between gap-3 mb-4 ${className}`}>
      <h3 className="text-lg sm:text-xl font-heading font-bold text-ink">{title}</h3>
      {action}
    </div>
  )
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-ink">{title}</h1>
        {subtitle && <p className="text-ink-muted mt-1">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

export function EmptyState({ icon = <Icon name="inbox" />, title, description, action }) {
  return (
    <div className="flex flex-col items-center text-center py-12 px-6">
      <div className="w-16 h-16 rounded-2xl bg-surface-muted flex items-center justify-center text-3xl mb-4">{icon}</div>
      <h3 className="text-lg font-heading font-bold text-ink mb-1">{title}</h3>
      {description && <p className="text-ink-muted max-w-sm mb-5">{description}</p>}
      {action}
    </div>
  )
}

export function LoadingGrid({ count = 6, className = '' }) {
  return (
    <div className={`grid gap-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-28 rounded-2xl skeleton" style={{ animationDelay: `${(i % 6) * 80}ms` }} />
      ))}
    </div>
  )
}

// A single labeled skeleton line/block — for loading states that aren't a
// uniform card grid (a title, a paragraph, an avatar).
export function SkeletonLine({ className = 'h-4 w-full' }) {
  return <div className={`rounded-md skeleton ${className}`} />
}

export function Spinner({ label }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-ink-muted">
      <span className="w-8 h-8 rounded-full border-[3px] border-border-card border-t-primary animate-spin" />
      {label && <p className="text-sm">{label}</p>}
    </div>
  )
}

// A tappable quick-action tile (Library / Progress / Study Plans / …).
export function QuickActionCard({ icon, label, to, onClick }) {
  const inner = (
    <>
      <span className="w-10 h-10 rounded-xl bg-primary-soft dark:bg-primary/15 flex items-center justify-center text-xl">{icon}</span>
      <span className="font-semibold text-ink text-sm">{label}</span>
    </>
  )
  const cls = 'flex items-center gap-3 p-4 rounded-2xl bg-surface border border-border-soft hover:border-primary/50 hover:-translate-y-0.5 transition-all no-underline'
  return to
    ? <Link to={to} className={cls}>{inner}</Link>
    : <button type="button" onClick={onClick} className={`${cls} w-full text-start`}>{inner}</button>
}

// Subject overview card (Library subjects grid).
export function SubjectCard({ icon = <Icon name="book" />, name, progress, meta, onClick }) {
  return (
    <button type="button" onClick={onClick} className="text-start w-full p-5 rounded-2xl bg-surface border border-border-soft hover:border-primary/50 hover:-translate-y-0.5 transition-all">
      <div className="flex items-center gap-3 mb-3">
        <span className="w-11 h-11 rounded-xl bg-primary-soft dark:bg-primary/15 flex items-center justify-center text-xl">{icon}</span>
        <span className="font-heading font-bold text-ink flex-1 min-w-0 truncate">{name}</span>
      </div>
      {typeof progress === 'number' && (
        <>
          <div className="flex justify-between text-xs text-ink-muted mb-1"><span>{Math.round(progress)}%</span></div>
          <ProgressBar value={progress} />
        </>
      )}
      {meta && <p className="text-xs text-ink-muted mt-2">{meta}</p>}
    </button>
  )
}
