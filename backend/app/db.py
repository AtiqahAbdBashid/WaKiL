from pathlib import Path
from sqlalchemy import create_engine, inspect
from app.config import DATABASE_URL
from sqlalchemy.orm import Session

engine = create_engine(DATABASE_URL, pool_pre_ping=True)

SCHEMA_PATH = Path(__file__).resolve().parent.parent / "sql" / "schema.sql"


def init_db() -> bool:
    """Load sql/schema.sql into an empty database. Returns True if it ran.

    Uses the SQL file rather than Base.metadata.create_all because the schema
    also defines the require_staff_author trigger, which the models cannot express.
    """
    if inspect(engine).has_table("users"):
        return False
    raw = engine.raw_connection()
    try:
        # The script manages its own BEGIN/COMMIT; a parameterless execute sends
        # it as one simple query, so the $$ function body is passed through intact.
        raw.driver_connection.autocommit = True
        raw.driver_connection.execute(SCHEMA_PATH.read_text(encoding="utf-8"))
    finally:
        raw.close()
    return True


def get_db():
    with Session(engine) as db:
        yield db
