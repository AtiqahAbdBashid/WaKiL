from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models import Category, Complaint
from app.services.constituency import parse_coordinates

FALLBACK_CATEGORY = "Others"
TITLE_MAX = 200


def get_category_id(db: Session, name: str | None):
    category = db.scalar(select(Category).where(Category.name == name))
    if category is None:
        category = db.scalar(select(Category).where(Category.name == FALLBACK_CATEGORY))
    if category is None:
        raise RuntimeError("Categories are not seeded. Run scripts/seed.py first.")
    return category.id


# The location text and time the citizen gave are kept in the body; the pinned
# coordinates are also stored in latitude and longitude.
def compose_body(what_happened: str, location: str | None, when: str | None) -> str:
    details = []
    if location and location.strip():
        details.append(f"Location: {location.strip()}")
    if when and when.strip():
        details.append(f"When: {when.strip()}")
    body = what_happened.strip()
    return f"{body}\n\n" + "\n".join(details) if details else body


def create_complaint(
    db: Session,
    user_id,
    category: str,
    title: str,
    body: str,
    attachment: str | None = None,
    chat_session_id=None,
    location: str | None = None,
) -> Complaint:
    latitude, longitude = parse_coordinates(location)
    complaint = Complaint(
        user_id=user_id,
        category_id=get_category_id(db, category),
        chat_session_id=chat_session_id,
        title=title.strip()[:TITLE_MAX],
        body=body,
        attachment=attachment,
        latitude=latitude,
        longitude=longitude,
    )
    db.add(complaint)
    db.commit()
    return complaint
