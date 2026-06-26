import asyncio
import json
import random
from fastapi import APIRouter, Depends
from sse_starlette.sse import EventSourceResponse

router = APIRouter(tags=["SSE"])


@router.get("/api/v1/sse/stream")
async def sse_stream():
    """Server-Sent Events stream for real-time updates."""

    async def event_generator():
        # Send initial heartbeat
        yield {"event": "connected", "data": json.dumps({"status": "connected"})}

        # Keep connection alive with periodic mock events
        counter = 0
        try:
            while True:
                await asyncio.sleep(15)
                counter += 1

                # Mock job update events periodically
                if counter % 2 == 0:
                    yield {
                        "event": "message",
                        "data": json.dumps({
                            "type": "job_update",
                            "video_post_id": 1,
                            "status": "running",
                            "progress": min(counter * 10, 100),
                            "message": "Processando publicação...",
                        })
                    }

                # Mock notification events
                if counter % 4 == 0:
                    yield {
                        "event": "message",
                        "data": json.dumps({
                            "type": "notification_new",
                            "notification": {
                                "id": 100 + counter,
                                "type": "system",
                                "severity": "info",
                                "title": "Atualização em tempo real",
                                "message": "Novo evento recebido via SSE.",
                                "created_at": asyncio.get_event_loop().time(),
                            }
                        })
                    }

        except asyncio.CancelledError:
            pass

    return EventSourceResponse(event_generator())
