import logging
from collections.abc import Iterator
from functools import lru_cache

from fastapi import HTTPException, status
from sqlalchemy import Engine, create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.lead import Base

logger = logging.getLogger(__name__)


@lru_cache
def get_engine() -> Engine:
    url = make_url(settings.DATABASE_URL)
    if url.get_backend_name() == "sqlite" and (
        settings.VERCEL or settings.ENVIRONMENT.lower() == "production"
    ):
        # A serverless filesystem cannot durably retain customer requests.
        raise RuntimeError("Production lead storage requires an external database")
    if url.drivername in {"postgres", "postgresql"}:
        url = url.set(drivername="postgresql+psycopg")
    connect_args = {"check_same_thread": False, "timeout": 10} if url.get_backend_name() == "sqlite" else {}
    engine = create_engine(url, pool_pre_ping=True, connect_args=connect_args)
    try:
        Base.metadata.create_all(engine)
    except Exception:
        engine.dispose()
        raise
    return engine


def get_session() -> Iterator[Session]:
    try:
        with Session(get_engine(), expire_on_commit=False) as session:
            yield session
    except (SQLAlchemyError, RuntimeError, ImportError) as error:
        # Do not log SQL parameters or exception text containing customer data or credentials.
        logger.error("Lead storage unavailable: %s", type(error).__name__)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Не удалось сохранить заявку. Пожалуйста, свяжитесь с нами в WhatsApp.",
            headers={"Retry-After": "60"},
        ) from None
