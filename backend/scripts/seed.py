"""Seed the reference data, the office staff and one demo citizen. Safe to re-run.
Usage: python scripts/seed.py (run from backend/)
"""

import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import engine
from app.models import Category, Constituency, ServiceCenter, User
from app.prompts import CATEGORIES

CONSTITUENCY_NAME = "N.34 Bukit Gasing"
CENTER_NAME = "ADUN Bukit Gasing Office"
CENTER_ADDRESS = "7A, Jalan 52/8, Seksyen 52, 46200 Petaling Jaya, Selangor"
# (email, role, display name). Names are placeholders taken from the email; edit
# them here and re-run, which fills in any staff row that has no name yet.
STAFF = [
    ("yb.khairul@parlimen.gov.my", "Representative", "YB Khairul"),
    ("aina@parlimen.gov.my", "Aide", "Aina"),
    ("faizal@parlimen.gov.my", "Aide", "Faizal"),
    ("mei@parlimen.gov.my", "Aide", "Mei"),
    ("danish@parlimen.gov.my", "Intern", "Danish"),
    ("sara@parlimen.gov.my", "Intern", "Sara"),
]
# Matches TEST_USER_EMAIL in app/main.py, the stand-in citizen until real auth.
CITIZEN_EMAIL = "test123@gmail.com"


def get_or_create(db: Session, model, where: dict, **fields):
    row = db.scalar(select(model).filter_by(**where))
    if row is None:
        row = model(**where, **fields)
        db.add(row)
        db.flush()
        print(f"created {model.__tablename__}: {next(iter(where.values()))}")
    return row


def main() -> None:
    with Session(engine) as db:
        for name in CATEGORIES:
            get_or_create(db, Category, {"name": name})

        constituency = get_or_create(
            db,
            Constituency,
            {"name": CONSTITUENCY_NAME},
            geojson_ref="peninsular_2018_dun.geojson",
        )
        center = get_or_create(
            db,
            ServiceCenter,
            {"name": CENTER_NAME},
            address=CENTER_ADDRESS,
            constituency_id=constituency.id,
        )
        for email, role, name in STAFF:
            user = get_or_create(
                db, User, {"email": email}, profile="staff", role=role, service_center_id=center.id, name=name
            )
            if user.name is None:
                user.name = name
        get_or_create(db, User, {"email": CITIZEN_EMAIL}, profile="citizen")
        db.commit()
    print("seed complete")


if __name__ == "__main__":
    main()
