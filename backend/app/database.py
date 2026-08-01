import asyncio
import os
import json
import logging
from typing import Dict, Any, List, Optional
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

logger = logging.getLogger("mediexplain.database")

# In-memory/file fallback database store if MongoDB connection fails
class FallbackCollection:
    def __init__(self, name: str, filepath: str):
        self.name = name
        self.filepath = filepath
        self._data: List[Dict[str, Any]] = []
        self._load()

    def _load(self):
        if os.path.exists(self.filepath):
            try:
                with open(self.filepath, "r") as f:
                    self._data = json.load(f)
            except Exception:
                self._data = []
        else:
            self._data = []

    def _save(self):
        os.makedirs(os.path.dirname(self.filepath), exist_ok=True)
        with open(self.filepath, "w") as f:
            json.dump(self._data, f, indent=2, default=str)

    async def insert_one(self, document: Dict[str, Any]):
        doc_copy = dict(document)
        if "_id" not in doc_copy:
            import uuid
            doc_copy["_id"] = str(uuid.uuid4())
        self._data.append(doc_copy)
        self._save()
        class InsertResult:
            inserted_id = doc_copy["_id"]
        return InsertResult()

    async def find_one(self, query: Dict[str, Any]):
        for item in self._data:
            match = True
            for k, v in query.items():
                if item.get(k) != v:
                    match = False
                    break
            if match:
                return dict(item)
        return None

    async def find(self, query: Dict[str, Any] = None):
        query = query or {}
        results = []
        for item in self._data:
            match = True
            for k, v in query.items():
                if item.get(k) != v:
                    match = False
                    break
            if match:
                results.append(dict(item))
        class Cursor:
            def __init__(self, items):
                self.items = items
            def sort(self, key, direction=-1):
                reverse = direction < 0
                self.items.sort(key=lambda x: x.get(key, ""), reverse=reverse)
                return self
            def limit(self, l):
                self.items = self.items[:l]
                return self
            async def to_list(self, length=1000):
                return self.items[:length]
            def __aiter__(self):
                self._iter = iter(self.items)
                return self
            async def __anext__(self):
                try:
                    return next(self._iter)
                except StopIteration:
                    raise StopAsyncIteration
        return Cursor(results)

    async def update_one(self, query: Dict[str, Any], update: Dict[str, Any]):
        for item in self._data:
            match = True
            for k, v in query.items():
                if item.get(k) != v:
                    match = False
                    break
            if match:
                if "$set" in update:
                    for set_k, set_v in update["$set"].items():
                        item[set_k] = set_v
                self._save()
                class UpdateResult:
                    modified_count = 1
                return UpdateResult()
        class UpdateResult:
            modified_count = 0
        return UpdateResult()

    async def delete_one(self, query: Dict[str, Any]):
        for idx, item in enumerate(self._data):
            match = True
            for k, v in query.items():
                if item.get(k) != v:
                    match = False
                    break
            if match:
                del self._data[idx]
                self._save()
                class DeleteResult:
                    deleted_count = 1
                return DeleteResult()
        class DeleteResult:
            deleted_count = 0
        return DeleteResult()

    async def count_documents(self, query: Dict[str, Any] = None):
        query = query or {}
        count = 0
        for item in self._data:
            match = True
            for k, v in query.items():
                if item.get(k) != v:
                    match = False
                    break
            if match:
                count += 1
        return count


class FallbackDatabase:
    def __init__(self, storage_dir: str):
        self.storage_dir = os.path.join(storage_dir, "db_fallback")
        os.makedirs(self.storage_dir, exist_ok=True)
        self.collections = {}

    def get_collection(self, name: str):
        if name not in self.collections:
            filepath = os.path.join(self.storage_dir, f"{name}.json")
            self.collections[name] = FallbackCollection(name, filepath)
        return self.collections[name]


# Motor client initialization
mongo_client: Optional[AsyncIOMotorClient] = None
db = None
use_fallback = False

async def init_db():
    global mongo_client, db, use_fallback
    try:
        if "mongodb+srv://" in settings.MONGODB_URL or "ssl=true" in settings.MONGODB_URL.lower():
            mongo_client = AsyncIOMotorClient(
                settings.MONGODB_URL,
                serverSelectionTimeoutMS=5000,
                tlsAllowInvalidCertificates=True
            )
        else:
            mongo_client = AsyncIOMotorClient(settings.MONGODB_URL, serverSelectionTimeoutMS=3000)
        # Check connection
        await mongo_client.admin.command('ping')
        db = mongo_client[settings.DATABASE_NAME]
        use_fallback = False
        logger.info(f"Connected to MongoDB Cloud database '{settings.DATABASE_NAME}' successfully.")
    except Exception as e:
        logger.warning(f"MongoDB connection failed ({e}). Switching to resilient local fallback database.")
        use_fallback = True
        db = FallbackDatabase(settings.LOCAL_STORAGE_DIR)

def get_collection(collection_name: str):
    if use_fallback:
        return db.get_collection(collection_name)
    else:
        return db[collection_name]
