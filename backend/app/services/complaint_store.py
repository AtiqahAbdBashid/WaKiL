import uuid
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models import Complaint


def generate_ticket_id() -> str:
    return "WK-" + uuid.uuid4().hex[:8].upper()


def get_complaint_by_session(db: Session, session_id) -> Complaint | None:
    return db.scalar(select(Complaint).where(Complaint.session_id == session_id))


def create_complaint(
    db: Session,
    user_id,
    session_id,
    what_happened,
    location,
    when_text,
    category,
    priority,
    summary,
    confidence,
    manual_review,
) -> Complaint:
    complaint = Complaint(
        ticket_id=generate_ticket_id(),
        user_id=user_id,
        session_id=session_id,
        what_happened=what_happened,
        location=location,
        when_text=when_text,
        category=category,
        priority=priority,
        summary=summary,
        confidence=confidence,
        manual_review=manual_review,
    )
    db.add(complaint)
    db.commit()
    return complaint
