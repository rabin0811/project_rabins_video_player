import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import VideoPlayer from '../components/VideoPlayer'
import PlaylistPanel from '../components/PlaylistPanel'

const RECENT_KEY = 'rvp-stream-history'

export default function Stream() {
  const navigate = useNavigate()
  const [url, setUrl] = useState('')
  const [resolving, setResolving] = useState(false)
  const [streamInfo, setStreamInfo] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [history, setHistory] = useState([])
  const [isDirectMode, setIsDirectMode] = useState(false)

  // Load history
  useEffect(() => {
    try {
      const saved = localStorage.getItem(RECENT_KEY)
      if (saved) setHistory(JSON.parse(saved))
    } catch {}
  }, [])

  const saveToHistory = (info) => {
    const entry = {
      url: info.direct_url || url,
      title: info.title || 'Direct Stream',
      thumbnail: info.thumbnail,
      extractor: info.extractor,
      timestamp: Date.now(),
    }
    setHistory(prev => {
      const filtered = prev.filter(h => h.url !== entry.url)
      const updated = [entry, ...filtered].slice(0, 20)
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated))
      return updated
    })
  }

  const resolve = useCallback(async () => {
    if (!url.trim()) return
    setResolving(true)
    setError('')
    setStreamInfo(null)
    setMessage('')

    try {
      // Try network stream resolution first
      const r = await axios.post('/api/stream/resolve', { url: url.trim() })
      const info = r.data.data
      setStreamInfo(info)
      setIsDirectMode(false)
      saveToHistory(info)
    } catch (e) {
      // If resolution fails, try as direct video URL
      const directUrl = url.trim()
      if (isDirectVideoUrl(directUrl)) {
        setStreamInfo({
          title: extractFilename(directUrl),
          direct_url: directUrl,
          thumbnail: null,
          duration: null,
          extractor: 'direct',
          webpage_url: directUrl,
        })
        setIsDirectMode(true)
        saveToHistory({ title: extractFilename(directUrl), direct_url: directUrl, extractor: 'direct' })
      } else {
        setError(e.response?.data?.detail || 'Failed to resolve stream. Try a direct video URL (.mp4, .webm, .m3u8, etc.)')
      }
    } finally {
      setResolving(false)
    }
  }, [url])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') resolve()
  }

  const addToPlaylist = async (playlist) => {
    if (!streamInfo) return
    try {
      await axios.post(`/api/playlists/${playlist.id}/items`, {
        title: streamInfo.title,
        url: streamInfo.direct_url,
        duration: streamInfo.duration,
        thumbnail_url: streamInfo.thumbnail,
      })
      setMessage(`Added to "${playlist.name}"`)
    } catch {
      setMessage('Failed to add to playlist')
    }
    setTimeout(() => setMessage(''), 3000)
  }

  const openInPlayer = () => {
    if (!streamInfo) return
    navigate(`/play?url=${encodeURIComponent(streamInfo.direct_url)}&title=${encodeURIComponent(streamInfo.title || 'Stream')}`)
  }

  const playFromHistory = (item) => {
    setUrl(item.url)
    setStreamInfo({
      title: item.title,
      direct_url: item.url,
      thumbnail: item.thumbnail,
      duration: null,
      extractor: item.extractor,
      webpage_url: item.url,
    })
    setIsDirectMode(isDirectVideoUrl(item.url))
    setError('')
  }

  const clearHistory = () => {
    localStorage.removeItem(RECENT_KEY)
    setHistory([])
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Network Stream</h1>
      <p className="text-text-muted mb-6">Stream video from YouTube, Vimeo, or any direct URL. Supports MP4, WebM, MKV, HLS (.m3u8), and more.</p>

      {/* URL Input */}
      <div className="bg-surface border border-border rounded-xl p-4 mb-6">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Paste video URL (YouTube, direct .mp4/.m3u8/.webm, etc.)"
              className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors pr-24"
            />
            {url && (
              <button
                onClick={() => { setUrl(''); setStreamInfo(null); setError('') }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text text-sm"
              >
                ✕
              </button>
            )}
          </div>
          <button
            onClick={resolve}
            disabled={resolving || !url.trim()}
            className="bg-primary hover:bg-primary-hover disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
          >
            {resolving ? (
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Resolving...
              </span>
            ) : 'Play'}
          </button>
        </div>
        {error && <p className="text-error text-sm mt-2">{error}</p>}
        {message && <p className="text-success text-sm mt-2">{message}</p>}

        {/* Quick format hints */}
        <div className="flex flex-wrap gap-2 mt-3">
          <span className="text-xs text-text-muted">Supported:</span>
          {['YouTube', 'Vimeo', 'Direct URL', '.mp4', '.webm', '.m3u8 (HLS)', '.mkv'].map(f => (
            <span key={f} className="text-xs bg-bg border border-border rounded px-2 py-0.5 text-text-muted">{f}</span>
          ))}
        </div>
      </div>

      {/* Player */}
      {streamInfo && (
        <div className="mb-6">
          <VideoPlayer
            source={{
              src: streamInfo.direct_url,
              type: streamInfo.direct_url?.includes('.m3u8') ? 'application/x-mpegURL' : 'video/mp4',
            }}
          />
          <div className="flex items-center justify-between mt-3">
            <div>
              <h2 className="font-semibold">{streamInfo.title || 'Untitled Stream'}</h2>
              <p className="text-xs text-text-muted">
                {streamInfo.extractor !== 'direct' ? `via ${streamInfo.extractor}` : 'Direct stream'}
                {streamInfo.duration ? ` · ${Math.floor(streamInfo.duration / 60)}:${Math.floor(streamInfo.duration % 60).toString().padStart(2, '0')}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={openInPlayer}
                className="text-xs bg-surface-hover border border-border rounded-lg px-3 py-1.5 hover:bg-primary/20 transition-colors text-text"
              >
                Full Player
              </button>
              <PlaylistPanel onSelect={addToPlaylist} />
            </div>
          </div>
        </div>
      )}

      {!streamInfo && !error && (
        <div className="bg-surface border border-border rounded-xl aspect-video flex items-center justify-center">
          <div className="text-center px-4">
            <div className="text-5xl mb-4 opacity-30">📡</div>
            {resolving ? (
              <p className="text-text-muted">Resolving stream URL...</p>
            ) : (
              <>
                <p className="text-text-muted mb-2">Paste a video URL above to start streaming</p>
                <p className="text-text-muted text-xs">Supports YouTube, Vimeo, and direct video URLs</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Stream History */}
      {history.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Streams</h2>
            <button
              onClick={clearHistory}
              className="text-xs text-text-muted hover:text-error transition-colors"
            >
              Clear All
            </button>
          </div>
          <div className="space-y-2">
            {history.map((item, idx) => (
              <button
                key={`${item.url}-${idx}`}
                onClick={() => playFromHistory(item)}
                className="w-full bg-surface border border-border rounded-xl p-3 text-left hover:bg-surface-hover hover:border-primary/30 transition-all flex items-center gap-3"
              >
                <span className="text-2xl shrink-0">
                  {item.extractor === 'direct' ? '🎬' : '🔗'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate text-text">{item.title || 'Untitled'}</p>
                  <p className="text-xs text-text-muted truncate">{item.url}</p>
                </div>
                <span className="text-xs text-text-muted shrink-0">
                  {timeAgo(item.timestamp)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function isDirectVideoUrl(url) {
  return /\.(mp4|webm|mkv|avi|mov|m3u8|ts|ogg|wav|flac|mp3)(\?|$)/i.test(url)
}

function extractFilename(url) {
  try {
    const path = new URL(url).pathname
    return decodeURIComponent(path.split('/').pop() || 'Direct Stream')
  } catch {
    return 'Direct Stream'
  }
}

function timeAgo(ts) {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}
