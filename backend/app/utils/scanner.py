import asyncio
from pathlib import Path
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import filetype

from app.config import settings
from app.models.media import MediaFile
from app.utils.thumbnails import generate_thumbnail

# Comprehensive format support
VIDEO_EXTS = {
    '.mp4', '.webm', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.m4v',
    '.3gp', '.3g2', '.ogv', '.ogg', '.ts', '.mts', '.m2ts', '.vob',
    '.divx', '.xvid', '.f4v', '.h264', '.h265', '.hevc',
}

AUDIO_EXTS = {
    '.mp3', '.flac', '.wav', '.aac', '.ogg', '.wma', '.m4a', '.opus',
    '.aiff', '.alac', '.amr', '.ac3', '.dts', '.mid', '.midi',
    '.ra', '.rm', '.ape', '.wv', '.tta',
}

IMAGE_EXTS = {
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg',
    '.bmp', '.tiff', '.tif', '.ico', '.heic', '.heif', '.raw',
    '.cr2', '.nef', '.arw', '.dng', '.psd',
}

MIME_MAP = {
    # Video
    '.mp4': 'video/mp4', '.webm': 'video/webm', '.mkv': 'video/x-matroska',
    '.avi': 'video/x-msvideo', '.mov': 'video/quicktime', '.wmv': 'video/x-ms-wmv',
    '.flv': 'video/x-flv', '.m4v': 'video/x-m4v', '.3gp': 'video/3gpp',
    '.3g2': 'video/3gpp2', '.ogv': 'video/ogg', '.ts': 'video/mp2t',
    '.mts': 'video/mp2t', '.m2ts': 'video/mp2t', '.vob': 'video/dvd',
    '.divx': 'video/x-divx',
    # Audio
    '.mp3': 'audio/mpeg', '.flac': 'audio/flac', '.wav': 'audio/wav',
    '.aac': 'audio/aac', '.ogg': 'audio/ogg', '.wma': 'audio/x-ms-wma',
    '.m4a': 'audio/mp4', '.opus': 'audio/opus', '.aiff': 'audio/aiff',
    '.alac': 'audio/alac', '.amr': 'audio/amr', '.ac3': 'audio/ac3',
    '.mid': 'audio/midi', '.midi': 'audio/midi',
    '.ape': 'audio/ape', '.wv': 'audio/wavpack',
    # Image
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
    '.gif': 'image/gif', '.webp': 'image/webp', '.avif': 'image/avif',
    '.svg': 'image/svg+xml', '.bmp': 'image/bmp', '.tiff': 'image/tiff',
    '.tif': 'image/tiff', '.ico': 'image/x-icon', '.heic': 'image/heic',
    '.heif': 'image/heif', '.raw': 'image/x-raw',
    '.psd': 'image/vnd.adobe.photoshop',
}

EXT_TO_TYPE = {}
for ext in VIDEO_EXTS: EXT_TO_TYPE[ext] = 'video'
for ext in AUDIO_EXTS: EXT_TO_TYPE[ext] = 'audio'
for ext in IMAGE_EXTS: EXT_TO_TYPE[ext] = 'image'


def classify_file(path: Path) -> tuple[str | None, str | None]:
    ext = path.suffix.lower()
    media_type = EXT_TO_TYPE.get(ext)
    if not media_type:
        # Try to detect by magic bytes
        try:
            kind = filetype.guess(str(path))
            if kind:
                mime = kind.mime
                if mime.startswith('video/'):
                    media_type = 'video'
                elif mime.startswith('audio/'):
                    media_type = 'audio'
                elif mime.startswith('image/'):
                    media_type = 'image'
        except Exception:
            pass
        if not media_type:
            return None, None

    # Get mime from map or detect
    mime = MIME_MAP.get(ext)
    if not mime:
        try:
            kind = filetype.guess(str(path))
            mime = kind.mime if kind else 'application/octet-stream'
        except Exception:
            mime = 'application/octet-stream'

    return media_type, mime


async def clean_stale_entries(session: AsyncSession) -> int:
    """Remove database entries for files that no longer exist on disk."""
    result = await session.execute(select(MediaFile))
    entries = result.scalars().all()
    stale = 0
    for entry in entries:
        if not Path(entry.path).exists():
            await session.delete(entry)
            stale += 1
    if stale:
        await session.commit()
    return stale


async def scan_media(session: AsyncSession, progress_cb=None) -> dict:
    added = 0
    skipped = 0
    errors = 0

    # First, clean up stale entries
    stale_removed = await clean_stale_entries(session)

    for dir_path in settings.media_dirs:
        base = Path(dir_path).resolve()
        if not base.exists():
            continue

        # Collect all files recursively
        files = await asyncio.to_thread(lambda: list(base.rglob('*')))
        total = len(files)

        for idx, fpath in enumerate(files):
            if not fpath.is_file():
                continue

            if progress_cb:
                await progress_cb(fpath.name, idx + 1, total)

            media_type, mime = await asyncio.to_thread(classify_file, fpath)
            if not media_type:
                skipped += 1
                continue

            abspath = str(fpath.resolve())

            # Check if file already exists in database
            result = await session.execute(
                select(MediaFile).where(MediaFile.path == abspath)
            )
            if result.scalar_one_or_none():
                skipped += 1
                continue

            stat = await asyncio.to_thread(fpath.stat)
            thumb = await generate_thumbnail(abspath, media_type)

            mf = MediaFile(
                path=abspath,
                filename=fpath.name,
                mime_type=mime,
                media_type=media_type,
                size_bytes=stat.st_size,
                thumbnail_path=thumb,
            )
            session.add(mf)
            added += 1

    if added:
        await session.commit()
    return {"added": added, "skipped": skipped, "errors": errors, "cleaned": stale_removed}
