from fastapi import APIRouter
from app.services.ollama_client import OllamaClient
from app.core.config import settings

router = APIRouter()
_client = OllamaClient(base_url=settings.OLLAMA_BASE_URL)


@router.get("/available")
async def available_models():
    try:
        models = await _client.list_models()
        return {"models": models, "error": None}
    except Exception as exc:
        return {"models": [], "error": str(exc)}


@router.get("/health")
async def ollama_health():
    healthy = await _client.is_healthy()
    return {"ollama_healthy": healthy, "ollama_url": settings.OLLAMA_BASE_URL}
