from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database import engine, SessionLocal
from backend.models import Base, User, Wallet
from backend.auth import get_password_hash
from backend.routers import auth, admin, wallet, transactions, notifications, support


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        admin_user = db.query(User).filter(User.email == "admin@wallet.com").first()
        if not admin_user:
            user = User(
                email="admin@wallet.com",
                full_name="System Administrator",
                hashed_password=get_password_hash("admin123"),
                is_admin=True,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            wallet = Wallet(user_id=user.id)
            db.add(wallet)
            db.commit()
    finally:
        db.close()
    yield


app = FastAPI(title="Private Wallet Platform", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(wallet.router, prefix="/api")
app.include_router(transactions.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(support.router, prefix="/api")


@app.get("/")
def root():
    return {"message": "Private Wallet Platform API"}
