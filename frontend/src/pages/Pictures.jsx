import { useState, useEffect } from 'react'
import axios from 'axios'
import ImageGallery from '../components/ImageGallery'

export default function Pictures() {
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get('/api/local/files', { params: { type: 'image', per_page: 100, sort: 'filename', order: 'asc' } })
      .then((r) => setImages(r.data.data.items))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Pictures</h1>
      <p className="text-text-muted mb-6">{images.length} files</p>

      {loading ? (
        <p className="text-text-muted">Loading...</p>
      ) : (
        <ImageGallery images={images} />
      )}
    </div>
  )
}
