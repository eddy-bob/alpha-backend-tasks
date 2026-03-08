from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.briefing import BriefingCreate, BriefingGeneratedRead, BriefingRead
from app.services.briefing_service import create_briefing, generate_briefing_report, get_briefing_or_none
from app.services.report_formatter import ReportFormatter

router = APIRouter(prefix="/briefings", tags=["briefings"])
formatter = ReportFormatter()


def _serialize_briefing(briefing) -> BriefingRead:
    key_points = [
        point.content
        for point in sorted(briefing.points, key=lambda item: (item.display_order, item.id))
        if point.point_type == "key_point"
    ]
    risks = [
        point.content
        for point in sorted(briefing.points, key=lambda item: (item.display_order, item.id))
        if point.point_type == "risk"
    ]
    metrics = [
        {"name": metric.name, "value": metric.value}
        for metric in sorted(briefing.metrics, key=lambda item: (item.display_order, item.id))
    ]

    return BriefingRead(
        id=briefing.id,
        companyName=briefing.company_name,
        ticker=briefing.ticker,
        sector=briefing.sector,
        analystName=briefing.analyst_name,
        summary=briefing.summary,
        recommendation=briefing.recommendation,
        keyPoints=key_points,
        risks=risks,
        metrics=metrics,
        generatedAt=briefing.generated_at,
        createdAt=briefing.created_at,
    )


@router.post("", response_model=BriefingRead, status_code=status.HTTP_201_CREATED)
def create_briefing_endpoint(
    payload: BriefingCreate,
    db: Annotated[Session, Depends(get_db)],
) -> BriefingRead:
    briefing = create_briefing(db, payload)
    return _serialize_briefing(briefing)


@router.get("/{briefing_id}", response_model=BriefingRead)
def get_briefing_endpoint(briefing_id: int, db: Annotated[Session, Depends(get_db)]) -> BriefingRead:
    briefing = get_briefing_or_none(db, briefing_id)
    if not briefing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Briefing not found")
    return _serialize_briefing(briefing)


@router.post("/{briefing_id}/generate", response_model=BriefingGeneratedRead)
def generate_briefing_endpoint(
    briefing_id: int,
    db: Annotated[Session, Depends(get_db)],
) -> BriefingGeneratedRead:
    briefing = get_briefing_or_none(db, briefing_id)
    if not briefing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Briefing not found")

    updated = generate_briefing_report(db, briefing, formatter)
    return BriefingGeneratedRead(id=updated.id, generatedAt=updated.generated_at)


@router.get("/{briefing_id}/html", response_class=HTMLResponse)
def get_briefing_html(briefing_id: int, db: Annotated[Session, Depends(get_db)]) -> Response:
    briefing = get_briefing_or_none(db, briefing_id)
    if not briefing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Briefing not found")
    if not briefing.report_html:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Briefing report has not been generated",
        )
    return HTMLResponse(content=briefing.report_html)
