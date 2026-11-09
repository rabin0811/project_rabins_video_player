import asyncio
import shutil
from pathlib import Path

THUMBS_DIR = Path("data/thumbs")

FFPROBE_AVAILABLE = shutil.which("ffprobe") is not None


async def generate_thumbnail(media_path: str, media_type: str) -> str | None:
    if not FFPROBE_AVAILABLE or media_type != "video":
        return None

    THUMBS_DIR.mkdir(parents=True, exist_ok=True)
    stem = Path(media_path).stem
    out = THUMBS_DIR / f"{stem}.jpg"
    if out.exists():
        return str(out)

    proc = await asyncio.create_subprocess_exec(
        "ffprobe",
        "-v", "error",
        "-select_streams", "v:0",
        "-skip_frame", "nokey",
        "-frames", "1",
        "-q:v", "2",
        "-s", "320x180",
        media_path,
        "-y", str(out),
        stdout=asyncio.subprocess.DEVNULL,
        stderr=asyncio.subprocess.DEVNULL,
    )
    await proc.wait()
    return str(out) if proc.returncode == 0 else None
