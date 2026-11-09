import { useEffect, useRef, useState, useCallback } from 'react'
import Hls from 'hls.js'

export default function VideoPlayer({
  source,
  options = {},
  onEnded,
  onNext,
  onPrev,
  hasNext = false,
  hasPrev = false,
  autoPlay = true,
}) {
  const videoRef = useRef(null)
  const containerRef = useRef(null)
  const hlsRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [quality, setQuality] = useState(-1)
  const [qualities, setQualities] = useState([])
  const [isPip, setIsPip] = useState(false)
  const [buffered, setBuffered] = useState(0)
  const [isLive, setIsLive] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const [showQualityMenu, setShowQualityMenu] = useState(false)
  const [isMiniPlayer, setIsMiniPlayer] = useState(false)
  const controlsTimeoutRef = useRef(null)
  const progressRef = useRef(null)

  const speedOptions = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]

  // Initialize HLS or native video
  useEffect(() => {
    const video = videoRef.current
    if (!video || !source?.src) return

    // Cleanup previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }

    const src = source.src
    const isHls = src.includes('.m3u8') || source.type === 'application/x-mpegURL'

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        startLevel: -1, // auto quality
        capLevelToPlayerSize: true,
      })
      hlsRef.current = hls
      hls.loadSource(src)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        const levels = data.levels.map((l, i) => ({
          index: i,
          height: l.height,
          width: l.width,
          bitrate: l.bitrate,
          label: `${l.height}p`,
        }))
        setQualities(levels)
        if (autoPlay) video.play().catch(() => {})
      })
      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        setQuality(data.level)
      })
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            hls.startLoad()
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError()
          }
        }
      })
    } else if (isHls && video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = src
      if (autoPlay) video.play().catch(() => {})
    } else {
      // Native playback for MP4, WebM, etc.
      video.src = src
      video.type = source.type || 'video/mp4'
      if (autoPlay) video.play().catch(() => {})
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [source?.src])

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime)
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1))
      }
    }
    const onDurationChange = () => {
      setDuration(video.duration)
      setIsLive(!isFinite(video.duration) || video.duration === 0)
    }
    const onVolumeChange = () => {
      setVolume(video.volume)
      setIsMuted(video.muted)
    }
    const onEndedHandler = () => {
      setIsPlaying(false)
      onEnded?.()
    }
    const onRateChange = () => setSpeed(video.playbackRate)
    const onEnterPictureInPicture = () => setIsPip(true)
    const onLeavePictureInPicture = () => setIsPip(false)

    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    video.addEventListener('timeupdate', onTimeUpdate)
    video.addEventListener('durationchange', onDurationChange)
    video.addEventListener('volumechange', onVolumeChange)
    video.addEventListener('ended', onEndedHandler)
    video.addEventListener('ratechange', onRateChange)
    video.addEventListener('enterpictureinpicture', onEnterPictureInPicture)
    video.addEventListener('leavepictureinpicture', onLeavePictureInPicture)

    return () => {
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
      video.removeEventListener('timeupdate', onTimeUpdate)
      video.removeEventListener('durationchange', onDurationChange)
      video.removeEventListener('volumechange', onVolumeChange)
      video.removeEventListener('ended', onEndedHandler)
      video.removeEventListener('ratechange', onRateChange)
      video.removeEventListener('enterpictureinpicture', onEnterPictureInPicture)
      video.removeEventListener('leavepictureinpicture', onLeavePictureInPicture)
    }
  }, [onEnded])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      const video = videoRef.current
      if (!video) return

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault()
          video.paused ? video.play() : video.pause()
          break
        case 'ArrowLeft':
          e.preventDefault()
          video.currentTime = Math.max(0, video.currentTime - 10)
          break
        case 'ArrowRight':
          e.preventDefault()
          video.currentTime = Math.min(video.duration || 0, video.currentTime + 10)
          break
        case 'ArrowUp':
          e.preventDefault()
          video.volume = Math.min(1, video.volume + 0.1)
          break
        case 'ArrowDown':
          e.preventDefault()
          video.volume = Math.max(0, video.volume - 0.1)
          break
        case 'f':
          e.preventDefault()
          toggleFullscreen()
          break
        case 'm':
          e.preventDefault()
          video.muted = !video.muted
          break
        case 'j':
          e.preventDefault()
          video.currentTime = Math.max(0, video.currentTime - 10)
          break
        case 'l':
          e.preventDefault()
          video.currentTime = Math.min(video.duration || 0, video.currentTime + 10)
          break
        case '0':
        case 'Home':
          e.preventDefault()
          video.currentTime = 0
          break
        case '5':
          e.preventDefault()
          if (video.duration) video.currentTime = video.duration * 0.5
          break
        case 'End':
          e.preventDefault()
          if (video.duration) video.currentTime = video.duration
          break
        case 'p':
          e.preventDefault()
          togglePip()
          break
        case 'n':
          e.preventDefault()
          if (hasNext) onNext?.()
          break
        case 'N':
          e.preventDefault()
          if (hasPrev) onPrev?.()
          break
        case '>':
          e.preventDefault()
          video.playbackRate = Math.min(2, video.playbackRate + 0.25)
          break
        case '<':
          e.preventDefault()
          video.playbackRate = Math.max(0.25, video.playbackRate - 0.25)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hasNext, hasPrev, onNext, onPrev])

  // Auto-hide controls
  const resetControlsTimeout = useCallback(() => {
    setShowControls(true)
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false)
    }, 3000)
  }, [isPlaying])

  useEffect(() => {
    if (isPlaying) {
      resetControlsTimeout()
    } else {
      setShowControls(true)
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
    }
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
    }
  }, [isPlaying, resetControlsTimeout])

  // Fullscreen change listener
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    video.paused ? video.play() : video.pause()
  }

  const toggleFullscreen = async () => {
    const el = containerRef.current
    if (!el) return
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      } else {
        await el.requestFullscreen()
      }
    } catch {}
  }

  const togglePip = async () => {
    const video = videoRef.current
    if (!video) return
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
      } else if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture()
      }
    } catch {}
  }

  const seek = (e) => {
    const rect = progressRef.current?.getBoundingClientRect()
    if (!rect || !videoRef.current || !isFinite(duration)) return
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    videoRef.current.currentTime = pct * duration
  }

  const formatTime = (s) => {
    if (!s || !isFinite(s)) return '0:00'
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = Math.floor(s % 60)
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const setQualityLevel = (level) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = level
      setQuality(level)
    }
    setShowQualityMenu(false)
  }

  const setPlaybackSpeed = (s) => {
    if (videoRef.current) videoRef.current.playbackRate = s
    setShowSpeedMenu(false)
  }

  return (
    <div
      ref={containerRef}
      className="w-full aspect-video bg-black rounded-xl overflow-hidden relative group"
      onMouseMove={resetControlsTimeout}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        playsInline
        className="w-full h-full"
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
        style={{ cursor: showControls ? 'default' : 'none' }}
      />

      {/* Big Play Button */}
      {!isPlaying && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center z-10"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </button>
      )}

      {/* Controls Overlay */}
      <div
        className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-16 pb-3 px-3 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Progress Bar */}
        <div
          ref={progressRef}
          onClick={seek}
          className="w-full h-1.5 bg-white/20 rounded-full cursor-pointer mb-3 group/progress hover:h-2 transition-all relative"
        >
          {/* Buffered */}
          {isFinite(duration) && duration > 0 && (
            <div
              className="absolute h-full bg-white/20 rounded-full"
              style={{ width: `${(buffered / duration) * 100}%` }}
            />
          )}
          {/* Progress */}
          <div
            className="absolute h-full bg-primary rounded-full"
            style={{ width: `${isFinite(duration) && duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
          />
          {/* Hover time */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/progress:opacity-100 transition-opacity">
            {formatTime(currentTime)}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Play/Pause */}
          <button onClick={togglePlay} className="text-white hover:text-primary transition-colors">
            {isPlaying ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 4h4v16H6zm8 0h4v16h-4z" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Previous */}
          {hasPrev && (
            <button onClick={onPrev} className="text-white/70 hover:text-white transition-colors" title="Previous (Shift+N)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
              </svg>
            </button>
          )}

          {/* Next */}
          {hasNext && (
            <button onClick={onNext} className="text-white/70 hover:text-white transition-colors" title="Next (N)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
              </svg>
            </button>
          )}

          {/* Volume */}
          <div className="hidden sm:flex items-center gap-2">
            <button onClick={() => videoRef.current && (videoRef.current.muted = !videoRef.current.muted)} className="text-white/80 hover:text-white transition-colors">
              {isMuted || volume === 0 ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              ) : volume < 0.5 ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                const v = parseFloat(e.target.value)
                if (videoRef.current) {
                  videoRef.current.volume = v
                  videoRef.current.muted = v === 0
                }
              }}
              className="w-16 sm:w-20 accent-primary h-1"
            />
          </div>

          {/* Time */}
          <span className="text-white/80 text-xs sm:text-sm tabular-nums font-medium">
            {formatTime(currentTime)}
            {!isLive && <span> / {formatTime(duration)}</span>}
            {isLive && <span className="text-red-400 ml-1">LIVE</span>}
          </span>

          <div className="flex-1" />

          {/* Quality */}
          {qualities.length > 0 && (
            <div className="relative">
              <button
                onClick={() => { setShowQualityMenu(!showQualityMenu); setShowSpeedMenu(false) }}
                className="text-white/80 hover:text-white text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors"
              >
                {quality === -1 ? 'AUTO' : qualities[quality]?.label || 'HD'}
              </button>
              {showQualityMenu && (
                <div className="absolute bottom-full mb-2 right-0 bg-black/90 rounded-lg overflow-hidden min-w-[120px]">
                  <button
                    onClick={() => setQualityLevel(-1)}
                    className={`block w-full text-left px-3 py-2 text-xs hover:bg-white/10 ${quality === -1 ? 'text-primary' : 'text-white'}`}
                  >
                    Auto
                  </button>
                  {qualities.map((q) => (
                    <button
                      key={q.index}
                      onClick={() => setQualityLevel(q.index)}
                      className={`block w-full text-left px-3 py-2 text-xs hover:bg-white/10 ${quality === q.index ? 'text-primary' : 'text-white'}`}
                    >
                      {q.label} ({Math.round(q.bitrate / 1000)}kbps)
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Speed */}
          <div className="relative">
            <button
              onClick={() => { setShowSpeedMenu(!showSpeedMenu); setShowQualityMenu(false) }}
              className="text-white/80 hover:text-white text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors"
            >
              {speed}x
            </button>
            {showSpeedMenu && (
              <div className="absolute bottom-full mb-2 right-0 bg-black/90 rounded-lg overflow-hidden min-w-[80px]">
                {speedOptions.map((s) => (
                  <button
                    key={s}
                    onClick={() => setPlaybackSpeed(s)}
                    className={`block w-full text-left px-3 py-2 text-xs hover:bg-white/10 ${speed === s ? 'text-primary' : 'text-white'}`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* PiP */}
          <button
            onClick={togglePip}
            className="hidden sm:block text-white/80 hover:text-white transition-colors"
            title="Picture in Picture (P)"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <rect x="11" y="9" width="9" height="7" rx="1" fill="currentColor" opacity="0.5" />
            </svg>
          </button>

          {/* Fullscreen */}
          <button onClick={toggleFullscreen} className="text-white/80 hover:text-white transition-colors" title="Fullscreen (F)">
            {isFullscreen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m20-2h-3a2 2 0 0 1-2 2v3m0 10v3a2 2 0 0 1-2 2h-3M3 16v3a2 2 0 0 0 2 2h3" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Click-to-play overlay for pause state */}
      {isPlaying && !showControls && (
        <div className="absolute inset-0 z-5" onClick={togglePlay} />
      )}
    </div>
  )
}
