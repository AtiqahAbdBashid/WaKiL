from sqlalchemy.orm import Session
from app.models import ChatSession, ChatMessage
from sqlalchemy import select
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


def save_message(db: Session, session_id, role: str, content: str) -> ChatMessage:
    msg = ChatMessage(session_id=session_id, role=role, content=content)
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
