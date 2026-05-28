import { useEffect } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { useLang } from '../contexts/LangContext.jsx'
import LangToggle from './LangToggle.jsx'

const items = [
  { to: '/home', icon: '/assets/icons/Home.svg', key: 'home', fallback: 'Home' },
  { to: '/library', icon: '/assets/icons/Library.svg', key: 'library', fallback: 'Library' },
  { to: '/pomodoro', icon: '/assets/icons/pomodoro.svg', key: 'pomodoro', fallback: 'Pomodoro' },
  { to: '/calculator', icon: '/assets/icons/calculator.svg', key: 'calculator', fallback: 'Calculator' },
  { to: '/games', icon: '/assets/icons/games.svg', key: 'courses', fallback: 'Games' }
]

export default function DashboardNavbar() {
  const { t } = useLang()

  useEffect(() => {
    document.body.classList.add('has-bottom-tab')
    return () => document.body.classList.remove('has-bottom-tab')
  }, [])

  return (
    <nav className="dashboard-navbar-bottom fixed top-0 border-b border-border-soft w-full flex justify-center z-[1000]">
      <div className="dashboard-container w-full flex items-center justify-between px-[26px] bg-white/60 backdrop-blur-[12px] rounded-[20px]">
        <div className="logo">
          <Link to="/home">
            <img src="/assets/images/logo.svg" alt="EZ Bac" className="h-[100px] w-auto block" />
          </Link>
        </div>

        <div className="dashboard-links flex gap-[50px] max-md:gap-5">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                `dash-link flex items-center gap-2 no-underline text-ink text-base ${isActive ? 'active' : ''}`
              }
            >
              <img src={item.icon} alt="" className="w-[21px]" />
              <span>{t(item.key) === item.key ? item.fallback : t(item.key)}</span>
            </NavLink>
          ))}
        </div>

        <div className="nav-right flex items-center gap-2">
          <LangToggle />
          <img src="/assets/icons/support.svg" className="w-[22px] cursor-pointer hover:scale-110" alt="Support" />
        </div>
      </div>
    </nav>
  )
}
