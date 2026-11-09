import { createContext, useContext, useReducer, useEffect } from 'react'

const AppContext = createContext(null)

let toastId = 0

function appReducer(state, action) {
  switch (action.type) {
    case 'TOGGLE_THEME': {
      const theme = state.theme === 'dark' ? 'light' : 'dark'
      return { ...state, theme }
    }
    case 'SET_THEME':
      return { ...state, theme: action.payload }
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen }
    case 'SET_SIDEBAR':
      return { ...state, sidebarOpen: action.payload }
    case 'PLAY_TRACK':
      return {
        ...state,
        player: { ...state.player, currentTrack: action.payload, isPlaying: true },
      }
    case 'SET_PLAYING':
      return { ...state, player: { ...state.player, isPlaying: action.payload } }
    case 'SET_VOLUME':
      return { ...state, player: { ...state.player, volume: action.payload } }
    case 'SET_QUEUE':
      return { ...state, player: { ...state.player, queue: action.payload } }
    case 'NEXT_TRACK': {
      const { queue, currentTrack } = state.player
      if (!queue.length) return { ...state, player: { ...state.player, currentTrack: null, isPlaying: false } }
      const idx = currentTrack ? queue.findIndex(t => t.id === currentTrack.id) : -1
      const next = queue[idx + 1] || queue[0]
      return { ...state, player: { ...state.player, currentTrack: next, isPlaying: true } }
    }
    case 'PREV_TRACK': {
      const { queue, currentTrack } = state.player
      if (!queue.length) return state
      const idx = currentTrack ? queue.findIndex(t => t.id === currentTrack.id) : 0
      const prev = queue[idx - 1] || queue[queue.length - 1]
      return { ...state, player: { ...state.player, currentTrack: prev, isPlaying: true } }
    }
    case 'ADD_TOAST': {
      const id = ++toastId
      return { ...state, toasts: [...state.toasts, { id, type: action.payload.type || 'info', message: action.payload.message, duration: action.payload.duration || 3500 }] }
    }
    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) }
    default:
      return state
  }
}

const initialState = {
  theme: 'dark',
  sidebarOpen: true,
  toasts: [],
  player: {
    currentTrack: null,
    queue: [],
    isPlaying: false,
    volume: 0.8,
  },
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState, (initial) => {
    const saved = localStorage.getItem('rvp-theme')
    const vol = localStorage.getItem('rvp-volume')
    return {
      ...initial,
      theme: saved || 'dark',
      player: { ...initial.player, volume: vol ? parseFloat(vol) : 0.8 },
    }
  })

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('dark', 'light')
    root.classList.add(state.theme)
    localStorage.setItem('rvp-theme', state.theme)
  }, [state.theme])

  useEffect(() => {
    localStorage.setItem('rvp-volume', String(state.player.volume))
  }, [state.player.volume])

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
