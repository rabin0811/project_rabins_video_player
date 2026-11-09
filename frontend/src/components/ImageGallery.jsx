import { useState, useEffect, useCallback } from 'react'

export default function ImageGallery({ images }) {
  const [open, setOpen] = useState(false)
  const [idx, setIdx] = useState(0)

  const current = images[idx]

  const next = useCallback(() => setIdx((i) => (i + 1) % images.length), [images.length])
  const prev = useCallback(() => setIdx((i) => (i - 1 + images.length) % images.length), [images.length])

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (e.key === 'Escape') setOpen(false)
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, next, prev])

  if (!images?.length) {
    return (
      <div className="bg-surface border border-border rounded-xl p-12 text-center">
        <p className="text-text-muted text-lg mb-2">🖼️ No images found</p>
        <p className="text-text-muted text-sm">Add media directories in Settings and scan for image files.</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {images.map((img, i) => (
          <button
            key={img.id}
            onClick={() => { setIdx(i); setOpen(true) }}
            className="aspect-square bg-surface border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-colors group"
          >
            <img
              src={`/api/media/${img.id}`}
              alt={img.filename}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              loading="lazy"
            />
          </button>
        ))}
      </div>

      <dialog
        open={open}
        className="fixed inset-0 z-50 bg-black/90 border-0 p-0 m-0 w-full h-full max-w-full max-h-full open:flex open:items-center open:justify-center"
        onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
      >
        {current && (
          <div className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center">
            <button
              onClick={prev}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2 text-3xl z-10"
            >‹</button>
            <img
              src={`/api/media/${current.id}`}
              alt={current.filename}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
            <button
              onClick={next}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2 text-3xl z-10"
            >›</button>
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-white/70 hover:text-white p-2 z-10"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
              {current.filename} · {idx + 1} / {images.length}
            </p>
          </div>
        )}
      </dialog>
    </>
  )
}
