import { Link, useNavigate } from 'react-router-dom'
import Icon from './Icon.jsx'

// Shared, theme-aware presentational primitives used across the student
// experience (Home, Library, Progress, Favorites, Study Plans, Support). Every
// color is a theme token so light/dark are consistent by construction. Keeping
// these in one place prevents the "many inconsistent card styles" problem.

// A compact back control for one-off screens that don't use PageHeader (Quiz,
// Flashcard) — same circular-arrow visual language as PageHeader's back button,
// but as a standalone row so it can carry a label and sit above custom content.
// `onClick` (custom exit logic, e.g. saving partial progress) wins over `to`.
export function BackLink({ to, onClick, label, className = '' }) {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      onClick={onClick || (() => (to ? navigate(to) : navigate(-1)))}
      className={`inline-flex items-center gap-2 text-sm font-semibold text-ink hover:text-primary transition-colors ${className}`}
    >
      <span className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full bg-surface-muted"><Icon name="arrowLeft" className="w-4 h-4" /></span>
      {label}
    </button>
  )
}

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

// `back` is a destination string (navigate there) or `true`/omitted (navigate
// back in history, like a native back button). Pass `back={false}` to hide it
// — used only by Library, the student area's home/landing page.
export function PageHeader({ title, subtitle, children, back = true }) {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
      <div>
        <div className="flex items-center gap-3">
          {back && (
            <button
              type="button"
              onClick={() => (typeof back === 'string' ? navigate(back) : navigate(-1))}
              aria-label="Back"
              className="w-9 h-9 shrink-0 rounded-full bg-surface-muted flex items-center justify-center text-ink hover:bg-border-soft transition-colors"
            >
              <Icon name="arrowLeft" className="w-[18px] h-[18px]" />
            </button>
          )}
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-ink">{title}</h1>
        </div>
        {subtitle && <p className="text-ink-muted mt-1">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

// Shared stat tile (Progress, Profile) — one icon, one number, one label.
// Pass `to` to make it a link into the relevant page (e.g. Favorites → /favorites).
export function StatCard({ icon, value, label, to }) {
  const content = (
    <>
      <span className="w-12 h-12 rounded-xl bg-primary-soft dark:bg-primary/15 flex items-center justify-center text-2xl text-primary-strong shrink-0">
        {icon === 'tomato' ? '🍅' : <Icon name={icon} className="w-6 h-6" />}
      </span>
      <div className="min-w-0">
        <p className="text-2xl font-heading font-bold text-ink tabular-nums">{value}</p>
        <p className="text-sm text-ink-muted truncate">{label}</p>
      </div>
    </>
  )
  if (!to) return <Card className="p-5 flex items-center gap-4">{content}</Card>
  return (
    <Link to={to} className="p-5 flex items-center gap-4 bg-surface border border-border-soft rounded-2xl hover:border-primary/50 hover:-translate-y-0.5 transition-all no-underline">
      {content}
    </Link>
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

// Subject overview card (Library subjects grid). `coverURL` is an optional
// admin-set background picture (see AdminAcademic) — when set, it replaces the
// generic icon with a real image banner; otherwise the icon tile is used.
export function SubjectCard({ icon = <Icon name="book" />, name, progress, meta, coverURL, onClick }) {
  return (
    <button type="button" onClick={onClick} className="text-start w-full rounded-2xl bg-surface border border-border-soft overflow-hidden hover:border-primary/50 hover:-translate-y-0.5 transition-all">
      {coverURL && (
        <div className="h-24 w-full relative">
          <img src={coverURL} alt="" className="w-full h-full object-cover" />
          <span className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <span className="absolute bottom-2 start-3 end-3 font-heading font-bold text-white truncate">{name}</span>
        </div>
      )}
      <div className="p-5">
        {!coverURL && (
          <div className="flex items-center gap-3 mb-3">
            <span className="w-11 h-11 rounded-xl bg-primary-soft dark:bg-primary/15 flex items-center justify-center text-xl">{icon}</span>
            <span className="font-heading font-bold text-ink flex-1 min-w-0 truncate">{name}</span>
          </div>
        )}
        {typeof progress === 'number' && (
          <>
            <div className="flex justify-between text-xs text-ink-muted mb-1"><span>{Math.round(progress)}%</span></div>
            <ProgressBar value={progress} />
          </>
        )}
        {meta && <p className="text-xs text-ink-muted mt-2">{meta}</p>}
      </div>
    </button>
  )
}
