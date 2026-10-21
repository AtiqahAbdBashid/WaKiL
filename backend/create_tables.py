from app.db import init_db

print("tables created" if init_db() else "tables already exist")
