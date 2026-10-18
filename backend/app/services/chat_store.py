import uuid
from datetime import datetime, timezone
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session
from app.models import ChatMessage, ChatSession, Complaint
from app.services.constituency import resolve_constituency_from_coords

DEFAULT_TITLE = "New Conversation"
TITLE_MAX = 45


def create_chat_session(db: Session, user_id) -> ChatSession:
    chat = ChatSession(user_id=user_id)
    db.add(chat)
    db.commit()
    return chat


def _short(text: str, limit: int) -> str:
    return text if len(text) <= limit else text[: limit - 3] + "..."


def save_message(
    db: Session, session_id, sender: str, body: str, image_url: str | None = None
) -> ChatMessage:
    msg = ChatMessage(session_id=session_id, sender=sender, body=body, image_url=image_url)
    db.add(msg)

    session = db.get(ChatSession, session_id)
    session.updated_at = datetime.now(timezone.utc)
    if sender == "user" and session.title == DEFAULT_TITLE and body.strip():
        session.title = _short(body.strip(), TITLE_MAX)

    db.commit()
    return msg


def load_history(db: Session, session_id) -> list[ChatMessage]:
    stmt = (
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at)
    )
    return list(db.scalars(stmt))


def get_session_complaint(db: Session, session_id) -> Complaint | None:
    return db.scalar(select(Complaint).where(Complaint.chat_session_id == session_id))


# chat_sessions stores no status: a session is "completed" once a complaint
# links to it, and ended_at is that complaint's creation time.
def get_user_sessions(db: Session, user_id: uuid.UUID) -> list[dict]:
    sessions = list(
        db.scalars(
            select(ChatSession)
            .where(ChatSession.user_id == user_id)
            .order_by(ChatSession.updated_at.desc())
        )
    )
    counts = dict(
        db.execute(
            select(ChatMessage.session_id, func.count())
            .where(ChatMessage.session_id.in_([s.id for s in sessions]))
            .group_by(ChatMessage.session_id)
        ).all()
    )

    complaints = {
        c.chat_session_id: c
        for c in db.scalars(
            select(Complaint).where(Complaint.chat_session_id.in_([s.id for s in sessions]))
        )
    }

    results = []
    for s in sessions:
        complaint = complaints.get(s.id)
        last = db.scalar(
            select(ChatMessage)
            .where(ChatMessage.session_id == s.id)
            .order_by(ChatMessage.created_at.desc())
            .limit(1)
        )
        results.append({
            "id": s.id,
            "status": "completed" if complaint else "active",
            "started_at": s.created_at,
            "ended_at": complaint.created_at if complaint else None,
            "title": s.title,
            "preview": last.body[:60] if last else "",
            "complaint_ticket_id": str(complaint.id) if complaint else None,
            "message_count": counts.get(s.id, 0),
        })

    return results


def get_session_detail(db: Session, session_id: uuid.UUID, user_id: uuid.UUID) -> dict | None:
    session = db.get(ChatSession, session_id)
    if not session or session.user_id != user_id:
        return None

    complaint = get_session_complaint(db, session_id)
    parliament, dun = (None, None)
    if complaint and complaint.latitude is not None:
        parliament, dun = resolve_constituency_from_coords(complaint.latitude, complaint.longitude)
    return {
        "id": session.id,
        "status": "completed" if complaint else "active",
        "started_at": session.created_at,
        "ended_at": complaint.created_at if complaint else None,
        "messages": [
            {
                "id": m.id,
                "role": m.sender,
                "content": m.body,
                "image_url": m.image_url,
                "created_at": m.created_at,
            }
            for m in load_history(db, session_id)
        ],
        "can_confirm": False,
        "complaint_ticket_id": str(complaint.id) if complaint else None,
        "complaint_status": complaint.status if complaint else None,
        "parliament": parliament,
        "dun": dun,
    }


def delete_user_session(db: Session, session_id: uuid.UUID, user_id: uuid.UUID) -> bool:
    session = db.get(ChatSession, session_id)
    if not session or session.user_id != user_id:
        return False

    db.execute(delete(ChatMessage).where(ChatMessage.session_id == session_id))
    db.delete(session)
    db.commit()
    return True
