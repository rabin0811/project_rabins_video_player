# project_rabins_video_player

## Rabin's Video Player

A browser-based media player with a React/Vite frontend and a FastAPI backend. It supports local video/audio/picture browsing, playlists, HLS playback, and settings.

- Original location: `D:\projects\new brouser base app`
- Working copy: `D:\PROJECTS_READY\project_rabins_video_player`
- Frontend: React 19, Vite 8, hls.js, Plyr, Howler
- Backend: FastAPI, SQLAlchemy async, SQLite, yt-dlp

## Folder layout

```text
project_rabins_video_player/
  frontend/   React/Vite application and production build
  backend/    FastAPI app, models, routers, and SQLite database
  database/   Database notes
  infra/      Deployment notes
  scripts/    Helper scripts
  docs/       Project documentation
```

## Setup

### Backend

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r backend\requirements.txt
Copy-Item .env.example backend\.env
python -m uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 8000
```

The backend creates `data/` and `media/` runtime folders as needed.

### Frontend

```powershell
cd frontend
npm ci
npm run build
```

The FastAPI backend serves `frontend/dist` at <http://localhost:8000>.

## Verified status (2026-11-09)

- [x] Backend dependencies installed
- [x] Missing `data/` and `media/` runtime folders added
- [x] FastAPI started on port 8000
- [x] `/api/health` and `/docs` returned HTTP 200
- [x] Frontend `npm run build` passed
- [x] Backend-served frontend returned HTTP 200 for `/`, `/videos`, `/audio`, `/pictures`, `/settings`
- [x] `/api/playlists` and `/api/local/files?per_page=5` returned HTTP 200
- [ ] Media streaming with a real large file not stress-tested

## Notes and limitations

- The production-style runtime is the FastAPI server serving `frontend/dist`; `next start` is not applicable.
- Local media paths are configured through `RVP_MEDIA_DIRS`.
- `yt-dlp` is included for URL-based media; network access and site support vary.
- Do not commit downloaded media, `.venv`, or the SQLite database.

## Troubleshooting

- **`data/` or `media/` missing**: create them or restart the backend; the app recreates required folders.
- **Frontend blank**: run `npm run build` in `frontend/` before starting FastAPI.
- **Port 8000 in use**: set `RVP_PORT` and restart.
- **Media not found**: add files under `media/` or update `RVP_MEDIA_DIRS`.
