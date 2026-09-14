import { useState } from 'react'
import { useLang } from '../contexts/LangContext.jsx'

// Compact quiz/flashcard "deck" card with personal progress tracking — a ring
// showing real progress, a timer, and play/reset/stats controls, plus (for
// flashcard decks only) a 5-level self-rating row.
//
// Ring color is a simple, honest 3-state scheme (not a literal copy of Anki's
// SRS-state colors, which this app's data model doesn't track):
//   grey  = never studied (no progress doc yet)
//   red   = studied but not yet at a "good" outcome
//   green = quiz: last score ≥ 50% · flashcards: fully reviewed
const RING_COLORS = { grey: '#9aa0ad', red: '#ef4444', green: '#22c55e' }
const MOOD_EMOJI = ['😞', '🙁', '😐', '🙂', '😀']

function Ring({ percent, color, centerTop, centerBottom }) {
  const r = 46
  const c = 2 * Math.PI * r
  const filled = Math.max(0, Math.min(100, percent)) / 100 * c
  return (
    <div className="relative w-28 h-28 shrink-0">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeWidth="9" className="text-border-card" />
        <circle
          cx="50" cy="50" r={r} fill="none" stroke={RING_COLORS[color] || RING_COLORS.grey}
          strokeWidth="9" strokeLinecap="round"
          strokeDasharray={`${filled} ${c - filled}`}
          style={{ transition: 'stroke-dasharray 0.5s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-bold text-primary tabular-nums">{centerTop}</span>
        <span className="text-xs text-ink-muted tabular-nums">{centerBottom}</span>
      </div>
    </div>
  )
}

export default function DeckCard({
  title, subtitle, ringPercent, ringColor, centerTop, centerBottom, timerLabel,
  onPlay, onReset, statsLines, showMood, moodValue, onMood,
  isFavorite, onToggleFavorite, onDelete
}) {
  const { t } = useLang()
  const [showStats, setShowStats] = useState(false)

  return (
    <div className="bg-surface border border-border-soft rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="font-heading font-bold text-ink line-clamp-2 leading-snug">{title}</h4>
          {subtitle && <p className="text-xs text-ink-muted mt-1">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onToggleFavorite}
            aria-label={isFavorite ? t('saved') : t('favorite')}
            aria-pressed={isFavorite}
            className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors ${isFavorite ? 'text-amber-500' : 'text-ink-muted hover:text-amber-500'}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Ring percent={ringPercent} color={ringColor} centerTop={centerTop} centerBottom={centerBottom} />
        <div className="flex-1 flex flex-col items-center gap-3">
          <span className="text-3xl font-heading font-bold text-ink tabular-nums">{timerLabel}</span>
          <div className="flex items-center gap-2">
            <button onClick={onPlay} aria-label={t('start')} title={t('start')}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-emerald-500 text-white hover:bg-emerald-600 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
            </button>
            <button onClick={onReset} aria-label="reset" title="Reset"
              className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-muted text-ink border border-border-soft hover:bg-bg-card transition-colors">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" />
              </svg>
            </button>
            {statsLines && (
              <button onClick={() => setShowStats((s) => !s)} aria-expanded={showStats} aria-label="stats" title="Stats"
                className={`w-10 h-10 flex items-center justify-center rounded-full border border-border-soft transition-colors ${showStats ? 'bg-primary-soft text-primary-strong dark:bg-primary/15 dark:text-primary-glow' : 'bg-surface-muted text-ink hover:bg-bg-card'}`}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M3 3v18h18" /><path d="M7 15l4-6 4 3 5-8" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {showStats && statsLines && (
        <div className="text-xs text-ink-muted bg-surface-muted rounded-xl p-3 flex flex-col gap-1">
          {statsLines.map((line, i) => <span key={i}>{line}</span>)}
        </div>
      )}

      {showMood && (
        <div className="flex items-center justify-between border-t border-border-soft pt-3">
          {MOOD_EMOJI.map((emoji, i) => {
            const rating = i + 1
            const active = moodValue === rating
            return (
              <button key={rating} onClick={() => onMood?.(rating)} aria-label={`rate ${rating}`} aria-pressed={active}
                className={`text-lg leading-none transition-transform hover:scale-110 ${active ? 'scale-125' : 'opacity-50'}`}>
                {emoji}
              </button>
            )
          })}
        </div>
      )}

      <div className="flex justify-end">
        <button onClick={onDelete} aria-label="reset progress" title="Reset personal progress"
          className="text-ink-muted hover:text-primary transition-colors">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          </svg>
        </button>
      </div>
    </div>
  )
}
