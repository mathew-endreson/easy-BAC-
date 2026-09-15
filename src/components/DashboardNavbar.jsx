import { useEffect } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { useLang } from '../contexts/LangContext.jsx'
import LanguageSelector from './LanguageSelector.jsx'
import ThemeToggle from './ThemeToggle.jsx'
import UserMenu from './UserMenu.jsx'
import Icon from './ui/Icon.jsx'

// Student navigation. Library is now the default landing page (Home was
// removed — it duplicated Library/Progress without adding anything of its
// own). Progress / Favorites / Support are first-class destinations (§7).
// Pomodoro stays globally reachable via the floating widget; Games/Calculator
// remain reachable from Library.
const items = [
  { to: '/library', icon: 'library', key: 'library' },
  { to: '/teachers', icon: 'teacher', key: 'nav-teachers' },
  { to: '/progress', icon: 'chart', key: 'nav-progress' },
  { to: '/favorites', icon: 'star', key: 'nav-favorites' },
  { to: '/support', icon: 'chat', key: 'nav-support' }
]

export default function DashboardNavbar() {
  const { t } = useLang()

  useEffect(() => {
    document.body.classList.add('has-bottom-tab')
    return () => document.body.classList.remove('has-bottom-tab')
  }, [])

  return (
    <>
      {/* Mobile-only account bar. The bottom tab bar below hides its logo and
          account controls on small screens so the primary tabs can run full
          width — which otherwise leaves no way to reach the profile menu
          (admin link, sign-out) on a phone. This gives account access its own
          persistent home instead of cramming it into the tab row. */}
      <header className="dashboard-topbar-mobile hidden max-md:flex items-center justify-between fixed top-0 inset-x-0 z-[1100] px-4 border-b border-border-soft bg-bg-soft/90 backdrop-blur-md">
        <Link to="/library" className="flex items-center">
          <img src="/assets/images/logo.svg" alt="EZ Bac" className="h-7 w-auto block" />
        </Link>
        <div className="flex items-center gap-2">
          <LanguageSelector />
          <ThemeToggle />
          <UserMenu />
        </div>
      </header>

      <nav className="dashboard-navbar-bottom fixed top-0 border-b border-border-soft w-full flex justify-center z-[1000]">
        <div className="dashboard-container w-full flex items-center justify-between px-[26px] bg-bg-soft/70 backdrop-blur-[12px] rounded-[20px]">
          <div className="logo flex items-center gap-4">
            <Link to="/library">
              <img src="/assets/images/logo.svg" alt="EZ Bac" className="h-[100px] w-auto block" />
            </Link>
            <span className="w-px h-9 bg-border-soft" aria-hidden="true" />
          </div>

          <div className="dashboard-links flex gap-2 max-md:gap-5 overflow-x-auto no-scrollbar min-w-0">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end
                className={({ isActive }) =>
                  `dash-link flex items-center gap-2 no-underline text-ink text-base shrink-0 ${isActive ? 'active' : ''}`
                }
              >
                <Icon name={item.icon} className="w-[19px] h-[19px]" />
                <span>{t(item.key)}</span>
              </NavLink>
            ))}
          </div>

          <div className="nav-right flex items-center gap-2">
            <LanguageSelector />
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </nav>
    </>
  )
}
