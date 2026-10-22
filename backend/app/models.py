import uuid
from datetime import datetime
from sqlalchemy import (
    ARRAY,
    Boolean,
    CheckConstraint,
    DateTime,
    Double,
    ForeignKey,
    String,
    Text,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

# Mirrors backend/sql/schema.sql, which is the source of truth. The schema also
# holds the require_staff_author trigger on case_groups and complaint_updates,
# which SQLAlchemy cannot express, so build tables from the SQL file.


class Base(DeclarativeBase):
    pass


def _uuid_pk() -> Mapped[uuid.UUID]:
    return mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )


class Constituency(Base):
    __tablename__ = "constituencies"

    id: Mapped[uuid.UUID] = _uuid_pk()
    name: Mapped[str] = mapped_column(String(100))
    geojson_ref: Mapped[str | None] = mapped_column(String(100), nullable=True)


class ServiceCenter(Base):
    __tablename__ = "service_centers"

    id: Mapped[uuid.UUID] = _uuid_pk()
    name: Mapped[str] = mapped_column(String(150))
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    constituency_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("constituencies.id"), unique=True
    )


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("profile IN ('citizen', 'staff')"),
        CheckConstraint("role IN ('Representative', 'Aide', 'Intern')"),
        CheckConstraint(
            "(profile = 'staff' AND role IS NOT NULL AND service_center_id IS NOT NULL)"
            " OR (profile = 'citizen' AND role IS NULL AND service_center_id IS NULL)",
            name="users_staff_fields",
        ),
    )

    id: Mapped[uuid.UUID] = _uuid_pk()
    service_center_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("service_centers.id"), nullable=True
    )
    email: Mapped[str] = mapped_column(String(255), unique=True)
    name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    password_hash: Mapped[str | None] = mapped_column(Text, nullable=True)
    profile: Mapped[str] = mapped_column(String(10))
    role: Mapped[str | None] = mapped_column(String(20), nullable=True)
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, server_default=text("true")
    )


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[uuid.UUID] = _uuid_pk()
    name: Mapped[str] = mapped_column(String(100), unique=True)


class CaseGroup(Base):
    __tablename__ = "case_groups"

    id: Mapped[uuid.UUID] = _uuid_pk()
    user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    title: Mapped[str] = mapped_column(String(200))


class Complaint(Base):
    __tablename__ = "complaints"
    __table_args__ = (
        CheckConstraint("status IN ('Pending', 'In Progress', 'Resolved')"),
        CheckConstraint(
            "(latitude IS NULL) = (longitude IS NULL) AND (latitude IS NULL OR"
            " (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180))",
            name="complaints_coords",
        ),
    )

    id: Mapped[uuid.UUID] = _uuid_pk()
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    category_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("categories.id"))
    secondary_categories: Mapped[list[str]] = mapped_column(
        ARRAY(String), nullable=False, server_default=text("'{}'")
    )
    photo_exception_reason: Mapped[str | None] = mapped_column(String(20), nullable=True)
    case_group_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("case_groups.id"), nullable=True
    )
    chat_session_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("chat_sessions.id", ondelete="SET NULL"), unique=True, nullable=True
    )
    title: Mapped[str] = mapped_column(String(200))
    body: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    status: Mapped[str] = mapped_column(
        String(20), default="Pending", server_default="Pending"
    )
    rep_attention: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default=text("false")
    )
    attachment: Mapped[str | None] = mapped_column(Text, nullable=True)
    latitude: Mapped[float | None] = mapped_column(Double, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Double, nullable=True)


class ComplaintUpdate(Base):
    __tablename__ = "complaint_updates"

    id: Mapped[uuid.UUID] = _uuid_pk()
    complaint_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("complaints.id", ondelete="CASCADE")
    )
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    body: Mapped[str] = mapped_column(Text)
    attachment: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id: Mapped[uuid.UUID] = _uuid_pk()
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    title: Mapped[str] = mapped_column(
        String(200), default="New Conversation", server_default="New Conversation"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[uuid.UUID] = _uuid_pk()
    session_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("chat_sessions.id", ondelete="CASCADE")
    )
    sender: Mapped[str] = mapped_column(String(20))
    body: Mapped[str] = mapped_column(Text)
    image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
