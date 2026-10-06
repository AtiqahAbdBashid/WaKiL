from fastapi import FastAPI, HTTPException, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.services.duplicates import find_possible_duplicate
from app.db import get_db
from app.models import ChatSession, User
from app.schemas import ChatRequest, ChatResponse, ConfirmRequest, ConfirmResponse
from app.services.chatbot import (
    get_reply,
    build_contents,
    get_missing_fields,
    finalize_complaint,
)
from app.services.gemini_client import extract_draft
from app.services.chat_store import (
    create_chat_session,
    save_message,
    load_history,
    complete_session,
)
from app.services.complaint_store import create_complaint, get_complaint_by_session

app = FastAPI()

TEST_USER_EMAIL = "test123@gmail.com"  # temporary, removed when Firebase auth arrives


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest, db: Session = Depends(get_db)):
    if req.session_id is None:
        user = db.scalar(select(User).where(User.email == TEST_USER_EMAIL))
        chat_session = create_chat_session(db, user.id)
        session_id = chat_session.id
    else:
        chat_session = db.get(ChatSession, req.session_id)
        if chat_session is None:
            raise HTTPException(status_code=404, detail="Chat session not found")
        session_id = req.session_id

    history = load_history(db, session_id)
    reply = get_reply(req.message, history)
    save_message(db, session_id, "user", req.message)
    save_message(db, session_id, "assistant", reply)
    return ChatResponse(reply=reply, session_id=session_id)


@app.post("/chat/confirm", response_model=ConfirmResponse)
def confirm(req: ConfirmRequest, db: Session = Depends(get_db)):
    chat_session = db.get(ChatSession, req.session_id)
    if chat_session is None:
        raise HTTPException(status_code=404, detail="Chat session not found")

    existing = get_complaint_by_session(db, chat_session.id)
    if existing is not None:
        return ConfirmResponse(ticket_id=existing.ticket_id, status=existing.status)

    contents = build_contents(
        load_history(db, chat_session.id),
        "Process the complaint described in the conversation above.",
    )
    draft = extract_draft(contents)
    missing = get_missing_fields(draft)
    if missing:
        raise HTTPException(
            status_code=422, detail=f"Missing details: {', '.join(missing)}"
        )

    result = finalize_complaint(contents)
    complaint = create_complaint(
        db,
        chat_session.user_id,
        chat_session.id,
        draft.what_happened,
        draft.location,
        draft.when,
        result["category"],
        result["priority"],
        result["summary"],
        result["confidence"],
        result["manual_review"],
    )
    try:
        match = find_possible_duplicate(db, complaint)
        if match:
            complaint.possible_duplicate_of = match.id
            complaint.duplicate_review = "pending"
            db.commit()
    except Exception as e:
        print("duplicate check skipped:", e)
    complete_session(db, chat_session)
    return ConfirmResponse(ticket_id=complaint.ticket_id, status=complaint.status)
