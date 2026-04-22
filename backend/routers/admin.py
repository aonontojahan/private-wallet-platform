from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.auth import require_admin, get_password_hash
from backend.models import User, Wallet
from backend.schemas import AdminCreateUser, UserRead, UserDetailRead, MessageResponse

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.post("/users", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: AdminCreateUser,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    user = User(
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=get_password_hash(payload.password),
        is_admin=payload.is_admin,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    wallet = Wallet(user_id=user.id)
    db.add(wallet)
    db.commit()

    return user


@router.get("/users", response_model=list[UserRead])
def list_users(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    return db.query(User).all()


@router.get("/users/{user_id}", response_model=UserDetailRead)
def get_user_detail(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    result = UserDetailRead.model_validate(user)
    if user.wallet:
        result.trust_balance = user.wallet.trust_balance
        result.income_balance = user.wallet.income_balance
        result.deduct_from_income = user.wallet.deduct_from_income
    return result
