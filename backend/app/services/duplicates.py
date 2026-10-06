import uuid
from pymongo import MongoClient
from sqlalchemy.orm import Session
from app.config import MONGODB_URL  # use the same name rag.py imports
from app.models import Complaint
from app.services.gemini_client import embed_texts

DUPLICATE_THRESHOLD = 0.88  # tune with real test pairs
OPEN_STATUSES = ("Pending", "In Progress")

_client = MongoClient(MONGODB_URL, serverSelectionTimeoutMS=5000)
_col = _client["wakil"]["complaint_embeddings"]


def _locations_match(loc1: str | None, loc2: str | None) -> bool:
    if not loc1 or not loc2:
        return False
    l1 = loc1.strip().lower()
    l2 = loc2.strip().lower()
    return l1 in l2 or l2 in l1


def _vector(c: Complaint) -> list[float]:
    return embed_texts([f"{c.what_happened}. Location: {c.location}."])[0]


def store_embedding(c: Complaint, vector: list[float] | None = None) -> None:
    _col.insert_one(
        {
            "complaint_id": str(c.id),
            "category": c.category,
            "embedding": vector or _vector(c),
        }
    )


def find_possible_duplicate(db: Session, c: Complaint) -> Complaint | None:
    print("duplicate check running for", c.ticket_id)
    vector = _vector(c)
    pipeline = [
        {
            "$vectorSearch": {
                "index": "complaint_index",
                "path": "embedding",
                "queryVector": vector,
                "numCandidates": 50,
                "limit": 5,
                "filter": {"category": c.category},
            }
        },
        {"$project": {"complaint_id": 1, "score": {"$meta": "vectorSearchScore"}}},
    ]
    match = None
    for hit in _col.aggregate(pipeline):
        print("duplicate score:", hit["score"])  # remove after tuning
        if hit["score"] < DUPLICATE_THRESHOLD:
            break
        other = db.get(Complaint, uuid.UUID(hit["complaint_id"]))
        if (
            other
            and other.id != c.id
            and other.status in OPEN_STATUSES
            and _locations_match(c.location, other.location)
        ):
            match = other
            break
    store_embedding(c, vector)
    return match
