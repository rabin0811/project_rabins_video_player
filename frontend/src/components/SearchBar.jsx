import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const typeRoutes = { video: '/videos', audio: '/audio', image: '/pictures' }

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()
  const debounceRef = useRef(null)

  const search = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); return }
    setLoading(true)
    try {
      const r = await axios.get('/api/local/files', { params: { search: q, per_page: 10 } })
      setResults(r.data.data.items)
      setOpen(true)
    } catch { setResults([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    clearTimeout(debounceRef.current)
    if (!query.trim()) { setResults([]); setOpen(false); return }
    debounceRef.current = setTimeout(() => search(query), 300)
    return () => clearTimeout(debounceRef.current)
  }, [query, search])

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const select = (item) => {
    setOpen(false)
    setQuery('')
    const route = typeRoutes[item.media_type] || '/videos'
    navigate(route)
  }

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search media..."
          className="w-full bg-bg border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
        />
        {loading && <span className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-surface border border-border rounded-xl shadow-xl z-40 max-h-72 overflow-y-auto">
          {results.map((item) => (
            <button
              key={item.id}
              onClick={() => select(item)}
              className="w-full text-left px-4 py-2.5 hover:bg-surface-hover transition-colors flex items-center gap-3 border-b border-border last:border-0"
            >
              <span className="text-lg">{item.media_type === 'video' ? '🎬' : item.media_type === 'audio' ? '🎵' : '🖼️'}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{item.filename}</p>
                <p className="text-xs text-text-muted capitalize">{item.media_type}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {open && query && !loading && !results.length && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-surface border border-border rounded-xl shadow-xl z-40 p-4 text-center text-sm text-text-muted">
          No results found
        </div>
      )}
    </div>
  )
}
