const typeConfig = {
  video: { icon: '🎬', bg: 'from-blue-900/40 to-purple-900/40' },
  audio: { icon: '🎵', bg: 'from-green-900/40 to-teal-900/40' },
  image: { icon: '🖼️', bg: 'from-amber-900/40 to-orange-900/40' },
}

function formatSize(bytes) {
  if (!bytes) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0, size = bytes
  while (size >= 1024 && i < units.length - 1) { size /= 1024; i++ }
  return `${size.toFixed(1)} ${units[i]}`
}

function formatDuration(seconds) {
  if (!seconds) return ''
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function MediaCard({ item, onClick, onQuickPlay }) {
  const cfg = typeConfig[item.media_type] || typeConfig.video

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden hover:bg-surface-hover hover:border-primary/50 transition-all duration-200 text-left group cursor-pointer"
      onClick={() => onClick?.(item)}
    >
      <div className={`aspect-video bg-gradient-to-br ${cfg.bg} flex items-center justify-center relative`}>
        {/* Icon */}
        <span className="text-4xl opacity-60 group-hover:scale-110 group-hover:opacity-90 transition-all duration-200 z-10">
          {cfg.icon}
        </span>

        {/* Play overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-center justify-center">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 transform scale-75 group-hover:scale-100">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>

        {/* Duration badge */}
        {item.media_type === 'video' && item.duration && (
          <span className="absolute bottom-2 right-2 bg-black/70 text-xs px-2 py-0.5 rounded z-10">
            {formatDuration(item.duration)}
          </span>
        )}

        {/* Quick play button */}
        {onQuickPlay && item.media_type === 'video' && (
          <button
            onClick={(e) => { e.stopPropagation(); onQuickPlay(e) }}
            className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-all z-20"
            title="Quick play in page"
          >
            ▶ Quick
          </button>
        )}

        {/* Format badge */}
        {item.mime_type && (
          <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
            {item.mime_type.split('/')[1]?.toUpperCase() || item.mime_type.split('/')[0]}
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="text-sm font-medium truncate" title={item.filename}>{item.filename}</p>
        <p className="text-xs text-text-muted mt-1">
          {item.media_type.charAt(0).toUpperCase() + item.media_type.slice(1)}
          {item.size_bytes ? ` · ${formatSize(item.size_bytes)}` : ''}
          {item.width && item.height ? ` · ${item.width}x${item.height}` : ''}
        </p>
      </div>
    </div>
  )
}
