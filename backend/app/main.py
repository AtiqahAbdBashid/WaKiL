import uuid
import re
from contextlib import asynccontextmanager
from google.genai import types
from google.genai.errors import ClientError
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.prompts import CATEGORIES, PHOTO_REQUIRED_CATEGORIES
from app.db import get_db, init_db
from app.models import Category, ChatSession, Complaint, ComplaintUpdate, User
from app.schemas import (
    ChatRequest,
    ChatResponse,
    ConfirmRequest,
    ConfirmResponse,
    SuggestCategoryRequest,
    SuggestCategoryResponse,
    ComplaintFormRequest,
    ComplaintFormResponse,
    ChatSessionSummary,
    ChatSessionDetail,
)
from app.services.chatbot import (
    get_reply,
    build_contents,
    get_missing_fields,
    finalize_complaint,
    apply_fallback,
)
from app.services.gemini_client import extract_draft, classify, make_image_part
from app.services.chat_store import (
    get_session_complaint,
    create_chat_session,
    save_message,
    load_history,
    get_user_sessions,
    get_session_detail,
    delete_user_session,
)
from app.services.complaint_store import compose_body, create_complaint
from app.services.constituency import resolve_constituency, resolve_constituency_from_coords
from app.yb_portal.router import router as yb_portal_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Creates the tables and loads the mock data on first start against an empty database.
    if init_db():
        print("Database was empty: loaded sql/schema.sql and scripts/wakil_mock_500.sql")
    yield


app = FastAPI(lifespan=lifespan)

app.include_router(yb_portal_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(ClientError)
async def gemini_client_error_handler(request: Request, exc: ClientError):
    err_str = str(exc)
    if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
        return JSONResponse(
            status_code=429,
            content={"detail": "Gemini rate limit exceeded. Please wait a moment and try again."},
        )
    return JSONResponse(
        status_code=502,
        content={"detail": f"AI service error: {err_str}"},
    )


# Temporary until Firebase token verification replaces it.
TEST_USER_EMAIL = "test123@gmail.com"


def get_current_user(db: Session = Depends(get_db)) -> User:
    user = db.scalar(select(User).where(User.email == TEST_USER_EMAIL))
    if user is None:
        user = User(email=TEST_USER_EMAIL, profile="citizen")
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.get("/chat/sessions", response_model=list[ChatSessionSummary])
def list_chat_sessions(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_user_sessions(db, user.id)


@app.post("/chat/sessions", response_model=ChatSessionSummary)
def start_chat_session(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    chat = create_chat_session(db, user.id)
    return ChatSessionSummary(
        id=chat.id,
        status="active",
        started_at=chat.created_at,
        ended_at=None,
        title=chat.title,
        preview="",
        message_count=0,
    )


@app.get("/chat/sessions/{session_id}", response_model=ChatSessionDetail)
def get_chat_session(
    session_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    detail = get_session_detail(db, session_id, user.id)
    if detail is None:
        raise HTTPException(status_code=404, detail="Chat session not found")
    return detail


@app.delete("/chat/sessions/{session_id}")
def delete_chat_session_endpoint(
    session_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    success = delete_user_session(db, session_id, user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Chat session not found")
    return {"status": "deleted"}


@app.post("/chat", response_model=ChatResponse)
def chat(
    req: ChatRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if req.session_id is None:
        chat_session = create_chat_session(db, user.id)
        session_id = chat_session.id
    else:
        chat_session = db.get(ChatSession, req.session_id)
        if chat_session is None or chat_session.user_id != user.id:
            raise HTTPException(status_code=404, detail="Chat session not found")
        session_id = req.session_id

    history = load_history(db, session_id)
    reply, can_confirm = get_reply(req.message, history, image=req.image)
    image = req.image.strip() if req.image and req.image.strip() else None
    save_message(db, session_id, "user", req.message, image_url=image)
    save_message(db, session_id, "assistant", reply)
    return ChatResponse(reply=reply, session_id=session_id, can_confirm=can_confirm)


def _confirm_response(complaint) -> ConfirmResponse:
    parliament, dun = (None, None)
    if complaint.latitude is not None:
        parliament, dun = resolve_constituency_from_coords(complaint.latitude, complaint.longitude)
    return ConfirmResponse(
        ticket_id=str(complaint.id),
        status=complaint.status,
        parliament=parliament,
        dun=dun,
        image_url=complaint.attachment,
    )


@app.post("/chat/confirm", response_model=ConfirmResponse)
def confirm(
    req: ConfirmRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    chat_session = db.get(ChatSession, req.session_id)
    if chat_session is None or chat_session.user_id != user.id:
        raise HTTPException(status_code=404, detail="Chat session not found")

    # A chat produces one complaint; confirming again returns it.
    existing = get_session_complaint(db, chat_session.id)
    if existing is not None:
        return _confirm_response(existing)

    history = load_history(db, chat_session.id)
    # Fall back to the photo saved with the chat when the client did not resend it.
    image = req.image.strip() if req.image and req.image.strip() else None
    image = image or next((m.image_url for m in reversed(history) if m.image_url), None)
    contents = build_contents(
        history,
        "Process the complaint described in the conversation above.",
        image=image,
    )
    draft = extract_draft(contents)
    missing = get_missing_fields(draft)

    # A pinned location sent with the confirm request satisfies the location field.
    if "location" in missing and req.location and req.location.strip():
        missing.remove("location")

    if missing:
        raise HTTPException(
            status_code=422, detail=f"Missing details: {', '.join(missing)}"
        )

    location = req.location.strip() if req.location and req.location.strip() else draft.location
    result = finalize_complaint(contents)
    try:
        complaint = create_complaint(
            db,
            user.id,
            result["category"],
            result["summary"],
            compose_body(draft.what_happened, location, draft.when),
            attachment=image,
            chat_session_id=chat_session.id,
            location=location,
        )
    except IntegrityError:
        # A concurrent confirm for the same chat won the unique chat_session_id.
        db.rollback()
        existing = get_session_complaint(db, chat_session.id)
        if existing is None:
            raise
        return _confirm_response(existing)
    return _confirm_response(complaint)


@app.get("/complaints/categories")
def get_categories():
    return {"categories": CATEGORIES}


@app.get("/complaints/mine")
def list_my_complaints(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return a citizen-safe view of the signed-in citizen's complaints.

    Only lifecycle status changes are exposed. Staff notes, case groups,
    assignments, representative flags, and staff identities stay private.
    """
    rows = db.execute(
        select(Complaint, Category.name)
        .join(Category, Complaint.category_id == Category.id)
        .where(Complaint.user_id == user.id)
        .order_by(Complaint.created_at.desc())
    ).all()
    complaint_ids = [complaint.id for complaint, _ in rows]
    updates_by_complaint: dict[uuid.UUID, list[ComplaintUpdate]] = {}
    if complaint_ids:
        updates = db.scalars(
            select(ComplaintUpdate)
            .where(ComplaintUpdate.complaint_id.in_(complaint_ids))
            .order_by(ComplaintUpdate.created_at)
        )
        for update in updates:
            # Never return staff-authored freeform notes or internal workflow actions.
            match = re.match(r"^\[(status|resolve|group-assign)\]", update.body)
            if match:
                updates_by_complaint.setdefault(update.complaint_id, []).append(update)

    def status_label(status: str) -> str:
        return {
            "Pending": "Submitted",
            "In Progress": "In progress",
            "Resolved": "Resolved",
        }.get(status, "Status updated")

    complaints = []
    for complaint, category in rows:
        timeline = [{"status": "Pending", "label": "Submitted", "at": complaint.created_at.isoformat()}]
        for update in updates_by_complaint.get(complaint.id, []):
            if update.body.startswith("[resolve]"):
                next_status = "Resolved"
            elif update.body.startswith("[group-assign]"):
                # Claiming a pending complaint moves it to In Progress.
                next_status = "In Progress" if timeline[-1]["status"] == "Pending" else timeline[-1]["status"]
            else:
                match = re.search(r"→\s*(Pending|In Progress|Resolved)\s*$", update.body)
                if not match:
                    continue
                next_status = match.group(1)
            if timeline[-1]["status"] != next_status:
                timeline.append({
                    "status": next_status,
                    "label": status_label(next_status),
                    "at": update.created_at.isoformat(),
                })
        if timeline[-1]["status"] != complaint.status:
            last_status_update = updates_by_complaint.get(complaint.id, [])
            timeline.append({
                "status": complaint.status,
                "label": status_label(complaint.status),
                "at": (
                    last_status_update[-1].created_at.isoformat()
                    if last_status_update
                    else complaint.created_at.isoformat()
                ),
            })
        complaints.append({
            "id": str(complaint.id),
            "title": complaint.title,
            "category": category,
            "categories": [category, *(complaint.secondary_categories or [])],
            "status": complaint.status,
            "created_at": complaint.created_at.isoformat(),
            "timeline": timeline,
        })
    return {"complaints": complaints}


@app.post("/complaints/suggest-category", response_model=SuggestCategoryResponse)
def suggest_category(req: SuggestCategoryRequest):
    has_summary = bool(req.summary and req.summary.strip())
    has_image = bool(req.image and req.image.strip())

    if not has_summary and not has_image:
        raise HTTPException(
            status_code=422,
            detail="Please provide a summary or upload an image to receive AI suggestions.",
        )

    if has_summary:
        complaint_text = f"What happened: {req.summary.strip()}"
    else:
        complaint_text = (
            "Analyze the attached photo showing a civic or municipal issue. "
            "Determine the category and priority, and produce a concise 1-sentence summary of what happened."
        )

    if req.location and req.location.strip():
        complaint_text += f"\nLocation: {req.location.strip()}"
    if req.when and req.when.strip():
        complaint_text += f"\nWhen: {req.when.strip()}"

    parts = [types.Part(text=complaint_text)]
    if has_image:
        img_part = make_image_part(req.image)
        if img_part:
            parts.append(img_part)

    contents = [
        types.Content(
            role="user",
            parts=parts,
        )
    ]
    result = classify(contents)
    result, _ = apply_fallback(result)
    return SuggestCategoryResponse(
        category=result.category,
        secondary_categories=[
            category for category in dict.fromkeys(result.secondary_categories)
            if category in CATEGORIES and category != result.category
        ],
        priority=result.priority,
        confidence=result.confidence,
        summary=result.summary,
        summary_tip=result.summary_tip,
    )


@app.post("/complaints", response_model=ComplaintFormResponse)
def submit_complaint_form(
    req: ComplaintFormRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not req.what_happened.strip() or not req.location.strip() or not req.when.strip():
        raise HTTPException(
            status_code=422,
            detail="What happened, location, and when are all required.",
        )

    complaint_text = (
        f"What happened: {req.what_happened}\nLocation: {req.location}\nWhen: {req.when}"
    )
    parts = [types.Part(text=complaint_text)]
    if req.image:
        img_part = make_image_part(req.image)
        if img_part:
            parts.append(img_part)

    contents = [types.Content(role="user", parts=parts)]

    result = finalize_complaint(contents)
    final_category = (
        req.category if req.category and req.category in CATEGORIES else result["category"]
    )
    ai_categories = [
        category for category in dict.fromkeys(req.categories)
        if category in CATEGORIES
    ]
    if final_category not in ai_categories:
        ai_categories.insert(0, final_category)
    needs_photo = any(category in PHOTO_REQUIRED_CATEGORIES for category in ai_categories)
    photo_exception_reason = None
    if needs_photo and not req.image:
        photo_exception_reason = req.photo_exception_reason
        if not photo_exception_reason:
            raise HTTPException(
                status_code=422,
                detail="Photo evidence is required for this category. If a photo is unavailable, unsafe to take, or sensitive, select an exception reason.",
            )
    final_priority = (
        req.priority
        if req.priority and req.priority in ["Low", "Medium", "High"]
        else result["priority"]
    )

    location = req.location.strip()
    parliament, dun = resolve_constituency(location)
    complaint = create_complaint(
        db,
        user.id,
        final_category,
        result["summary"],
        compose_body(req.what_happened, location, req.when),
        attachment=req.image,
        location=location,
        secondary_categories=[category for category in ai_categories if category != final_category],
        photo_exception_reason=photo_exception_reason,
    )
    return ComplaintFormResponse(
        ticket_id=str(complaint.id),
        status=complaint.status,
        category=final_category,
        categories=ai_categories,
        priority=final_priority,
        summary=result["summary"],
        parliament=parliament,
        dun=dun,
        image_url=complaint.attachment,
        manual_review_required=bool(photo_exception_reason),
        photo_exception_reason=photo_exception_reason,
    )
