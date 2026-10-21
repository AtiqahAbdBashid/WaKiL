from pathlib import Path
from sqlalchemy import create_engine, inspect
from app.config import DATABASE_URL
from sqlalchemy.orm import Session

engine = create_engine(DATABASE_URL, pool_pre_ping=True)

BACKEND_DIR = Path(__file__).resolve().parent.parent
SCHEMA_PATH = BACKEND_DIR / "sql" / "schema.sql"
MOCK_DATA_PATH = BACKEND_DIR / "scripts" / "wakil_mock_500.sql"


def init_db() -> bool:
    """Load sql/schema.sql, then the mock dataset, into an empty database.
    Returns True if it ran.

    Uses the SQL file rather than Base.metadata.create_all because the schema
    also defines the require_staff_author trigger, which the models cannot express.
    """
    if inspect(engine).has_table("users"):
        return False
    raw = engine.raw_connection()
    try:
        # Each script manages its own BEGIN/COMMIT; a parameterless execute sends
        # it as one simple query, so the $$ function body is passed through intact.
        raw.driver_connection.autocommit = True
        raw.driver_connection.execute(SCHEMA_PATH.read_text(encoding="utf-8"))
        raw.driver_connection.execute(MOCK_DATA_PATH.read_text(encoding="utf-8"))
    finally:
        raw.close()
    return True


def get_db():
    with Session(engine) as db:
        yield db
