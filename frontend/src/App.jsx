import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import Videos from './pages/Videos'
import Stream from './pages/Stream'
import VideoPlay from './pages/VideoPlay'
import Audio from './pages/Audio'
import Pictures from './pages/Pictures'
import Settings from './pages/Settings'
import PlaylistDetail from './pages/PlaylistDetail'

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="videos" element={<Videos />} />
            <Route path="stream" element={<Stream />} />
            <Route path="audio" element={<Audio />} />
            <Route path="pictures" element={<Pictures />} />
            <Route path="settings" element={<Settings />} />
            <Route path="playlist/:id" element={<PlaylistDetail />} />
          </Route>
          <Route path="play" element={<VideoPlay />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  )
}
