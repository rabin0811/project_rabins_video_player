import asyncio
import logging
import time
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

from app.config import settings
from app.database import init_db, get_db
from app.utils.scanner import scan_media
from app.utils.security import rate_limiter
from app.routers.settings import router as settings_router
from app.routers.local import router as local_router
from app.routers.media import router as media_router
from app.routers.playlists import router as playlists_router
from app.routers.stream import router as stream_router

logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("rvp")


async def run_startup_scan():
    logger.info("Auto-scanning media directories: %s", settings.media_dirs)
    async for session in get_db():
        result = await scan_media(session)
    logger.info("Auto-scan complete: %s", result)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Rabins Video Player")
    await init_db()
    asyncio.create_task(run_startup_scan())
    yield
    logger.info("Shutting down")


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def security_and_logging(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    elapsed = (time.perf_counter() - start) * 1000

    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Permissions-Policy"] = "microphone=(self), camera=(), geolocation=()"
    response.headers["Cross-Origin-Resource-Policy"] = "same-origin"

    logger.info("%s %s -> %d (%.1fms)", request.method, request.url.path, response.status_code, elapsed)
    return response


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"ok": False, "error": exc.detail},
    )


app.include_router(settings_router)
app.include_router(local_router)
app.include_router(media_router)
app.include_router(playlists_router)
app.include_router(stream_router)


@app.websocket("/ws/scan")
async def scan_websocket(websocket: WebSocket):
    await websocket.accept()
    logger.info("Scan WebSocket connected")

    async def send_progress(name: str, current: int, total: int):
        try:
            await websocket.send_json({"type": "progress", "current": current, "total": total, "file": name})
        except Exception:
            pass

    try:
        async for _ in websocket.iter_text():
            async for session in get_db():
                result = await scan_media(session, progress_cb=send_progress)
            await websocket.send_json({"type": "done", "data": result})
    except WebSocketDisconnect:
        logger.info("Scan WebSocket disconnected")


@app.get("/api/health")
async def health_check():
    return {"ok": True, "status": "healthy", "app": settings.app_name}


frontend_dir = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if frontend_dir.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dir)), name="frontend")

    @app.middleware("http")
    async def spa_fallback(request: Request, call_next):
        response = await call_next(request)
        if response.status_code == 404 and not request.url.path.startswith("/api/") and not request.url.path.startswith("/ws/"):
            index = frontend_dir / "index.html"
            if index.exists():
                return FileResponse(str(index))
        return response
