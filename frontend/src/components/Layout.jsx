import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import AudioPlayer from './AudioPlayer'
import SearchBar from './SearchBar'
import ErrorBoundary from './ErrorBoundary'
import ToastContainer from './Toast'
import { useApp } from '../context/AppContext'

export default function Layout() {
  const { state, dispatch } = useApp()
  const hasPlayer = !!state.player.currentTrack

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="md:hidden flex items-center h-14 px-4 border-b border-border bg-surface sticky top-0 z-10">
          <button
            onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
            className="text-text-muted hover:text-text p-1"
            aria-label="Toggle sidebar"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <h1 className="ml-3 font-semibold text-sm">Rabins Video Player</h1>
        </div>
        <div className="p-6 pb-24">
          <div className="mb-6">
            <SearchBar />
          </div>
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>
      <AudioPlayer />
      <ToastContainer />
    </div>
  )
}
