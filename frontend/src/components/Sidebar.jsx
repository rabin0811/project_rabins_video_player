import { NavLink } from 'react-router-dom'
import { useApp } from '../context/AppContext'

const navItems = [
  {
    to: '/',
    label: 'Home',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    to: '/videos',
    label: 'Videos',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
    ),
  },
  {
    to: '/stream',
    label: 'Stream',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="1" />
        <path d="M20.2 20.2a8 8 0 0 0 0-16.4" />
        <path d="M17.6 17.6a5 5 0 0 0 0-11.2" />
        <path d="M6.4 6.4a5 5 0 0 0 0 11.2" />
        <path d="M3.8 3.8a8 8 0 0 0 0 16.4" />
      </svg>
    ),
  },
  {
    to: '/audio',
    label: 'Audio',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
    ),
  },
  {
    to: '/pictures',
    label: 'Pictures',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ),
  },
  {
    to: '/settings',
    label: 'Settings',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
]

export default function Sidebar() {
  const { state, dispatch } = useApp()

  return (
    <>
      {state.sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => dispatch({ type: 'SET_SIDEBAR', payload: false })}
        />
      )}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-30
          flex flex-col
          transition-all duration-300 ease-in-out
          bg-surface border-r border-border
          ${state.sidebarOpen ? 'w-60 translate-x-0' : 'w-0 -translate-x-full md:w-16 md:translate-x-0'}
        `}
      >
        <div className="flex items-center h-16 px-4 border-b border-border">
          <h1 className={`font-bold text-lg text-primary whitespace-nowrap ${!state.sidebarOpen && 'md:hidden'}`}>
            RVP
          </h1>
          <span className={`text-xs text-text-muted ml-1 ${!state.sidebarOpen && 'md:hidden'}`}>
            Rabins Player
          </span>
        </div>

        <nav className="flex-1 py-4 space-y-1 px-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => {
                if (window.innerWidth < 768) {
                  dispatch({ type: 'SET_SIDEBAR', payload: false })
                }
              }}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150 whitespace-nowrap
                ${isActive
                  ? 'bg-primary/15 text-primary'
                  : 'text-text-muted hover:bg-surface-hover hover:text-text'
                }
                ${!state.sidebarOpen && 'md:justify-center md:px-0'}
              `}
            >
              <span className="shrink-0">{item.icon}</span>
              <span className={`text-sm font-medium ${!state.sidebarOpen && 'md:hidden'}`}>
                {item.label}
              </span>
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-border">
          <button
            onClick={() => dispatch({ type: 'TOGGLE_THEME' })}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-text-muted hover:bg-surface-hover hover:text-text transition-colors text-sm ${!state.sidebarOpen && 'md:justify-center md:px-0'}`}
            title="Toggle theme"
          >
            <span className="shrink-0">
              {state.theme === 'dark' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              )}
            </span>
            <span className={`${!state.sidebarOpen && 'md:hidden'}`}>
              {state.theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
            </span>
          </button>
        </div>
      </aside>
    </>
  )
}
