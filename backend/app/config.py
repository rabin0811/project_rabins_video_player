import os
from pathlib import Path
from pydantic_settings import BaseSettings


def get_user_media_dirs() -> list[str]:
    user = Path.home()
    candidates = [
        user / "Videos",
        user / "Music",
        user / "Pictures",
        user / "Downloads",
        Path(os.environ.get("HOMEDRIVE", "C:") + os.sep) / "Users" / user.name / "Videos",
    ]
    found = []
    for d in candidates:
        resolved = d.resolve()
        if resolved.exists():
            found.append(str(resolved))
    if not found:
        found.append("media")
    return found


class Settings(BaseSettings):
    app_name: str = "Rabins Video Player"
    debug: bool = False
    media_dirs: list[str] = get_user_media_dirs()
    database_url: str = "sqlite+aiosqlite:///./data/rabins.db"
    settings_file: str = "data/settings.json"
    host: str = "0.0.0.0"
    port: int = 8000
    stream_timeout: int = 30
    max_stream_size_mb: int = 1024

    model_config = {"env_prefix": "RVP_", "env_file": ".env"}


settings = Settings()
