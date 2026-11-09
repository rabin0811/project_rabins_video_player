import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

export default function PlaylistPanel({ onSelect }) {
  const [playlists, setPlaylists] = useState([])
  const [open, setOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) return
    axios.get('/api/playlists').then((r) => setPlaylists(r.data.data))
  }, [open])

  const createPlaylist = async () => {
    if (!newName.trim()) return
    const r = await axios.post('/api/playlists', { name: newName.trim() })
    setPlaylists((prev) => [...prev, r.data.data])
    setNewName('')
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="text-sm text-primary hover:text-primary-hover transition-colors"
      >
        + Add to Playlist
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-surface border border-border rounded-xl shadow-xl z-30 p-3">
          <p className="text-xs font-medium text-text-muted mb-2 uppercase tracking-wider">Playlists</p>
          <div className="space-y-1 max-h-48 overflow-y-auto mb-3">
            {playlists.map((pl) => (
              <div key={pl.id} className="flex items-center gap-1">
                <button
                  onClick={() => { onSelect?.(pl); setOpen(false) }}
                  className="flex-1 text-left text-sm px-2 py-1.5 rounded hover:bg-surface-hover transition-colors truncate"
                >
                  {pl.name}
                  <span className="text-text-muted text-xs ml-2">({pl.item_count})</span>
                </button>
                <button
                  onClick={() => { navigate(`/playlist/${pl.id}`); setOpen(false) }}
                  className="text-text-muted hover:text-text p-1"
                  title="View playlist"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            ))}
            {!playlists.length && (
              <p className="text-xs text-text-muted px-2 py-1">No playlists yet</p>
            )}
          </div>
          <div className="flex gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New playlist name"
              className="flex-1 bg-bg border border-border rounded px-2 py-1.5 text-xs focus:outline-none focus:border-primary"
              onKeyDown={(e) => e.key === 'Enter' && createPlaylist()}
            />
            <button
              onClick={createPlaylist}
              className="bg-primary hover:bg-primary-hover text-white px-3 py-1.5 rounded text-xs font-medium"
            >
              Create
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
