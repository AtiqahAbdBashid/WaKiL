import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, func, ForeignKey, Text, Float, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    full_name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(255), unique=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    status: Mapped[str] = mapped_column(String(20), default="active")
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    ended_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    session_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("chat_sessions.id"))
    role: Mapped[str] = mapped_column(String(20))
    content: Mapped[str] = mapped_column(Text)
    image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class Complaint(Base):
    __tablename__ = "complaints"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    ticket_id: Mapped[str] = mapped_column(String(30), unique=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    session_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("chat_sessions.id"))
    what_happened: Mapped[str] = mapped_column(Text)
    location: Mapped[str] = mapped_column(String(255))
    when_text: Mapped[str] = mapped_column(String(100))
    parliament: Mapped[str | None] = mapped_column(String(100), nullable=True)
    dun: Mapped[str | None] = mapped_column(String(100), nullable=True)
    image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(50))
    priority: Mapped[str] = mapped_column(String(10))
    summary: Mapped[str] = mapped_column(Text)
    confidence: Mapped[float] = mapped_column(Float)
    manual_review: Mapped[bool] = mapped_column(Boolean, default=False)
    # Lifecycle (ERD v3 Decision 7): exactly Pending / In Progress / Resolved,
    # intake always Pending, no fourth state. The staff-side rule for
    # stored-vs-derived disagreement (CHECK canonical, COMPLAINT_STATUS_VIEW
    # deriving expected status from case_group_id) lives in
    # docs/Wakil_ERDiagram_Mermaid_3.md integrity notes; Resolved stays
    # terminal and owner-only there.
    status: Mapped[str] = mapped_column(String(20), default="Pending")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    possible_duplicate_of: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("complaints.id"), nullable=True
    )
    duplicate_of: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("complaints.id"), nullable=True
    )
    duplicate_review: Mapped[str] = mapped_column(String(20), default="none")
