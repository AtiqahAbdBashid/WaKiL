from google.genai import types
from app.schemas import ComplaintDraft, Classification
from app.prompts import REQUIRED_FIELDS, CATEGORIES
from app.services.gemini_client import call_gemini, extract_draft, classify
from app.services.rag import search

CONFIDENCE_THRESHOLD = 0.6


def build_contents(history: list, message: str | None = None) -> list:
    contents = []
    for m in history:
        role = "model" if m.role == "assistant" else "user"
        contents.append(types.Content(role=role, parts=[types.Part(text=m.content)]))
    if message is not None:
        contents.append(types.Content(role="user", parts=[types.Part(text=message)]))
    return contents


def get_reply(message: str, history: list) -> str:
    context = build_context(message)
    contents = build_contents(history, message)
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
    return call_gemini(contents)


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
