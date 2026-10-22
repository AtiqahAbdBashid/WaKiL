from datetime import datetime
from pydantic import BaseModel, Field
from typing import Literal
from uuid import UUID


class Message(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ComplaintDraft(BaseModel):
    what_happened: str | None = None
    location: str | None = None
    when: str | None = None
    evidence: str | None = None


class Classification(BaseModel):
    priority: Literal["Low", "Medium", "High"]
    category: str  # One of the canonical categories in app.prompts.CATEGORIES.
    secondary_categories: list[str] = Field(default_factory=list)
    summary: str
    summary_tip: str = ""
    confidence: float  # a number from 0 to 1


class ChatRequest(BaseModel):
    message: str
    session_id: UUID | None = None
    image: str | None = None


class ChatResponse(BaseModel):
    reply: str
    session_id: UUID
    can_confirm: bool = False


class ConfirmRequest(BaseModel):
    session_id: UUID | None = None
    location: str | None = None
    image: str | None = None



class ConfirmResponse(BaseModel):
    ticket_id: str
    status: str
    parliament: str | None = None
    dun: str | None = None
    image_url: str | None = None


class SuggestCategoryRequest(BaseModel):
    summary: str | None = None
    location: str | None = None
    when: str | None = None
    image: str | None = None


class SuggestCategoryResponse(BaseModel):
    category: str
    secondary_categories: list[str] = Field(default_factory=list)
    priority: str
    confidence: float
    summary: str
    summary_tip: str = ""


class ComplaintFormRequest(BaseModel):
    what_happened: str
    location: str
    when: str
    category: str | None = None
    categories: list[str] = Field(default_factory=list)
    priority: str | None = None
    image: str | None = None
    photo_exception_reason: Literal["unavailable", "unsafe", "sensitive", "not_verifiable"] | None = None


class ComplaintFormResponse(BaseModel):
    ticket_id: str
    status: str
    category: str
    categories: list[str] = Field(default_factory=list)
    priority: str
    summary: str
    parliament: str | None = None
    dun: str | None = None
    image_url: str | None = None
    manual_review_required: bool = False
    photo_exception_reason: str | None = None


class ChatMessageOut(BaseModel):
    id: UUID
    role: str
    content: str
    image_url: str | None = None
    created_at: datetime


class ChatSessionSummary(BaseModel):
    id: UUID
    status: str
    started_at: datetime
    ended_at: datetime | None = None
    title: str
    preview: str | None = None
    complaint_ticket_id: str | None = None
    message_count: int = 0


class ChatSessionDetail(BaseModel):
    id: UUID
    status: str
    started_at: datetime
    ended_at: datetime | None = None
    messages: list[ChatMessageOut]
    can_confirm: bool = False
    complaint_ticket_id: str | None = None
    complaint_status: str | None = None
    parliament: str | None = None
    dun: str | None = None


