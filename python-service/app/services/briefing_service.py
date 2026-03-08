from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.briefing import Briefing, BriefingMetric, BriefingPoint
from app.schemas.briefing import BriefingCreate
from app.services.report_formatter import ReportFormatter


def create_briefing(db: Session, payload: BriefingCreate) -> Briefing:
    briefing = Briefing(
        company_name=payload.companyName,
        ticker=payload.ticker,
        sector=payload.sector,
        analyst_name=payload.analystName,
        summary=payload.summary,
        recommendation=payload.recommendation,
    )

    briefing.points = [
        BriefingPoint(point_type="key_point", content=point, display_order=index)
        for index, point in enumerate(payload.keyPoints, start=1)
    ] + [
        BriefingPoint(point_type="risk", content=risk, display_order=index)
        for index, risk in enumerate(payload.risks, start=1)
    ]

    briefing.metrics = [
        BriefingMetric(name=metric.name, value=metric.value, display_order=index)
        for index, metric in enumerate(payload.metrics, start=1)
    ]

    db.add(briefing)
    db.commit()
    return get_briefing_or_none(db, briefing.id)


def get_briefing_or_none(db: Session, briefing_id: int) -> Briefing | None:
    query = (
        select(Briefing)
        .where(Briefing.id == briefing_id)
        .options(selectinload(Briefing.points), selectinload(Briefing.metrics))
    )
    return db.scalar(query)


def generate_briefing_report(db: Session, briefing: Briefing, formatter: ReportFormatter) -> Briefing:
    report_html, generated_at = formatter.render_briefing_report(briefing)
    briefing.report_html = report_html
    briefing.generated_at = generated_at
    db.commit()
    return briefing
