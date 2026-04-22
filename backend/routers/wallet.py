from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.auth import get_current_user
from backend.models import User
from backend.schemas import WalletRead, LedgerEntryRead, WalletToggleRequest, MessageResponse

router = APIRouter(prefix="/wallet", tags=["Wallet"])


@router.get("/balances", response_model=WalletRead)
def get_balances(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    wallet = current_user.wallet
    if not wallet:
        return {"id": 0, "user_id": current_user.id, "trust_balance": 0, "income_balance": 0, "deduct_from_income": True}
    return wallet


@router.get("/ledger", response_model=list[LedgerEntryRead])
def get_ledger(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entries = (
        db.query(LedgerEntry)
        .filter(LedgerEntry.user_id == current_user.id)
        .order_by(LedgerEntry.created_at.desc())
        .all()
    )
    return entries


@router.post("/toggle-deduct", response_model=MessageResponse)
def toggle_deduct_from_income(
    payload: WalletToggleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    wallet = current_user.wallet
    if not wallet:
        from backend.models import Wallet as WalletModel
        wallet = WalletModel(user_id=current_user.id, deduct_from_income=payload.deduct_from_income)
        db.add(wallet)
    else:
        wallet.deduct_from_income = payload.deduct_from_income
    db.commit()
    return {"message": "Setting updated"}
