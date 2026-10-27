from concurrent.futures import ThreadPoolExecutor
from unittest.mock import MagicMock

import pytest
from sqlalchemy import func, select
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session
from sqlalchemy.pool import NullPool

from app.core.config import settings
from app.core.database import get_engine, reset_engine_cache
from app.models.lead import Lead

PAYLOAD = {"name": "Тест надёжности", "phone": "+77000000000"}


def test_ready_checks_storage_without_creating_a_lead(client, database):
    response = client.get("/api/ready")
    assert response.status_code == 200
    assert response.json() == {"status": "ready"}
    assert response.headers["cache-control"] == "no-store"
    with Session(database) as session:
        assert session.scalar(select(func.count()).select_from(Lead)) == 0


def test_ready_recovers_after_a_database_error(client, monkeypatch):
    def unavailable(*args, **kwargs):
        raise OperationalError("private URL", {}, Exception())

    with monkeypatch.context() as patch:
        patch.setattr(Session, "execute", unavailable)
        response = client.get("/api/ready")
    assert response.status_code == 503
    assert response.headers["cache-control"] == "no-store"
    assert "private" not in response.text
    assert client.get("/api/health").status_code == 200
    assert client.get("/api/ready").status_code == 200


def test_parallel_requests_are_all_persisted_once(client, database):
    def submit(index):
        return client.post("/api/leads", json={**PAYLOAD, "name": f"Клиент {index}"})

    with ThreadPoolExecutor(max_workers=6) as workers:
        responses = list(workers.map(submit, range(24)))
    assert all(response.status_code == 201 for response in responses)
    assert len({response.json()["id"] for response in responses}) == 24
    with Session(database) as session:
        assert session.scalar(select(func.count()).select_from(Lead)) == 24


def test_parallel_cold_requests_share_one_engine(client):
    reset_engine_cache()
    with ThreadPoolExecutor(max_workers=8) as workers:
        engines = list(workers.map(lambda _: get_engine(), range(16)))
    assert all(engine is engines[0] for engine in engines)
    assert client.get("/api/ready").status_code == 200


def test_development_memory_database_survives_between_request_threads(client, monkeypatch):
    reset_engine_cache()
    monkeypatch.setattr(settings, "DATABASE_URL", "sqlite:///:memory:")
    assert client.post("/api/leads", json=PAYLOAD).status_code == 201
    assert client.get("/api/ready").status_code == 200
    with Session(get_engine()) as session:
        assert session.scalar(select(func.count()).select_from(Lead)) == 1


def test_busy_initialization_returns_promptly_and_then_recovers(client, monkeypatch):
    import app.core.database as database_module
    from time import monotonic

    monkeypatch.setattr(settings, "DATABASE_POOL_TIMEOUT", 1)
    with database_module._engine_lock:
        started = monotonic()
        response = client.get("/api/ready")
        elapsed = monotonic() - started
    assert response.status_code == 503
    assert elapsed < 3
    assert client.get("/api/ready").status_code == 200


def test_stale_pooled_connection_is_replaced(client, database):
    with database.connect() as connection:
        stale_connection = connection.connection.driver_connection
    stale_connection.close()
    response = client.post("/api/leads", json=PAYLOAD)
    assert response.status_code == 201
    assert client.get("/api/ready").status_code == 200


def test_failed_initialization_is_retried_on_the_next_request(client, monkeypatch):
    reset_engine_cache()
    from app.models.lead import Base

    create_all = Base.metadata.create_all
    attempts = 0

    def temporarily_unavailable(*args, **kwargs):
        nonlocal attempts
        attempts += 1
        if attempts == 1:
            raise OperationalError("private connection", {}, Exception())
        return create_all(*args, **kwargs)

    monkeypatch.setattr(Base.metadata, "create_all", temporarily_unavailable)
    assert client.post("/api/leads", json=PAYLOAD).status_code == 503
    assert client.post("/api/leads", json=PAYLOAD).status_code == 201
    assert attempts == 2


def test_invalid_body_is_rejected_without_touching_unavailable_storage(client, monkeypatch):
    import app.core.database as database_module

    def must_not_connect():
        raise AssertionError("Invalid requests must not open the database")

    monkeypatch.setattr(database_module, "get_engine", must_not_connect)
    assert client.post("/api/leads", json={"name": "", "phone": "1"}).status_code == 422


@pytest.mark.parametrize("url", ["postgres://user:password@db.example/guldar", "postgresql://user:password@db.example/guldar"])
def test_serverless_postgres_uses_bounded_connect_and_no_idle_pool(client, monkeypatch, url):
    import app.core.database as database_module
    from app.models.lead import Base

    reset_engine_cache()
    monkeypatch.setattr(settings, "DATABASE_URL", url)
    monkeypatch.setattr(settings, "VERCEL", True)
    factory = MagicMock(return_value=MagicMock())
    monkeypatch.setattr(database_module, "create_engine", factory)
    monkeypatch.setattr(Base.metadata, "create_all", MagicMock())
    get_engine()
    args, options = factory.call_args
    assert args[0].drivername == "postgresql+psycopg"
    assert options["poolclass"] is NullPool
    assert options["connect_args"]["connect_timeout"] == 5
