from app.db import init_db

print("tables created and mock data loaded" if init_db() else "tables already exist")
