from __future__ import annotations

from datetime import datetime
from typing import Literal

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.schema import Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Briefing(Base):
    __tablename__ = "briefings"
    __table_args__ = (
        Index("idx_briefings_ticker_created_at", "ticker", "created_at"),
        Index("idx_briefings_created_at", "created_at"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    company_name: Mapped[str] = mapped_column(String(200), nullable=False)
    ticker: Mapped[str] = mapped_column(String(20), nullable=False)
    sector: Mapped[str] = mapped_column(String(160), nullable=False)
    analyst_name: Mapped[str] = mapped_column(String(160), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    recommendation: Mapped[str] = mapped_column(Text, nullable=False)
    report_html: Mapped[str | None] = mapped_column(Text, nullable=True)
    generated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    points: Mapped[list[BriefingPoint]] = relationship(
        back_populates="briefing", cascade="all, delete-orphan"
    )
    metrics: Mapped[list[BriefingMetric]] = relationship(
        back_populates="briefing", cascade="all, delete-orphan"
    )


class BriefingPoint(Base):
    __tablename__ = "briefing_points"
    __table_args__ = (
        Index("idx_briefing_points_briefing_id_display_order", "briefing_id", "display_order"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    briefing_id: Mapped[int] = mapped_column(ForeignKey("briefings.id", ondelete="CASCADE"), nullable=False)
    point_type: Mapped[Literal["key_point", "risk"]] = mapped_column(String(16), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False)

    briefing: Mapped[Briefing] = relationship(back_populates="points")


class BriefingMetric(Base):
    __tablename__ = "briefing_metrics"
    __table_args__ = (
        UniqueConstraint("briefing_id", "name", name="uq_briefing_metric_name"),
        Index("idx_briefing_metrics_briefing_id_display_order", "briefing_id", "display_order"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    briefing_id: Mapped[int] = mapped_column(ForeignKey("briefings.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    value: Mapped[str] = mapped_column(String(120), nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False)

    briefing: Mapped[Briefing] = relationship(back_populates="metrics")
