from google.genai import types
from app.schemas import ComplaintDraft, Classification
from app.prompts import REQUIRED_FIELDS, CATEGORIES
from app.services.gemini_client import call_gemini, extract_draft, classify, make_image_part
from app.services.rag import search

CONFIDENCE_THRESHOLD = 0.6


def build_contents(
    history: list,
    message: str | None = None,
    image: str | None = None,
) -> list:
    contents = []
    for m in history:
        role = "model" if m.role == "assistant" else "user"
        parts = []
        if m.content:
            parts.append(types.Part(text=m.content))
        img_url = getattr(m, "image_url", None)
        if img_url:
            img_part = make_image_part(img_url)
            if img_part:
                parts.append(img_part)
        if parts:
            contents.append(types.Content(role=role, parts=parts))

    user_parts = []
    if message:
        user_parts.append(types.Part(text=message))
    if image:
        img_part = make_image_part(image)
        if img_part:
            user_parts.append(img_part)
    if user_parts:
        contents.append(types.Content(role="user", parts=user_parts))

    return contents


def get_reply(
    message: str, history: list, image: str | None = None
) -> tuple[str, bool]:
    context = build_context(message)
    contents = build_contents(history, message, image=image)
    draft = extract_draft(contents)
    missing = get_missing_fields(draft)
    instruction = build_instruction(missing)
    contents.append(
        types.Content(
            role="user",
            parts=[
                types.Part(
                    text=f"[SYSTEM NOTE: {instruction}\n\nReference info (use only if relevant to the user's question):\n{context}]"
                )
            ],
        )
    )
    reply_text = call_gemini(contents)
    can_confirm = len(missing) == 0
    return reply_text, can_confirm


def get_missing_fields(draft: ComplaintDraft) -> list[str]:
    missing = []
    for name, value in draft.model_dump().items():
        if name in REQUIRED_FIELDS and value is None:
            missing.append(name)
    return missing


def build_instruction(missing: list[str]) -> str:
    if not missing:
        return (
            "All required details are collected. Summarise them (what happened, location, when) "
            "and tell the user to press the Confirm button to submit. "
            "Do NOT say the complaint has been recorded, submitted or filed, and do NOT give a "
            "ticket number: a ticket is only created when the user presses Confirm."
        )
    return (
        f"Still missing required details: {', '.join(missing)}. "
        "Ask for ONE missing detail politely. Do not ask for information already provided."
    )



def apply_fallback(result: Classification) -> tuple[Classification, bool]:
    manual_review = False
    if result.confidence < CONFIDENCE_THRESHOLD or result.category not in CATEGORIES:
        result.category = "Others"
        manual_review = True
    return result, manual_review


def finalize_complaint(contents: list) -> dict:
    result = classify(contents)
    result, manual_review = apply_fallback(result)
    return {
        "category": result.category,
        "priority": result.priority,
        "summary": result.summary,
        "confidence": result.confidence,
        "manual_review": manual_review,
    }


def build_context(message: str) -> str:
    results = search(message)
    return "\n\n".join(r["text"] for r in results)
