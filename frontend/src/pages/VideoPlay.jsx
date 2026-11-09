import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import VideoPlayer from '../components/VideoPlayer'

export default function VideoPlay() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const videoId = searchParams.get('id')
  const streamUrl = searchParams.get('url')
  const title = searchParams.get('title') || 'Video'

  const [playlist, setPlaylist] = useState([])
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showInfo, setShowInfo] = useState(false)

  const currentVideo = currentIndex >= 0 ? playlist[currentIndex] : null

  // Load playlist from local files
  useEffect(() => {
    if (videoId) {
      setLoading(true)
      axios.get('/api/local/files', { params: { type: 'video', per_page: 100, sort: 'filename', order: 'asc' } })
        .then((r) => {
          const items = r.data.data.items
          setPlaylist(items)
          const idx = items.findIndex(v => String(v.id) === String(videoId))
          setCurrentIndex(idx >= 0 ? idx : 0)
        })
        .catch(() => setError('Failed to load video'))
        .finally(() => setLoading(false))
    }
  }, [videoId])

  const handleEnded = useCallback(() => {
    if (currentIndex < playlist.length - 1) {
      setCurrentIndex(prev => prev + 1)
    }
  }, [currentIndex, playlist.length])

  const handleNext = useCallback(() => {
    if (currentIndex < playlist.length - 1) {
      setCurrentIndex(prev => prev + 1)
    }
  }, [currentIndex, playlist.length])

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
  }, [currentIndex])

  // Update URL when video changes
  useEffect(() => {
    if (currentVideo) {
      const params = new URLSearchParams({ id: currentVideo.id, title: currentVideo.filename })
      navigate(`/play?${params.toString()}`, { replace: true })
    }
  }, [currentVideo?.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={() => navigate(-1)} className="text-white/70 hover:text-white text-sm">
            Go Back
          </button>
        </div>
      </div>
    )
  }

  // Network stream mode
  if (streamUrl) {
    return (
      <div className="min-h-screen bg-black">
        <div className="max-w-[1400px] mx-auto">
          <VideoPlayer
            source={{ src: streamUrl, type: 'video/mp4' }}
            autoPlay={true}
          />
          <div className="p-4">
            <h1 className="text-white text-lg font-semibold">{title}</h1>
            <button
              onClick={() => navigate(-1)}
              className="text-white/60 hover:text-white text-sm mt-2 flex items-center gap-1"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5m7-7l-7 7 7 7" />
              </svg>
              Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!currentVideo && playlist.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white/50">No video selected</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-[1400px] mx-auto flex">
        {/* Main Player */}
        <div className="flex-1 min-w-0">
          <VideoPlayer
            key={currentVideo?.id}
            source={{
              src: `/api/media/${currentVideo?.id}`,
              type: currentVideo?.mime_type || 'video/mp4',
            }}
            onEnded={handleEnded}
            onNext={handleNext}
            onPrev={handlePrev}
            hasNext={currentIndex < playlist.length - 1}
            hasPrev={currentIndex > 0}
            autoPlay={true}
          />

          {/* Video Info */}
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <h1 className="text-white text-lg font-semibold truncate">
                  {currentVideo?.filename || title}
                </h1>
                <p className="text-white/50 text-sm mt-1">
                  {currentVideo?.media_type === 'video' ? 'Local Video' : 'Network Stream'}
                  {currentVideo?.size_bytes ? ` · ${formatSize(currentVideo.size_bytes)}` : ''}
                  {currentIndex >= 0 && playlist.length > 1 ? ` · ${currentIndex + 1}/${playlist.length}` : ''}
                </p>
              </div>
              <button
                onClick={() => setShowInfo(!showInfo)}
                className="text-white/50 hover:text-white p-2"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4m0-4h.01" />
                </svg>
              </button>
            </div>

            {showInfo && currentVideo && (
              <div className="mt-4 bg-white/5 rounded-lg p-4 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-white/50">Format</span>
                  <span className="text-white">{currentVideo.mime_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Size</span>
                  <span className="text-white">{formatSize(currentVideo.size_bytes)}</span>
                </div>
                {currentVideo.width && currentVideo.height && (
                  <div className="flex justify-between">
                    <span className="text-white/50">Resolution</span>
                    <span className="text-white">{currentVideo.width}x{currentVideo.height}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-white/50">Path</span>
                  <span className="text-white text-right truncate ml-4 max-w-[60%]">{currentVideo.path}</span>
                </div>
              </div>
            )}

            <button
              onClick={() => navigate(-1)}
              className="text-white/60 hover:text-white text-sm mt-4 flex items-center gap-1"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5m7-7l-7 7 7 7" />
              </svg>
              Back to Videos
            </button>
          </div>
        </div>

        {/* Playlist Sidebar */}
        {playlist.length > 1 && (
          <div className="w-80 bg-surface border-l border-border hidden lg:block overflow-y-auto max-h-screen">
            <div className="p-3 border-b border-border sticky top-0 bg-surface z-10">
              <h3 className="text-sm font-semibold text-text">Up Next ({playlist.length})</h3>
            </div>
            <div className="divide-y divide-border">
              {playlist.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-full text-left p-3 hover:bg-surface-hover transition-colors flex items-center gap-3 ${
                    idx === currentIndex ? 'bg-primary/10 border-l-2 border-primary' : ''
                  }`}
                >
                  <span className="text-xs text-text-muted w-6 text-center shrink-0">
                    {idx === currentIndex ? (
                      <span className="inline-block w-2 h-2 bg-primary rounded-full animate-pulse" />
                    ) : (
                      idx + 1
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm truncate text-text">{item.filename}</p>
                    <p className="text-xs text-text-muted">
                      {formatSize(item.size_bytes)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function formatSize(bytes) {
  if (!bytes) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0, size = bytes
  while (size >= 1024 && i < units.length - 1) { size /= 1024; i++ }
  return `${size.toFixed(1)} ${units[i]}`
}
