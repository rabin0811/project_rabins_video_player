import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import MediaCard from '../components/MediaCard'
import VideoPlayer from '../components/VideoPlayer'

export default function Videos() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [playing, setPlaying] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('filename')
  const perPage = 24

  const fetchVideos = useCallback(() => {
    setLoading(true)
    axios.get('/api/local/files', {
      params: { type: 'video', page, per_page: perPage, sort, order: 'asc', search: search || undefined }
    })
      .then((r) => { setItems(r.data.data.items); setTotal(r.data.data.total) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page, sort, search])

  useEffect(() => { fetchVideos() }, [fetchVideos])

  const playVideo = (item) => {
    navigate(`/play?id=${item.id}&title=${encodeURIComponent(item.filename)}`)
  }

  const totalPages = Math.ceil(total / perPage)

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Videos</h1>
          <p className="text-text-muted text-sm">{total} files</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Filter videos..."
            className="bg-bg border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary transition-colors w-48"
          />
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1) }}
            className="bg-bg border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary transition-colors"
          >
            <option value="filename">Name</option>
            <option value="size_bytes">Size</option>
            <option value="created_at">Date</option>
          </select>
        </div>
      </div>

      {/* Quick Player */}
      {playing && (
        <div className="mb-6">
          <VideoPlayer source={{ src: `/api/media/${playing.id}`, type: playing.mime_type }} />
          <div className="flex items-center justify-between mt-2">
            <p className="text-sm text-text-muted">Now playing: {playing.filename}</p>
            <button
              onClick={() => playVideo(playing)}
              className="text-xs text-primary hover:text-primary-hover transition-colors"
            >
              Open Full Player →
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="bg-surface border border-border rounded-xl overflow-hidden animate-pulse">
              <div className="aspect-video bg-border" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-border rounded w-3/4" />
                <div className="h-2 bg-border rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {items.map((item) => (
              <MediaCard
                key={item.id}
                item={item}
                onClick={() => playVideo(item)}
                onQuickPlay={(e) => { e.stopPropagation(); setPlaying(item) }}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 rounded bg-surface border border-border text-sm disabled:opacity-40 hover:bg-surface-hover transition-colors"
              >← Previous</button>
              <span className="text-sm text-text-muted">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded bg-surface border border-border text-sm disabled:opacity-40 hover:bg-surface-hover transition-colors"
              >Next →</button>
            </div>
          )}
        </>
      ) : (
        <div className="bg-surface border border-border rounded-xl p-12 text-center">
          <p className="text-text-muted text-lg mb-2">🎬 No videos found</p>
          <p className="text-text-muted text-sm">
            {search ? 'Try a different search term.' : 'Add media directories in Settings and run a scan.'}
          </p>
        </div>
      )}
    </div>
  )
}
