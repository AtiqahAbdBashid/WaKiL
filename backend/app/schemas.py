from pydantic import BaseModel
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
    category: str  # e.g. Infrastructure, Drainage & Flood, ...
    priority: str  # "Low", "Medium" or "High"
    summary: str
    confidence: float  # a number from 0 to 1


class ChatRequest(BaseModel):
    message: str
    session_id: UUID | None = None


class ChatResponse(BaseModel):
    reply: str
    session_id: UUID


class ConfirmRequest(BaseModel):
    session_id: UUID | None = None


class ConfirmResponse(BaseModel):
    ticket_id: str
    status: str
