from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.database import get_db
from app.models.playlist import Playlist, PlaylistItem

router = APIRouter(prefix="/api/playlists", tags=["playlists"])


class CreatePlaylistBody(BaseModel):
    name: str
    description: str | None = None


class UpdatePlaylistBody(BaseModel):
    name: str | None = None
    description: str | None = None


class AddItemBody(BaseModel):
    title: str
    url: str | None = None
    media_file_id: int | None = None
    duration: float | None = None
    thumbnail_url: str | None = None


class ReorderBody(BaseModel):
    item_ids: list[int]


@router.get("")
async def list_playlists(db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(
        select(Playlist).order_by(Playlist.updated_at.desc())
    )).scalars().all()

    result = []
    for p in rows:
        count = (await db.execute(
            select(func.count(PlaylistItem.id)).where(PlaylistItem.playlist_id == p.id)
        )).scalar() or 0
        result.append({
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "is_local": p.is_local,
            "item_count": count,
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "updated_at": p.updated_at.isoformat() if p.updated_at else None,
        })

    return {"ok": True, "data": result}


@router.post("")
async def create_playlist(body: CreatePlaylistBody, db: AsyncSession = Depends(get_db)):
    pl = Playlist(name=body.name, description=body.description)
    db.add(pl)
    await db.commit()
    await db.refresh(pl)
    return {"ok": True, "data": {"id": pl.id, "name": pl.name}}


@router.get("/{playlist_id}")
async def get_playlist(playlist_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Playlist).where(Playlist.id == playlist_id))
    pl = result.scalar_one_or_none()
    if not pl:
        raise HTTPException(404, "Playlist not found")

    items = (await db.execute(
        select(PlaylistItem)
        .where(PlaylistItem.playlist_id == playlist_id)
        .order_by(PlaylistItem.position)
    )).scalars().all()

    return {
        "ok": True,
        "data": {
            "id": pl.id,
            "name": pl.name,
            "description": pl.description,
            "is_local": pl.is_local,
            "created_at": pl.created_at.isoformat() if pl.created_at else None,
            "updated_at": pl.updated_at.isoformat() if pl.updated_at else None,
            "items": [
                {
                    "id": i.id,
                    "title": i.title,
                    "url": i.url,
                    "media_file_id": i.media_file_id,
                    "position": i.position,
                    "duration": i.duration,
                    "thumbnail_url": i.thumbnail_url,
                    "created_at": i.created_at.isoformat() if i.created_at else None,
                }
                for i in items
            ],
        },
    }


@router.put("/{playlist_id}")
async def update_playlist(playlist_id: int, body: UpdatePlaylistBody, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Playlist).where(Playlist.id == playlist_id))
    pl = result.scalar_one_or_none()
    if not pl:
        raise HTTPException(404, "Playlist not found")
    if body.name is not None:
        pl.name = body.name
    if body.description is not None:
        pl.description = body.description
    await db.commit()
    return {"ok": True, "data": {"id": pl.id, "name": pl.name}}


@router.delete("/{playlist_id}")
async def delete_playlist(playlist_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Playlist).where(Playlist.id == playlist_id))
    pl = result.scalar_one_or_none()
    if not pl:
        raise HTTPException(404, "Playlist not found")
    await db.delete(pl)
    await db.commit()
    return {"ok": True, "data": {"deleted": playlist_id}}


@router.post("/{playlist_id}/items")
async def add_item(playlist_id: int, body: AddItemBody, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Playlist).where(Playlist.id == playlist_id))
    if not result.scalar_one_or_none():
        raise HTTPException(404, "Playlist not found")

    max_pos = (await db.execute(
        select(func.coalesce(func.max(PlaylistItem.position), -1))
        .where(PlaylistItem.playlist_id == playlist_id)
    )).scalar() or -1

    item = PlaylistItem(
        playlist_id=playlist_id,
        title=body.title,
        url=body.url,
        media_file_id=body.media_file_id,
        position=max_pos + 1,
        duration=body.duration,
        thumbnail_url=body.thumbnail_url,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return {"ok": True, "data": {"id": item.id, "title": item.title, "position": item.position}}


@router.delete("/{playlist_id}/items/{item_id}")
async def remove_item(playlist_id: int, item_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(PlaylistItem).where(
            PlaylistItem.id == item_id,
            PlaylistItem.playlist_id == playlist_id,
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(404, "Item not found")
    await db.delete(item)
    await db.commit()
    return {"ok": True, "data": {"deleted": item_id}}


@router.patch("/{playlist_id}/items/reorder")
async def reorder_items(playlist_id: int, body: ReorderBody, db: AsyncSession = Depends(get_db)):
    for pos, item_id in enumerate(body.item_ids):
        result = await db.execute(
            select(PlaylistItem).where(
                PlaylistItem.id == item_id,
                PlaylistItem.playlist_id == playlist_id,
            )
        )
        item = result.scalar_one_or_none()
        if item:
            item.position = pos
    await db.commit()
    return {"ok": True, "data": {"reordered": True}}
