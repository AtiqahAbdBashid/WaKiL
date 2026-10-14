from pathlib import Path
from app.services.mongo_client import db
from app.services.gemini_client import embed_texts

DOCS_DIR = (
    Path(__file__).resolve().parents[2] / "docs"
)  # services → app → backend → docs


def load_chunks() -> list[dict]:
    chunks = []
    for file in DOCS_DIR.glob("*.md"):
        text = file.read_text(encoding="utf-8")
        for section in text.split("\n## "):
            section = section.strip().removesuffix("-").strip()
            if not section or section.startswith("# "):
                continue
            chunks.append({"source": file.name, "text": section})
    return chunks


def ingest() -> int:
    chunks = load_chunks()
    vectors = embed_texts([c["text"] for c in chunks])
    for chunk, vector in zip(chunks, vectors):
        chunk["embedding"] = vector
    db["rag_chunks"].delete_many({})
    db["rag_chunks"].insert_many(chunks)
    return len(chunks)


def search(query: str, k: int = 3) -> list[dict]:
    query_vector = embed_texts([query])[0]
    pipeline = [
        {
            "$vectorSearch": {
                "index": "rag_index",
                "path": "embedding",
                "queryVector": query_vector,
                "numCandidates": 50,
                "limit": k,
            }
        },
        {
            "$project": {
                "_id": 0,
                "source": 1,
                "text": 1,
                "score": {"$meta": "vectorSearchScore"},
            }
        },
    ]
    return list(db["rag_chunks"].aggregate(pipeline))


if __name__ == "__main__":
    print(ingest())
