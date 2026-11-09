import yt_dlp


def extract_stream_info(url: str) -> dict:
    """Extract stream information from any supported URL.

    Supports:
    - YouTube, Vimeo, Dailymotion, Twitch, Facebook, Twitter/X
    - Direct video URLs (mp4, webm, mkv, etc.)
    - HLS streams (.m3u8)
    - Many other sites via yt-dlp extractors
    """
    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        "format": (
            "bestvideo[height<=?1080][ext=mp4]+bestaudio[ext=m4a]/"
            "best[height<=?1080][ext=mp4]/"
            "best[ext=mp4]/"
            "best[protocol^=http]"
        ),
        "merge_output_format": "mp4",
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=False)

        # Get the best URL - prefer direct video URL
        direct_url = info.get("url")

        # If it's a playlist, get the first entry
        if info.get("_type") == "playlist" and info.get("entries"):
            entry = info["entries"][0]
            if entry:
                direct_url = entry.get("url") or direct_url
                info = entry

        # Try to find a better direct URL from formats
        formats = info.get("formats", [])
        if not direct_url and formats:
            # Find the best format with a direct URL
            for f in sorted(formats, key=lambda x: x.get("height", 0) or 0, reverse=True):
                if f.get("url") and f.get("protocol") in ("https", "http", "m3u8_native", "m3u8"):
                    direct_url = f["url"]
                    break

        # Get all available quality options
        qualities = []
        seen = set()
        for f in formats:
            h = f.get("height")
            label = f.get("format_note") or f.get("resolution")
            fmt_url = f.get("url")
            if h and label and fmt_url and h not in seen:
                seen.add(h)
                qualities.append({
                    "height": h,
                    "format": label,
                    "url": fmt_url,
                    "ext": f.get("ext"),
                })
        qualities.sort(key=lambda x: x["height"], reverse=True)

        result = {
            "title": info.get("title", "Unknown"),
            "duration": info.get("duration"),
            "thumbnail": info.get("thumbnail"),
            "direct_url": direct_url,
            "extractor": info.get("extractor", "direct"),
            "extractor_key": info.get("extractor_key"),
            "webpage_url": info.get("webpage_url", url),
            "description": info.get("description", "")[:500] if info.get("description") else "",
            "uploader": info.get("uploader"),
            "uploader_url": info.get("uploader_url"),
            "view_count": info.get("view_count"),
            "like_count": info.get("like_count"),
            "qualities": qualities[:10],  # Top 10 qualities
            "is_live": info.get("is_live", False),
        }

        return result
