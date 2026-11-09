import json
from pathlib import Path
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.config import settings

router = APIRouter(prefix="/api/settings", tags=["settings"])

SETTINGS_PATH = Path(settings.settings_file)


class AppSettings(BaseModel):
    media_dirs: list[str] = ["media"]
    theme: str = "dark"
    default_volume: float = 0.8
    stream_timeout: int = 30


def _load_settings() -> dict:
    if SETTINGS_PATH.exists():
        return json.loads(SETTINGS_PATH.read_text())
    return {}


def _save_settings(data: dict):
    SETTINGS_PATH.parent.mkdir(parents=True, exist_ok=True)
    SETTINGS_PATH.write_text(json.dumps(data, indent=2))


@router.get("")
async def get_settings():
    data = _load_settings()
    defaults = AppSettings().model_dump()
    merged = defaults | data
    return {"ok": True, "data": merged}


@router.put("")
async def update_settings(body: AppSettings):
    data = body.model_dump()
    _save_settings(data)
    return {"ok": True, "data": data}
