from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.auth import require_admin, get_password_hash
from backend.models import User, Wallet, Transaction
from backend.schemas import (
    AdminCreateUser,
    UserRead,
    UserDetailRead,
    MessageResponse,
    TransactionRead,
    TransactionApprovalRequest,
    BalanceAdjustmentRequest,
)
from backend.services import ledger_service
from decimal import Decimal

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


@router.post("/deposits", response_model=TransactionRead, status_code=201)
def admin_create_deposit(
    user_id: int,
    amount: Decimal,
    account_type: Optional[str] = None,
    account_number: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    ledger_service.credit_trust(
        db=db,
        user_id=user_id,
        amount=amount,
        description=f"Admin deposit of {amount}",
        reference_type="deposit",
    )

    transaction = Transaction(
        user_id=user_id,
        type="deposit",
        amount=amount,
        commission_amount=Decimal(0),
        income_deduct_amount=Decimal(0),
        status="approved",
        account_type=account_type,
        account_number=account_number,
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction


@router.post("/transactions/{transaction_id}/approve", response_model=TransactionRead)
def approve_transaction(
    transaction_id: int,
    payload: TransactionApprovalRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    txn = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if txn.status != "pending":
        raise HTTPException(status_code=400, detail="Transaction is not pending")

    txn.status = "approved"
    if payload.admin_note:
        txn.admin_note = payload.admin_note
    db.commit()
    db.refresh(txn)
    return txn


@router.post("/transactions/{transaction_id}/reject", response_model=TransactionRead)
def reject_transaction(
    transaction_id: int,
    payload: TransactionApprovalRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    txn = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if txn.status != "pending":
        raise HTTPException(status_code=400, detail="Transaction is not pending")

    # Reverse trust debit for withdrawals
    if txn.type == "withdrawal":
        ledger_service.credit_trust(
            db=db,
            user_id=txn.user_id,
            amount=txn.amount,
            description=f"Reversal of withdrawal #{txn.id}",
            reference_type="withdrawal",
            reference_id=txn.id,
        )
        # Reverse income deduction if applicable
        if txn.income_deduct_amount and txn.income_deduct_amount > 0:
            ledger_service.credit_income(
                db=db,
                user_id=txn.user_id,
                amount=txn.income_deduct_amount,
                description=f"Reversal of income deduction for withdrawal #{txn.id}",
                reference_type="withdrawal",
                reference_id=txn.id,
            )

    txn.status = "rejected"
    if payload.admin_note:
        txn.admin_note = payload.admin_note
    db.commit()
    db.refresh(txn)
    return txn


@router.post("/adjust-balance", response_model=MessageResponse)
def adjust_balance(
    payload: BalanceAdjustmentRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    if payload.wallet_type not in ("trust", "income"):
        raise HTTPException(status_code=400, detail="wallet_type must be 'trust' or 'income'")

    if payload.wallet_type == "trust":
        if payload.amount >= 0:
            ledger_service.credit_trust(
                db=db,
                user_id=payload.user_id,
                amount=payload.amount,
                description=payload.description,
                reference_type="admin_adjustment",
            )
        else:
            ledger_service.debit_trust(
                db=db,
                user_id=payload.user_id,
                amount=abs(payload.amount),
                description=payload.description,
                reference_type="admin_adjustment",
            )
    else:
        if payload.amount >= 0:
            ledger_service.credit_income(
                db=db,
                user_id=payload.user_id,
                amount=payload.amount,
                description=payload.description,
                reference_type="admin_adjustment",
            )
        else:
            ledger_service.debit_income(
                db=db,
                user_id=payload.user_id,
                amount=abs(payload.amount),
                description=payload.description,
                reference_type="admin_adjustment",
            )

    db.commit()
    return {"message": "Balance adjusted successfully"}
