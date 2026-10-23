from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_lead_response_preserves_payload():
    payload = {"name": "Тест", "phone": "+77000000000", "message": "Ремонт офиса"}
    response = client.post("/api/leads", json=payload)
    assert response.status_code == 201
    assert response.json() == {**payload, "id": 0}


def test_invalid_lead_is_rejected():
    response = client.post("/api/leads", json={"name": "", "phone": "1"})
    assert response.status_code == 422


def test_cors_preflight_is_cached():
    response = client.options("/api/leads", headers={
        "Origin": "http://localhost:3000",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type",
    })
    assert response.status_code == 200
    assert response.headers["access-control-max-age"] == "3600"
