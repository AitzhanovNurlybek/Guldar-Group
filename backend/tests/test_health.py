def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_cors_preflight_is_cached(client):
    response = client.options("/api/leads", headers={
        "Origin": "http://localhost:3000",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type",
    })
    assert response.status_code == 200
    assert response.headers["access-control-max-age"] == "3600"


def test_untrusted_cors_origin_is_rejected(client):
    response = client.options("/api/leads", headers={
        "Origin": "https://untrusted.example",
        "Access-Control-Request-Method": "POST",
    })
    assert response.status_code == 400
    assert "access-control-allow-origin" not in response.headers


def test_leads_cannot_be_read_publicly(client):
    assert client.get("/api/leads").status_code == 405


def test_unknown_route(client):
    assert client.get("/api/missing").status_code == 404
