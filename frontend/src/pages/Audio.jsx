import { useState, useEffect } from 'react'
import axios from 'axios'
import MediaCard from '../components/MediaCard'
import { useApp } from '../context/AppContext'

export default function Audio() {
  const { dispatch } = useApp()
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const perPage = 20

  useEffect(() => {
    setLoading(true)
    axios.get('/api/local/files', { params: { type: 'audio', page, per_page: perPage, sort: 'filename', order: 'asc' } })
      .then((r) => { setItems(r.data.data.items); setTotal(r.data.data.total) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page])

  const playTrack = (item) => {
    dispatch({ type: 'SET_QUEUE', payload: items })
    dispatch({ type: 'PLAY_TRACK', payload: { ...item, title: item.filename, url: `/api/media/${item.id}` } })
  }

  const totalPages = Math.ceil(total / perPage)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Audio Library</h1>
          <p className="text-text-muted text-sm">{total} files</p>
        </div>
      </div>

      {loading ? (
        <p className="text-text-muted">Loading...</p>
      ) : items.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {items.map((item) => (
              <MediaCard key={item.id} item={item} onClick={playTrack} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 rounded bg-surface border border-border text-sm disabled:opacity-40 hover:bg-surface-hover transition-colors"
              >Previous</button>
              <span className="text-sm text-text-muted">{page} / {totalPages}</span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded bg-surface border border-border text-sm disabled:opacity-40 hover:bg-surface-hover transition-colors"
              >Next</button>
            </div>
          )}
        </>
      ) : (
        <div className="bg-surface border border-border rounded-xl p-12 text-center">
          <p className="text-text-muted text-lg mb-2">🎵 No audio files found</p>
          <p className="text-text-muted text-sm">Add media directories in Settings and run a scan.</p>
        </div>
      )}
    </div>
  )
}
