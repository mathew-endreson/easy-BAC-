// A small, cohesive line-icon set — consistent 1.75px stroke, rounded caps,
// 24x24 viewBox, currentColor — used everywhere the app previously reached for
// an emoji as interface chrome (nav items, quick actions, empty states, stat
// tiles). Emoji stays where it's genuinely expressive content (a mood rating,
// a celebration moment, the Pomodoro tomato itself), just not as UI iconography.
//
// Usage: <Icon name="home" className="w-5 h-5" />

const PATHS = {
  home: <><path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 9.5V20h13V9.5" /><path d="M9.5 20v-6h5v6" /></>,
  library: <><path d="M4 4.5h5.5A2.5 2.5 0 0 1 12 7v13a2 2 0 0 0-2-2H4z" /><path d="M20 4.5h-5.5A2.5 2.5 0 0 0 12 7v13a2 2 0 0 1 2-2h6z" /></>,
  book: <><path d="M6.5 3.5H18a1 1 0 0 1 1 1V19a1 1 0 0 1-1 1H6.5a2 2 0 0 1 0-4H19" /></>,
  teacher: <><circle cx="12" cy="8" r="3.5" /><path d="M4.5 20.5c1-4 3.7-6 7.5-6s6.5 2 7.5 6" /></>,
  chart: <><path d="M4 20V10" /><path d="M11 20V4" /><path d="M18 20v-7" /><path d="M2.5 20.5h19" /></>,
  calendar: <><rect x="3.5" y="5" width="17" height="16" rx="2.5" /><path d="M8 3v4M16 3v4M3.5 10h17" /></>,
  chat: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8A2.5 2.5 0 0 1 17.5 16H10l-4.5 4v-4H6.5A2.5 2.5 0 0 1 4 13.5z" /></>,
  video: <><rect x="2.5" y="5.5" width="14" height="13" rx="2.5" /><path d="M16.5 10.2 21 7.5v9l-4.5-2.7" /></>,
  quiz: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
  cards: <><rect x="3" y="7" width="13" height="14" rx="2.5" transform="rotate(-8 3 7)" /><rect x="7.5" y="4" width="13" height="14" rx="2.5" /></>,
  checklist: <><path d="m4 6 1.7 1.7L9 4.3" /><path d="m4 13 1.7 1.7L9 11.3" /><path d="M12.5 6h7M12.5 13h7M4 20h16" /></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m20 20-4.3-4.3" /></>,
  settings: <><path d="M4 6h9M17 6h3M4 12h3M9 12h11M4 18h13M19 18h1" /><circle cx="15" cy="6" r="2.2" /><circle cx="6" cy="12" r="2.2" /><circle cx="16" cy="18" r="2.2" /></>,
  folder: <><path d="M3.5 6.5A2 2 0 0 1 5.5 4.5h4l2 2.5h7A2 2 0 0 1 20.5 9v9a2 2 0 0 1-2 2h-15a2 2 0 0 1-2-2z" /></>,
  users: <><circle cx="9" cy="8" r="3.2" /><path d="M2.8 19c.6-3.4 3-5.3 6.2-5.3s5.6 1.9 6.2 5.3" /><circle cx="17.5" cy="8.5" r="2.3" /><path d="M16 13.9c1.9.3 3.4 1.6 4.2 4.1" /></>,
  warning: <><path d="M12 3.5 21.5 20h-19z" /><path d="M12 9.5v4.5M12 17h.01" /></>,
  inbox: <><path d="M4 12h4l1.5 3h5L16 12h4" /><path d="M5 5.5h14L21 12v6a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18v-6z" /></>,
  lock: <><rect x="4.5" y="10.5" width="15" height="10" rx="2" /><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" /></>,
  graduation: <><path d="M2 9 12 4l10 5-10 5z" /><path d="M6 11.5V17c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-5.5" /><path d="M20.5 10v6" /></>,
  plus: <><path d="M12 4.5v15M4.5 12h15" /></>,
  chevronRight: <><path d="m9 5 7 7-7 7" /></>,
  arrowLeft: <><path d="M19 12H5M11 6l-6 6 6 6" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3.5 2" /></>,
  star: <><path d="M12 3.5 15 9l6 .9-4.3 4.2 1 6-5.7-3-5.7 3 1-6L3 9.9 9 9z" /></>,
  profile: <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="9.8" r="3" /><path d="M6 18c1-3.3 3-5 6-5s5 1.7 6 5" /></>
}

export default function Icon({ name, className = 'w-5 h-5', strokeWidth = 1.75 }) {
  const path = PATHS[name]
  if (!path) return null
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {path}
    </svg>
  )
}
