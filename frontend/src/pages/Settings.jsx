import { useState, useEffect } from 'react'
import axios from 'axios'
import { useApp } from '../context/AppContext'

export default function Settings() {
  const { state, dispatch } = useApp()
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [totalFiles, setTotalFiles] = useState(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    axios.get('/api/settings')
      .then((r) => setSettings(r.data.data))
      .catch(() => setMessage('Failed to load settings'))
      .finally(() => setLoading(false))

    axios.get('/api/local/files?per_page=1')
      .then((r) => setTotalFiles(r.data.data.total))
      .catch(() => {})
  }, [])

  const handleSave = async () => {
    if (!settings) return
    setSaving(true)
    setMessage('')
    try {
      await axios.put('/api/settings', settings)
      setMessage('Settings saved')
    } catch {
      setMessage('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-text-muted">Loading settings...</p>
  if (!settings) return <p className="text-error">Failed to load settings</p>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Settings</h1>
      <p className="text-text-muted mb-6">Configure your media player.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface border border-border rounded-xl p-6 space-y-5">
          <h2 className="font-semibold text-lg">Media</h2>

          <div className="bg-bg/50 border border-border rounded-lg p-3 text-sm">
            <p className="text-text-muted mb-1">Auto-scanned directories:</p>
            <ul className="space-y-1">
              {settings.media_dirs?.map((d, i) => (
                <li key={i} className="text-xs text-text-muted flex items-center gap-2">
                  <span className="text-success">●</span> {d}
                </li>
              ))}
            </ul>
            {totalFiles !== null && (
              <p className="text-xs text-text-muted mt-2">
                {totalFiles} media files found
              </p>
            )}
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6 space-y-5">
          <h2 className="font-semibold text-lg">Appearance & Playback</h2>

          <div>
            <label className="block text-sm font-medium mb-1.5">Theme</label>
            <div className="flex gap-2">
              {['dark', 'light'].map((t) => (
                <button
                  key={t}
                  onClick={() => dispatch({ type: 'SET_THEME', payload: t })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                    state.theme === t ? 'bg-primary text-white' : 'bg-bg border border-border hover:bg-surface-hover'
                  }`}
                >
                  {t} Mode
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Default Volume</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={state.player.volume}
                onChange={(e) => dispatch({ type: 'SET_VOLUME', payload: parseFloat(e.target.value) })}
                className="flex-1 accent-primary"
              />
              <span className="text-xs text-text-muted w-8 text-right">{Math.round(state.player.volume * 100)}%</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Stream Timeout (seconds)</label>
            <input
              type="number"
              value={settings.stream_timeout ?? 30}
              onChange={(e) => setSettings({ ...settings, stream_timeout: parseInt(e.target.value) || 30 })}
              className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary hover:bg-primary-hover disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
        {message && (
          <p className={`text-sm ${message === 'Settings saved' ? 'text-success' : 'text-error'}`}>{message}</p>
        )}
      </div>
    </div>
  )
}
