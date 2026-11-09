# Rabin's Video Player — Technical Notes

## Overview

A local media browser and player. The React/Vite frontend provides video, audio, picture, playlist, and settings screens. The FastAPI backend indexes local files, stores playlists/settings in SQLite, and serves the production frontend build.

## Architecture

```text
Browser (React/Vite)
  ├─ Video/audio/picture browsing
  ├─ Playlists and settings
  └─ API calls → FastAPI (port 8000)
        ├─ SQLAlchemy async + SQLite
        ├─ Local media scanning
        ├─ HLS/streaming helpers
        └─ Serves frontend/dist
```

## Folder structure

```text
project_rabins_video_player/
  frontend/   React app, Vite config, production dist
  backend/
    app/
      models/     SQLAlchemy models
      routers/    API routes
      utils/      media/stream helpers
      config.py   Settings from environment
      database.py Database setup
      main.py     FastAPI app
    requirements.txt
  data/       Runtime database/data folder
  media/      Local media files (not committed)
  docs/       Documentation
```

## Configuration

`backend/.env` or environment variables:

```dotenv
RVP_DEBUG=false
RVP_MEDIA_DIRS=["media"]
RVP_HOST=0.0.0.0
RVP_PORT=8000
RVP_STREAM_TIMEOUT=30
RVP_MAX_STREAM_SIZE_MB=1024
```

## Run

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r backend\requirements.txt
cd frontend
npm ci
npm run build
cd ..
python -m uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 8000
```

Open <http://localhost:8000>. The backend serves `frontend/dist`.

## API highlights

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Health check |
| `GET` | `/api/playlists` | Playlist list |
| `GET` | `/api/local/files` | Paginated local media listing |
| `GET` | `/docs` | Interactive OpenAPI docs |

Additional routers cover videos, audio, pictures, settings, streaming, and playlist items.

## Verification evidence (2026-11-09)

| Check | Result |
| --- | --- |
| Backend dependencies installed | Passed |
| Missing `data/` and `media/` folders added | Passed |
| FastAPI startup | Passed on port 8000 |
| `/api/health`, `/docs` | HTTP 200 |
| Frontend production build | Passed |
| `/`, `/videos`, `/audio`, `/pictures`, `/settings` | HTTP 200 |
| `/api/playlists`, `/api/local/files?per_page=5` | HTTP 200 |

## Known limitations

- Large-file streaming and codec coverage were not stress-tested.
- `yt-dlp` support depends on external sites and network access.
- Media files are not committed; the app is empty until you add files.
- The SQLite database and runtime data are local-only.

## Publishing notes

- Exclude `.venv/`, `node_modules/`, `frontend/dist/`, `data/`, and `media/`.
- Do not commit downloaded media or personal files.
