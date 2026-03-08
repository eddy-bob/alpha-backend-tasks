from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from jinja2 import Environment, FileSystemLoader, select_autoescape

from app.models.briefing import Briefing

_TEMPLATE_DIR = Path(__file__).resolve().parents[1] / "templates"


class ReportFormatter:
    def __init__(self) -> None:
        self._env = Environment(
            loader=FileSystemLoader(str(_TEMPLATE_DIR)),
            autoescape=select_autoescape(enabled_extensions=("html", "xml"), default_for_string=True),
        )

    def build_view_model(self, briefing: Briefing) -> dict[str, Any]:
        ordered_points = sorted(briefing.points, key=lambda point: (point.display_order, point.id))
        key_points = [point.content for point in ordered_points if point.point_type == "key_point"]
        risks = [point.content for point in ordered_points if point.point_type == "risk"]
        metrics = [
            {"name": metric.name.strip().title(), "value": metric.value}
            for metric in sorted(briefing.metrics, key=lambda metric: (metric.display_order, metric.id))
        ]

        generated_at = datetime.now(timezone.utc)
        return {
            "title": f"Briefing Report: {briefing.company_name} ({briefing.ticker})",
            "company_name": briefing.company_name,
            "ticker": briefing.ticker,
            "sector": briefing.sector,
            "analyst_name": briefing.analyst_name,
            "summary": briefing.summary,
            "recommendation": briefing.recommendation,
            "key_points": key_points,
            "risks": risks,
            "metrics": metrics,
            "generated_at": generated_at,
            "generated_at_display": generated_at.strftime("%Y-%m-%d %H:%M UTC"),
        }

    def render_briefing_report(self, briefing: Briefing) -> tuple[str, datetime]:
        view_model = self.build_view_model(briefing)
        template = self._env.get_template("briefing_report.html")
        html = template.render(**view_model)
        return html, view_model["generated_at"]
