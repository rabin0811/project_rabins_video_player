import { useEffect } from 'react'
import { useApp } from '../context/AppContext'

const icons = {
  success: '✅',
  error: '❌',
  info: 'ℹ️',
}

const colors = {
  success: 'border-success/30',
  error: 'border-error/30',
  info: 'border-primary/30',
}

export default function ToastContainer() {
  const { state, dispatch } = useApp()

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {state.toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDone={() => dispatch({ type: 'REMOVE_TOAST', payload: t.id })} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onDone }) {
  useEffect(() => {
    const timer = setTimeout(onDone, toast.duration || 3500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border ${colors[toast.type] || colors.info} bg-surface shadow-xl animate-slide-in`}
      style={{ animation: 'slideIn 0.3s ease-out' }}
    >
      <span>{icons[toast.type] || icons.info}</span>
      <p className="text-sm">{toast.message}</p>
      <button onClick={onDone} className="ml-2 text-text-muted hover:text-text">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  )
}
