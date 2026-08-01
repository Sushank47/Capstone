import os
import logging
from typing import Tuple
from azure.storage.blob import BlobServiceClient
from app.config import settings

logger = logging.getLogger("mediexplain.blob")

class BlobStorageService:
    def __init__(self):
        self.connection_string = settings.AZURE_STORAGE_CONNECTION_STRING
        self.container_name = settings.AZURE_STORAGE_CONTAINER_NAME
        self.blob_service_client = None
        
        if self.connection_string:
            try:
                self.blob_service_client = BlobServiceClient.from_connection_string(self.connection_string)
                # Ensure container exists
                container_client = self.blob_service_client.get_container_client(self.container_name)
                if not container_client.exists():
                    container_client.create_container()
                logger.info("Azure Blob Storage initialized successfully.")
            except Exception as e:
                logger.warning(f"Failed to initialize Azure Blob Storage ({e}). Using local file storage fallback.")
                self.blob_service_client = None

    async def upload_file(self, user_id: str, file_bytes: bytes, file_name: str, content_type: str) -> Tuple[str, str]:
        """
        Uploads file bytes and returns (blob_path, public_or_local_url)
        """
        blob_path = f"users/{user_id}/{file_name}"

        if self.blob_service_client:
            try:
                blob_client = self.blob_service_client.get_blob_client(
                    container=self.container_name, blob=blob_path
                )
                blob_client.upload_blob(file_bytes, overwrite=True, content_type=content_type)
                url = blob_client.url
                return blob_path, url
            except Exception as e:
                logger.error(f"Azure Blob upload error: {e}. Falling back to local storage.")

        # Local storage fallback
        user_dir = os.path.join(settings.LOCAL_STORAGE_DIR, "blobs", user_id)
        os.makedirs(user_dir, exist_ok=True)
        local_file_path = os.path.join(user_dir, file_name)
        with open(local_file_path, "wb") as f:
            f.write(file_bytes)
        
        local_url = f"/api/documents/file-stream/{user_id}/{file_name}"
        return blob_path, local_url

    async def get_file_bytes(self, user_id: str, file_name: str) -> bytes:
        blob_path = f"users/{user_id}/{file_name}"
        if self.blob_service_client:
            try:
                blob_client = self.blob_service_client.get_blob_client(
                    container=self.container_name, blob=blob_path
                )
                return blob_client.download_blob().readall()
            except Exception as e:
                logger.warning(f"Failed download from Azure Blob ({e}). Attempting local read.")

        local_file_path = os.path.join(settings.LOCAL_STORAGE_DIR, "blobs", user_id, file_name)
        if os.path.exists(local_file_path):
            with open(local_file_path, "rb") as f:
                return f.read()
        raise FileNotFoundError(f"File {file_name} not found for user {user_id}")

    async def delete_file(self, user_id: str, file_name: str) -> bool:
        blob_path = f"users/{user_id}/{file_name}"
        if self.blob_service_client:
            try:
                blob_client = self.blob_service_client.get_blob_client(
                    container=self.container_name, blob=blob_path
                )
                blob_client.delete_blob()
            except Exception as e:
                logger.warning(f"Azure Blob delete error: {e}")

        local_file_path = os.path.join(settings.LOCAL_STORAGE_DIR, "blobs", user_id, file_name)
        if os.path.exists(local_file_path):
            os.remove(local_file_path)
            return True
        return True

blob_service = BlobStorageService()
