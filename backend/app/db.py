from sqlalchemy import create_engine
from app.config import DATABASE_URL
from sqlalchemy.orm import Session

engine = create_engine(DATABASE_URL, pool_pre_ping=True)


def get_db():
    with Session(engine) as db:
        yield db
