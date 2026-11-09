from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.media import MediaFile
from app.utils.scanner import scan_media

router = APIRouter(prefix="/api/local", tags=["local"])


@router.get("/files")
async def list_files(
    type: str | None = Query(None, pattern="^(video|audio|image)$"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    sort: str = Query("filename", pattern="^(filename|size_bytes|created_at|media_type)$"),
    order: str = Query("asc", pattern="^(asc|desc)$"),
    search: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    query = select(MediaFile)
    count_query = select(func.count(MediaFile.id))

    if type:
        query = query.where(MediaFile.media_type == type)
        count_query = count_query.where(MediaFile.media_type == type)

    if search:
        like = f"%{search}%"
        query = query.where(MediaFile.filename.ilike(like))
        count_query = count_query.where(MediaFile.filename.ilike(like))

    total = (await db.execute(count_query)).scalar() or 0

    sort_col = getattr(MediaFile, sort, MediaFile.filename)
    query = query.order_by(sort_col.asc() if order == "asc" else sort_col.desc())

    offset = (page - 1) * per_page
    query = query.offset(offset).limit(per_page)

    rows = (await db.execute(query)).scalars().all()
    items = [
        {
            "id": r.id,
            "filename": r.filename,
            "path": r.path,
            "mime_type": r.mime_type,
            "media_type": r.media_type,
            "size_bytes": r.size_bytes,
            "duration": r.duration,
            "width": r.width,
            "height": r.height,
            "thumbnail_path": r.thumbnail_path,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in rows
    ]

    return {
        "ok": True,
        "data": {
            "items": items,
            "total": total,
            "page": page,
            "per_page": per_page,
        },
    }


@router.post("/scan")
async def trigger_scan(db: AsyncSession = Depends(get_db)):
    result = await scan_media(db)
    return {"ok": True, "data": result}
