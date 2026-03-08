from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models import Briefing, BriefingMetric, BriefingPoint, SampleItem  # noqa: F401


@pytest.fixture()
def client() -> Generator[TestClient, None, None]:
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    testing_session_local = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)

    Base.metadata.create_all(bind=engine)

    def override_get_db() -> Generator[Session, None, None]:
        db = testing_session_local()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)


def test_create_retrieve_generate_and_fetch_html(client: TestClient) -> None:
    payload = {
        "companyName": "Acme Holdings",
        "ticker": "acme",
        "sector": "Industrial Technology",
        "analystName": "Jane Doe",
        "summary": "Acme is benefiting from strong enterprise demand.",
        "recommendation": "Monitor for margin expansion.",
        "keyPoints": [
            "Revenue grew 18% year-over-year in the latest quarter.",
            "Management raised full-year guidance.",
        ],
        "risks": ["Top two customers account for 41% of total revenue."],
        "metrics": [
            {"name": "Revenue Growth", "value": "18%"},
            {"name": "Operating Margin", "value": "22.4%"},
        ],
    }

    create_response = client.post("/briefings", json=payload)
    assert create_response.status_code == 201
    created = create_response.json()
    assert created["ticker"] == "ACME"
    assert len(created["keyPoints"]) == 2

    briefing_id = created["id"]

    get_response = client.get(f"/briefings/{briefing_id}")
    assert get_response.status_code == 200
    fetched = get_response.json()
    assert fetched["companyName"] == "Acme Holdings"
    assert fetched["generatedAt"] is None

    generate_response = client.post(f"/briefings/{briefing_id}/generate")
    assert generate_response.status_code == 200
    generated = generate_response.json()
    assert generated["id"] == briefing_id
    assert generated["generatedAt"] is not None

    html_response = client.get(f"/briefings/{briefing_id}/html")
    assert html_response.status_code == 200
    assert "text/html" in html_response.headers["content-type"]
    assert "Briefing Report: Acme Holdings (ACME)" in html_response.text
    assert "Internal Analyst Briefing" in html_response.text


def test_validate_metric_name_uniqueness(client: TestClient) -> None:
    payload = {
        "companyName": "Acme Holdings",
        "ticker": "ACME",
        "sector": "Industrial Technology",
        "analystName": "Jane Doe",
        "summary": "Acme summary.",
        "recommendation": "Acme recommendation.",
        "keyPoints": ["Point 1", "Point 2"],
        "risks": ["Risk 1"],
        "metrics": [
            {"name": "Revenue Growth", "value": "18%"},
            {"name": "revenue growth", "value": "20%"},
        ],
    }

    response = client.post("/briefings", json=payload)
    assert response.status_code == 422


def test_fetch_html_before_generation_returns_conflict(client: TestClient) -> None:
    payload = {
        "companyName": "No Metrics Corp",
        "ticker": "NMC",
        "sector": "Software",
        "analystName": "Alex Doe",
        "summary": "Summary.",
        "recommendation": "Recommendation.",
        "keyPoints": ["Point 1", "Point 2"],
        "risks": ["Risk 1"],
        "metrics": [],
    }

    create_response = client.post("/briefings", json=payload)
    briefing_id = create_response.json()["id"]

    html_response = client.get(f"/briefings/{briefing_id}/html")
    assert html_response.status_code == 409
