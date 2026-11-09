import { useEffect, useRef, useState } from 'react'
import { Howl } from 'howler'
import { useApp } from '../context/AppContext'

export default function AudioPlayer() {
  const { state, dispatch } = useApp()
  const howlRef = useRef(null)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentHowlId, setCurrentHowlId] = useState(null)

  const { currentTrack, isPlaying, volume, queue } = state.player

  useEffect(() => {
    if (!currentTrack) {
      setProgress(0)
      setDuration(0)
      return
    }
    const id = Date.now()
    setCurrentHowlId(id)

    howlRef.current?.unload()

    const howl = new Howl({
      src: [currentTrack.url],
      html5: true,
      volume,
      onload: () => {
        if (currentHowlId !== id) return
        setDuration(howl.duration())
      },
      onplay: () => {
        if (currentHowlId !== id) return
        dispatch({ type: 'SET_PLAYING', payload: true })
      },
      onpause: () => {
        if (currentHowlId !== id) return
        dispatch({ type: 'SET_PLAYING', payload: false })
      },
      onend: () => {
        if (currentHowlId !== id) return
        dispatch({ type: 'NEXT_TRACK' })
      },
    })

    howl.play()
    howlRef.current = howl

    return () => {
      howl.unload()
    }
  }, [currentTrack?.id])

  useEffect(() => {
    if (!howlRef.current) return
    howlRef.current.volume(volume)
  }, [volume])

  useEffect(() => {
    if (!howlRef.current) return
    if (isPlaying) {
      howlRef.current.play()
    } else {
      howlRef.current.pause()
    }
  }, [isPlaying])

  useEffect(() => {
    const interval = setInterval(() => {
      if (howlRef.current?.playing()) {
        setProgress(howlRef.current.seek())
      }
    }, 500)
    return () => clearInterval(interval)
  }, [currentTrack?.id])

  const seek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    const pos = pct * duration
    howlRef.current?.seek(pos)
    setProgress(pos)
  }

  const fmt = (s) => {
    if (!s || isNaN(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  if (!currentTrack) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{currentTrack.title}</p>
          <p className="text-xs text-text-muted">Now Playing</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => dispatch({ type: 'PREV_TRACK' })}
            className="text-text-muted hover:text-text p-1"
            disabled={!queue.length}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
          </button>

          <button
            onClick={() => dispatch({ type: isPlaying ? 'SET_PLAYING' : 'SET_PLAYING', payload: !isPlaying })}
            className="bg-primary hover:bg-primary-hover text-white p-2 rounded-full transition-colors"
          >
            {isPlaying ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zm8 0h4v16h-4z"/></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            )}
          </button>

          <button
            onClick={() => dispatch({ type: 'NEXT_TRACK' })}
            className="text-text-muted hover:text-text p-1"
            disabled={!queue.length}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-text-muted tabular-nums w-32">
          <span>{fmt(progress)}</span>
          <div className="flex-1 h-1 bg-border rounded-full cursor-pointer relative" onClick={seek}>
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }}
            />
          </div>
          <span>{fmt(duration)}</span>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => dispatch({ type: 'SET_VOLUME', payload: parseFloat(e.target.value) })}
            className="w-20 accent-primary"
          />
        </div>
      </div>
    </div>
  )
}
