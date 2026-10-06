from sqlalchemy import select
from sqlalchemy.orm import Session
from app.db import engine
from app.models import Complaint
from app.services.duplicates import store_embedding
from app.services.duplicates import store_embedding, _col

_col.delete_many({})  # start clean, so no ticket is stored twice

with Session(engine) as db:
    for c in db.scalars(select(Complaint).order_by(Complaint.created_at)):
        store_embedding(c)
        print("stored", c.ticket_id)
