import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:aonontojahan@localhost:5432/private_wallet"
)
SECRET_KEY = os.getenv(
    "SECRET_KEY",
    "private-wallet-platform-secret-key-change-in-production"
)
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
ALGORITHM = "HS256"
