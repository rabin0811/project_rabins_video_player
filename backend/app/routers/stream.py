import asyncio
from fastapi import APIRouter, HTTPException, Query, Request, Depends, Header
from fastapi.responses import StreamingResponse
import httpx

from app.utils.stream_helper import extract_stream_info
from app.utils.security import rate_limiter, validate_stream_url

router = APIRouter(prefix="/api/stream", tags=["stream"])

TIMEOUT = 60
CHUNK_SIZE = 256 * 1024  # 256KB chunks


@router.post("/resolve")
async def resolve_stream(body: dict, _=Depends(rate_limiter)):
    url = body.get("url", "").strip()
    if not url:
        raise HTTPException(400, "URL is required")
    if not validate_stream_url(url):
        raise HTTPException(400, "Invalid or suspicious URL format")
    try:
        info = extract_stream_info(url)
        if not info.get("direct_url"):
            raise HTTPException(400, "No playable stream found at this URL")
        return {"ok": True, "data": info}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(400, f"Failed to resolve stream: {str(e)}")


@router.get("/proxy")
async def proxy_stream(
    url: str = Query(...),
    request: Request = None,
    range: str | None = Header(None),
    _=Depends(rate_limiter),
):
    if not request:
        raise HTTPException(400, "Invalid request")
    if not validate_stream_url(url):
        raise HTTPException(400, "Invalid or suspicious URL")

    client_timeout = httpx.Timeout(TIMEOUT, connect=10)
    client = httpx.AsyncClient(timeout=client_timeout, follow_redirects=True)

    try:
        # Build request with range support
        headers = {}
        if range:
            headers["Range"] = range

        req = client.build_request("GET", url, headers=headers)
        response = await client.send(req, stream=True)

        # Determine media type
        content_type = response.headers.get("content-type", "application/octet-stream")
        if "text" in content_type or "html" in content_type:
            # Likely a redirect page, not a video
            await response.aclose()
            await client.aclose()
            raise HTTPException(400, "URL returned HTML instead of video. Try a direct video URL.")

        # Build response headers
        resp_headers = {}
        for k in ("content-type", "content-length", "accept-ranges", "content-range", "etag", "last-modified"):
            val = response.headers.get(k)
            if val:
                resp_headers[k] = val

        status_code = response.status_code
        if status_code not in (200, 206, 301, 302, 303, 307, 308):
            await response.aclose()
            await client.aclose()
            raise HTTPException(502, f"Upstream returned status {status_code}")

        async def stream_generator():
            try:
                async for chunk in response.aiter_bytes(CHUNK_SIZE):
                    if request and await request.is_disconnected():
                        break
                    yield chunk
            finally:
                await response.aclose()
                await client.aclose()

        return StreamingResponse(
            stream_generator(),
            status_code=206 if range else status_code,
            media_type=content_type,
            headers=resp_headers,
        )
    except HTTPException:
        await client.aclose()
        raise
    except httpx.ConnectError as e:
        await client.aclose()
        raise HTTPException(502, f"Cannot connect to stream source: {str(e)}")
    except httpx.TimeoutException:
        await client.aclose()
        raise HTTPException(504, "Connection to stream source timed out")
    except Exception as e:
        await client.aclose()
        raise HTTPException(502, f"Proxy error: {str(e)}")
