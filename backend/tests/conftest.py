import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.core.database import get_engine
from app.main import app


@pytest.fixture
def database(tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "DATABASE_URL", f"sqlite:///{(tmp_path / 'leads.db').as_posix()}")
    monkeypatch.setattr(settings, "ENVIRONMENT", "test")
    monkeypatch.setattr(settings, "VERCEL", False)
    get_engine.cache_clear()
    engine = get_engine()
    yield engine
    engine.dispose()
    get_engine.cache_clear()


@pytest.fixture
def client(database):
    with TestClient(app) as test_client:
        yield test_client
