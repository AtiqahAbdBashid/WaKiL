from pymongo import MongoClient
from app.config import MONGODB_URL

client = MongoClient(MONGODB_URL)
db = client["wakil"]
