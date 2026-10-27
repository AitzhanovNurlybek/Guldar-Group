import pytest
from sqlalchemy import func, select
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_engine
from app.models.lead import Lead

PAYLOAD = {"name": "Тест", "phone": "+77000000000", "message": "Ремонт офиса"}


def test_created_lead_is_actually_persisted(client, database):
    response = client.post("/api/leads", json=PAYLOAD)
    assert response.status_code == 201
    result = response.json()
    assert result == {**PAYLOAD, "id": result["id"]}
    assert result["id"] > 0
    with Session(database) as session:
        saved = session.get(Lead, result["id"])
        assert saved.name == PAYLOAD["name"]
        assert saved.phone == PAYLOAD["phone"]
        assert saved.message == PAYLOAD["message"]
        assert saved.created_at is not None


def test_ids_are_unique_and_records_survive_reconnection(client, database):
    first = client.post("/api/leads", json=PAYLOAD).json()
    second = client.post("/api/leads", json={**PAYLOAD, "name": "Второй клиент"}).json()
    assert first["id"] != second["id"]
    database.dispose()
    get_engine.cache_clear()
    reopened = get_engine()
    try:
        with Session(reopened) as session:
            assert session.scalar(select(func.count()).select_from(Lead)) == 2
    finally:
        reopened.dispose()


def test_input_is_trimmed_and_message_is_optional(client):
    response = client.post("/api/leads", json={"name": "  Иван  ", "phone": " +7 (705) 611-74-74 "})
    assert response.status_code == 201
    assert response.json() == {"id": response.json()["id"], "name": "Иван", "phone": "+7 (705) 611-74-74", "message": ""}


@pytest.mark.parametrize("changes", [
    {"name": ""}, {"name": " \t\n "}, {"name": "а" * 101}, {"name": None},
    {"phone": "12345"}, {"phone": "abcdefghijk"}, {"phone": "+7<script>7056117474"},
    {"phone": "+1234567890123456"}, {"phone": "++77056117474"}, {"phone": None},
    {"phone": "+7\n7056117474"},
    {"message": "а" * 2001}, {"message": []},
])
def test_invalid_leads_do_not_create_records(client, database, changes):
    response = client.post("/api/leads", json={**PAYLOAD, **changes})
    assert response.status_code == 422
    with Session(database) as session:
        assert session.scalar(select(func.count()).select_from(Lead)) == 0


@pytest.mark.parametrize("payload", [{}, {"name": "Иван"}, {"phone": "+77056117474"}, []])
def test_missing_or_wrong_body_is_rejected(client, payload):
    assert client.post("/api/leads", json=payload).status_code == 422


def test_field_boundaries_are_accepted(client):
    response = client.post("/api/leads", json={"name": "я" * 100, "phone": "+123456789012345", "message": "я" * 2000})
    assert response.status_code == 201


def test_commit_failure_rolls_back_and_never_reports_success(client, database, monkeypatch):
    def fail_commit(session):
        session.flush()
        raise OperationalError("INSERT private customer data", {}, Exception("secret credentials"))

    with monkeypatch.context() as patch:
        patch.setattr(Session, "commit", fail_commit)
        response = client.post("/api/leads", json=PAYLOAD)
    assert response.status_code == 503
    assert response.headers["retry-after"] == "60"
    assert "private" not in response.text and "secret" not in response.text
    with Session(database) as session:
        assert session.scalar(select(func.count()).select_from(Lead)) == 0
    assert client.post("/api/leads", json=PAYLOAD).status_code == 201


@pytest.mark.parametrize("environment,vercel", [("production", False), ("development", True)])
def test_production_never_accepts_a_lead_into_ephemeral_sqlite(client, monkeypatch, environment, vercel):
    get_engine.cache_clear()
    monkeypatch.setattr(settings, "ENVIRONMENT", environment)
    monkeypatch.setattr(settings, "VERCEL", vercel)
    assert client.post("/api/leads", json=PAYLOAD).status_code == 503
    assert client.get("/api/health").status_code == 200


def test_unavailable_database_does_not_leak_configuration(client, monkeypatch):
    import app.core.database as database_module

    def fail_engine():
        raise OperationalError("secret database URL", {}, Exception("private password"))

    monkeypatch.setattr(database_module, "get_engine", fail_engine)
    response = client.post("/api/leads", json=PAYLOAD)
    assert response.status_code == 503
    assert "secret" not in response.text and "password" not in response.text
    assert client.get("/api/health").status_code == 200
