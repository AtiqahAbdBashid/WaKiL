import os
from dotenv import load_dotenv

load_dotenv()  # reads the .env file

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MONGODB_URL = os.getenv("MONGODB_URL")
DATABASE_URL = os.getenv("DATABASE_URL")
GEMINI_MODEL = "gemini-3.5-flash-lite"
EMBEDDING_MODEL = "gemini-embedding-001"
