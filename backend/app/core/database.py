import logging
from collections.abc import Iterator
from contextlib import contextmanager
from functools import lru_cache
from threading import RLock

from fastapi import HTTPException, status
from sqlalchemy import Engine, create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from sqlalchemy.pool import NullPool, StaticPool

from app.core.config import settings
from app.models.lead import Base

logger = logging.getLogger(__name__)
_engine_lock = RLock()


class StorageUnavailableError(RuntimeError):
    pass


class StorageConfigurationError(StorageUnavailableError):
    pass


@lru_cache(maxsize=1)
def _cached_engine() -> Engine:
    url = make_url(settings.DATABASE_URL)
    if url.get_backend_name() == "sqlite" and (
        settings.VERCEL or settings.ENVIRONMENT.lower() == "production"
    ):
        # A serverless filesystem cannot durably retain customer requests.
        raise StorageConfigurationError("Production lead storage requires an external database")
    if url.drivername in {"postgres", "postgresql"}:
        url = url.set(drivername="postgresql+psycopg")
    options = {"pool_pre_ping": True}
    if url.get_backend_name() == "sqlite":
        options["connect_args"] = {"check_same_thread": False, "timeout": settings.DATABASE_CONNECT_TIMEOUT}
    elif url.get_backend_name() == "postgresql":
        options["connect_args"] = {"connect_timeout": settings.DATABASE_CONNECT_TIMEOUT}
    if url.get_backend_name() == "sqlite" and url.database in {None, "", ":memory:"}:
        options["poolclass"] = StaticPool
    elif settings.VERCEL:
        options["poolclass"] = NullPool
    else:
        options.update(pool_size=5, max_overflow=5, pool_timeout=settings.DATABASE_POOL_TIMEOUT, pool_recycle=300)
    engine = create_engine(url, **options)
    try:
        Base.metadata.create_all(engine)
    except Exception:
        engine.dispose()
        raise
    return engine


def get_engine() -> Engine:
    # Concurrent cold requests must share one initialized engine and schema.
    if not _engine_lock.acquire(timeout=settings.DATABASE_POOL_TIMEOUT):
        raise StorageUnavailableError("Storage initialization is busy")
    try:
        return _cached_engine()
    finally:
        _engine_lock.release()


def reset_engine_cache() -> None:
    with _engine_lock:
        if _cached_engine.cache_info().currsize:
            _cached_engine().dispose()
        _cached_engine.cache_clear()


@contextmanager
def get_session() -> Iterator[Session]:
    try:
        with Session(get_engine(), expire_on_commit=False) as session:
            yield session
    except (SQLAlchemyError, StorageUnavailableError, ImportError) as error:
        # Do not log SQL parameters or exception text containing customer data or credentials.
        logger.error("Lead storage unavailable: %s", type(error).__name__)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Сервис заявок временно недоступен. Пожалуйста, напишите нам в WhatsApp.",
            headers={"Retry-After": "60", "Cache-Control": "no-store"},
        ) from None
