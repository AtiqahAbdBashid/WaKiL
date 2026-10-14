import uuid
from sqlalchemy.orm import Session
from app.models import ChatSession, ChatMessage, Complaint
from sqlalchemy import select, delete
from datetime import datetime, timezone


def create_chat_session(db: Session, user_id) -> ChatSession:
    chat = ChatSession(user_id=user_id)
    db.add(chat)
    db.commit()
    return chat


def complete_session(db: Session, chat_session: ChatSession) -> None:
    chat_session.status = "completed"
    chat_session.ended_at = datetime.now(timezone.utc)
    db.commit()


def save_message(
    db: Session, session_id, role: str, content: str, image_url: str | None = None
) -> ChatMessage:
    msg = ChatMessage(session_id=session_id, role=role, content=content, image_url=image_url)
    db.add(msg)
    db.commit()
    return msg


def load_history(db: Session, session_id) -> list[ChatMessage]:
    stmt = (
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at)
    )
    return list(db.scalars(stmt))


def get_user_sessions(db: Session, user_id: uuid.UUID) -> list[dict]:
    sessions = list(
        db.scalars(
            select(ChatSession)
            .where(ChatSession.user_id == user_id)
            .order_by(ChatSession.started_at.desc())
        )
    )

    results = []
    for s in sessions:
        msgs = list(
            db.scalars(
                select(ChatMessage)
                .where(ChatMessage.session_id == s.id)
                .order_by(ChatMessage.created_at.asc())
            )
        )
        complaint = db.scalar(
            select(Complaint).where(Complaint.session_id == s.id)
        )

        title = "New Conversation"
        preview = ""
        for m in msgs:
            if m.role == "user" and m.content and m.content.strip():
                clean = m.content.strip()
                title = clean if len(clean) <= 45 else clean[:42] + "..."
                break

        if complaint and complaint.summary:
            title = complaint.summary if len(complaint.summary) <= 45 else complaint.summary[:42] + "..."

        if msgs:
            last = msgs[-1]
            last_text = last.content or ("Photo sent" if last.image_url else "")
            preview = last_text[:60]

        results.append({
            "id": s.id,
            "status": s.status,
            "started_at": s.started_at,
            "ended_at": s.ended_at,
            "title": title,
            "preview": preview,
            "complaint_ticket_id": complaint.ticket_id if complaint else None,
            "message_count": len(msgs),
        })

    return results


def get_session_detail(db: Session, session_id: uuid.UUID, user_id: uuid.UUID) -> dict | None:
    session = db.get(ChatSession, session_id)
    if not session or session.user_id != user_id:
        return None

    msgs = list(
        db.scalars(
            select(ChatMessage)
            .where(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.created_at.asc())
        )
    )
    complaint = db.scalar(
        select(Complaint).where(Complaint.session_id == session_id)
    )

    return {
        "id": session.id,
        "status": session.status,
        "started_at": session.started_at,
        "ended_at": session.ended_at,
        "messages": [
            {
                "id": m.id,
                "role": m.role,
                "content": m.content,
                "image_url": m.image_url,
                "created_at": m.created_at,
            }
            for m in msgs
        ],
        "can_confirm": session.status != "completed" and complaint is None,
        "complaint_ticket_id": complaint.ticket_id if complaint else None,
        "complaint_status": complaint.status if complaint else None,
        "parliament": complaint.parliament if complaint else None,
        "dun": complaint.dun if complaint else None,
    }


def delete_user_session(db: Session, session_id: uuid.UUID, user_id: uuid.UUID) -> bool:
    session = db.get(ChatSession, session_id)
    if not session or session.user_id != user_id:
        return False

    db.execute(delete(ChatMessage).where(ChatMessage.session_id == session_id))
    db.delete(session)
    db.commit()
    return True
