from fastapi import APIRouter, Response
from sqlalchemy import text

from app.core.database import get_session

router = APIRouter()


@router.get("/health")
async def health(response: Response) -> dict[str, str]:
    response.headers["Cache-Control"] = "no-store"
    return {"status": "ok"}


@router.get("/ready")
def ready(response: Response) -> dict[str, str]:
    with get_session() as session:
        session.execute(text("SELECT 1"))
    response.headers["Cache-Control"] = "no-store"
    return {"status": "ready"}
