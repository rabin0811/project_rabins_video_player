import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useApp } from '../context/AppContext'

export default function PlaylistDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { dispatch } = useApp()
  const [playlist, setPlaylist] = useState(null)
  const [items, setItems] = useState([])
  const [dragIdx, setDragIdx] = useState(null)

  useEffect(() => {
    axios.get(`/api/playlists/${id}`)
      .then((r) => { setPlaylist(r.data.data); setItems(r.data.data.items) })
      .catch(() => navigate('/'))
  }, [id])

  const handleDragStart = (idx) => setDragIdx(idx)

  const handleDragOver = (e, idx) => {
    e.preventDefault()
    if (dragIdx === null || dragIdx === idx) return
    const newItems = [...items]
    const [moved] = newItems.splice(dragIdx, 1)
    newItems.splice(idx, 0, moved)
    setItems(newItems)
    setDragIdx(idx)
  }

  const handleDragEnd = async () => {
    setDragIdx(null)
    try {
      await axios.patch(`/api/playlists/${id}/items/reorder`, { item_ids: items.map((i) => i.id) })
    } catch {}
  }

  const removeItem = async (itemId) => {
    try {
      await axios.delete(`/api/playlists/${id}/items/${itemId}`)
      setItems((prev) => prev.filter((i) => i.id !== itemId))
    } catch {}
  }

  if (!playlist) return <p className="text-text-muted">Loading...</p>

  return (
    <div>
      <button onClick={() => navigate(-1)} className="text-text-muted hover:text-text text-sm mb-4 flex items-center gap-1">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
        Back
      </button>
      <h1 className="text-2xl font-bold mb-1">{playlist.name}</h1>
      <p className="text-text-muted text-sm mb-6">{items.length} items</p>

      {items.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-12 text-center">
          <p className="text-text-muted">No items in this playlist yet.</p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          {items.map((item, idx) => (
            <div
              key={item.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-3 px-4 py-3 border-b border-border last:border-0 cursor-grab active:cursor-grabbing hover:bg-surface-hover transition-colors ${dragIdx === idx ? 'opacity-50' : ''}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted shrink-0">
                <line x1="8" y1="6" x2="16" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="8" y1="18" x2="16" y2="18" />
              </svg>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{item.title}</p>
                {item.url && <p className="text-xs text-text-muted truncate">{item.url}</p>}
              </div>
              <span className="text-xs text-text-muted tabular-nums">{idx + 1}</span>
              <button
                onClick={() => removeItem(item.id)}
                className="text-text-muted hover:text-error p-1 transition-colors"
                title="Remove from playlist"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
