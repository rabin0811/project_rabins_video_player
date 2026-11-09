import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import MediaCard from '../components/MediaCard'

const quickLinks = [
  { to: '/videos', label: 'Videos', icon: '🎬', desc: 'Your video library' },
  { to: '/stream', label: 'Network Stream', icon: '📡', desc: 'Stream from any URL' },
  { to: '/audio', label: 'Audio', icon: '🎵', desc: 'Your music collection' },
  { to: '/pictures', label: 'Pictures', icon: '🖼️', desc: 'Browse your photos' },
]

export default function Home() {
  const [recent, setRecent] = useState([])

  useEffect(() => {
    axios.get('/api/local/files', { params: { sort: 'created_at', order: 'desc', per_page: 6 } })
      .then((r) => setRecent(r.data.data.items))
      .catch(() => {})
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Welcome to Rabins Video Player</h1>
      <p className="text-text-muted mb-8">Your personal media hub for videos, music, and pictures.</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {quickLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="bg-surface border border-border rounded-xl p-4 hover:bg-surface-hover hover:border-primary/50 transition-all group"
          >
            <span className="text-2xl mb-2 block">{link.icon}</span>
            <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{link.label}</h3>
            <p className="text-text-muted text-xs mt-0.5">{link.desc}</p>
          </Link>
        ))}
      </div>

      <h2 className="text-lg font-semibold mb-4">Recently Added</h2>
      {recent.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {recent.map((item) => (
            <Link key={item.id} to={item.media_type === 'video' ? '/videos' : item.media_type === 'audio' ? '/audio' : '/pictures'}>
              <MediaCard item={item} onClick={() => {}} />
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl p-8 text-center">
          <p className="text-text-muted text-lg mb-2">No media yet</p>
          <p className="text-text-muted text-sm">
            Add media directories in{' '}
            <Link to="/settings" className="text-primary hover:underline">Settings</Link>
            {' '}and run a scan, or paste a stream URL.
          </p>
        </div>
      )}
    </div>
  )
}
