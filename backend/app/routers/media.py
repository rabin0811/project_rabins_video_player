from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, Header, Path
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.media import MediaFile
from app.utils.security import sanitize_path

router = APIRouter(prefix="/api/media", tags=["media"])

CHUNK_SIZE = 256 * 1024


@router.get("/{file_id}")
async def serve_media(
    file_id: int = Path(..., ge=1),
    range: str | None = Header(None),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(MediaFile).where(MediaFile.id == file_id))
    mf = result.scalar_one_or_none()
    if not mf:
        raise HTTPException(404, "File not found")

    fpath = Path(mf.path)
    try:
        sanitize_path(str(fpath))
    except ValueError:
        raise HTTPException(400, "Invalid file path")

    if not fpath.exists():
        raise HTTPException(404, "File not found on disk")

    file_size = fpath.stat().st_size
    mime = mf.mime_type or "application/octet-stream"

    if range:
        start, end = 0, file_size - 1
        try:
            range_val = range.replace("bytes=", "")
            parts = range_val.split("-")
            start = int(parts[0]) if parts[0] else 0
            end = int(parts[1]) if parts[1] else file_size - 1
        except (ValueError, IndexError):
            raise HTTPException(416, "Range Not Satisfiable")

        if start >= file_size or end >= file_size:
            raise HTTPException(416, "Range Not Satisfiable")

        content_length = end - start + 1

        async def ranged_stream():
            with open(fpath, "rb") as f:
                f.seek(start)
                remaining = content_length
                while remaining > 0:
                    chunk = f.read(min(CHUNK_SIZE, remaining))
                    if not chunk:
                        break
                    remaining -= len(chunk)
                    yield chunk

        return StreamingResponse(
            ranged_stream(),
            status_code=206,
            media_type=mime,
            headers={
                "Content-Range": f"bytes {start}-{end}/{file_size}",
                "Content-Length": str(content_length),
                "Accept-Ranges": "bytes",
            },
        )

    async def full_stream():
        with open(fpath, "rb") as f:
            while chunk := f.read(CHUNK_SIZE):
                yield chunk

    return StreamingResponse(
        full_stream(),
        media_type=mime,
        headers={
            "Content-Length": str(file_size),
            "Accept-Ranges": "bytes",
        },
    )
