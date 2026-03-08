from datetime import datetime

from pydantic import BaseModel, Field, field_validator, model_validator


class BriefingMetricInput(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    value: str = Field(min_length=1, max_length=120)

    @field_validator("name", "value")
    @classmethod
    def strip_text(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("must not be empty")
        return cleaned


class BriefingCreate(BaseModel):
    companyName: str = Field(min_length=1, max_length=200)
    ticker: str = Field(min_length=1, max_length=20)
    sector: str = Field(min_length=1, max_length=160)
    analystName: str = Field(min_length=1, max_length=160)
    summary: str = Field(min_length=1)
    recommendation: str = Field(min_length=1)
    keyPoints: list[str] = Field(min_length=2)
    risks: list[str] = Field(min_length=1)
    metrics: list[BriefingMetricInput] = Field(default_factory=list)

    @field_validator("companyName", "sector", "analystName", "summary", "recommendation")
    @classmethod
    def trim_required_text(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("must not be empty")
        return cleaned

    @field_validator("ticker")
    @classmethod
    def normalize_ticker(cls, value: str) -> str:
        cleaned = value.strip().upper()
        if not cleaned:
            raise ValueError("must not be empty")
        return cleaned

    @field_validator("keyPoints", "risks")
    @classmethod
    def trim_list_values(cls, values: list[str]) -> list[str]:
        cleaned_values = [item.strip() for item in values if item.strip()]
        if len(cleaned_values) != len(values):
            raise ValueError("items must not be empty")
        return cleaned_values

    @model_validator(mode="after")
    def validate_unique_metric_names(self) -> "BriefingCreate":
        metric_names = [metric.name.casefold() for metric in self.metrics]
        if len(metric_names) != len(set(metric_names)):
            raise ValueError("metric names must be unique within a briefing")
        return self


class BriefingMetricRead(BaseModel):
    name: str
    value: str


class BriefingRead(BaseModel):
    id: int
    companyName: str
    ticker: str
    sector: str
    analystName: str
    summary: str
    recommendation: str
    keyPoints: list[str]
    risks: list[str]
    metrics: list[BriefingMetricRead]
    generatedAt: datetime | None
    createdAt: datetime


class BriefingGeneratedRead(BaseModel):
    id: int
    generatedAt: datetime
