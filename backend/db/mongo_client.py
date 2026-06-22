import json
import os
import logging
import motor.motor_asyncio
from config import MONGO_URI, MONGO_DB_NAME, DATA_DIR

logger = logging.getLogger("uvicorn")

# ── Mock Database for Local Fallback ──────────────────────────────────
class MockCursor:
    def __init__(self, data):
        self.data = data

    def sort(self, key, direction=-1):
        reverse = (direction == -1)
        # Handle cases where key might not exist or be None
        self.data = sorted(self.data, key=lambda x: x.get(key) if x.get(key) is not None else 0, reverse=reverse)
        return self

    async def to_list(self, length=100):
        return self.data[:length]

class MockCollection:
    def __init__(self, filename):
        self.filename = filename
        self._data = None

    def _load_data(self):
        if self._data is None:
            filepath = os.path.join(DATA_DIR, "seeded", self.filename)
            if os.path.exists(filepath):
                try:
                    with open(filepath, "r") as f:
                        self._data = json.load(f)
                except Exception as e:
                    logger.error(f"Error loading fallback data from {filepath}: {e}")
                    self._data = []
            else:
                logger.warning(f"Fallback data file not found: {filepath}")
                self._data = []
        return self._data

    def find(self, filter=None, projection=None):
        data = self._load_data()
        if filter:
            filtered_data = []
            for item in data:
                match = True
                for k, v in filter.items():
                    if item.get(k) != v:
                        match = False
                        break
                if match:
                    filtered_data.append(item)
            data = filtered_data
        return MockCursor(data)

    async def find_one(self, filter, projection=None):
        data = self._load_data()
        for item in data:
            match = True
            for k, v in filter.items():
                if item.get(k) != v:
                    match = False
                    break
            if match:
                return item
        return None

class MockDatabase:
    def __init__(self):
        self.wards = MockCollection("wards.json")
        self.forecasts = MockCollection("forecasts.json")
        self.attributions = MockCollection("attributions.json")
        self.priorities = MockCollection("priorities.json")
        self.advisories = MockCollection("advisories.json")

# Motor async client — singleton, reused across the app
_client: motor.motor_asyncio.AsyncIOMotorClient | None = None
_db = None
_use_mock = False


async def get_db():
    """Get (or create) the async MongoDB database connection with fallback."""
    global _client, _db, _use_mock
    if _db is not None:
        return _db

    if _use_mock:
        return MockDatabase()

    try:
        # Check connection with a 2-second timeout
        client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI, serverSelectionTimeoutMS=2000)
        await client.admin.command('ping')
        _client = client
        _db = _client[MONGO_DB_NAME]
        logger.info("🟢 Connected to MongoDB!")
        return _db
    except Exception as e:
        logger.warning(f"⚠️  MongoDB connection failed ({e}). Falling back to local JSON data files.")
        _use_mock = True
        _db = MockDatabase()
        return _db


async def close_db():
    """Close the MongoDB connection (call on app shutdown)."""
    global _client, _db
    if _client:
        _client.close()
        _client = None
        _db = None
