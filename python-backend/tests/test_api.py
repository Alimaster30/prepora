import os

os.environ["ENVIRONMENT"] = "production"
os.environ["INTERNAL_SERVICE_KEY"] = "test-service-key-that-is-long-enough"

from fastapi.testclient import TestClient

import main
from main import app


client = TestClient(app)
headers = {"X-Prepora-Service-Key": os.environ["INTERNAL_SERVICE_KEY"]}


def test_health_is_public_for_platform_liveness_checks():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_categories_are_not_public():
    assert client.get("/categories").status_code == 401


def test_categories_do_not_load_the_heavy_analyzer():
    response = client.get("/categories", headers=headers)
    assert response.status_code == 200
    assert response.json()["categories"]
    assert main._analyzer is None


def test_analyze_validates_payload_before_processing():
    response = client.post("/analyze", headers=headers, json={"question": "", "answer": ""})
    assert response.status_code == 400
