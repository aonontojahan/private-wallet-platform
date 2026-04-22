from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from decimal import Decimal
from backend.database import get_db
from backend.auth import get_current_user, require_admin
from backend.models import User, Transaction
from backend.schemas import TransactionRead, TransactionCreate, MessageResponse
from backend.services import ledger_service

router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.post("/withdrawals", response_model=TransactionRead, status_code=status.HTTP_201_CREATED)
def request_withdrawal(
    payload: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.type != "withdrawal":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid transaction type for this endpoint",
        )

    amount = Decimal(payload.amount)
    if amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Amount must be greater than zero",
        )

    wallet = current_user.wallet
    if not wallet:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Wallet not found",
        )

    # Debit trust immediately
    ledger_service.debit_trust(
        db=db,
        user_id=current_user.id,
        amount=amount,
        description=f"Withdrawal request for {amount}",
        reference_type="withdrawal",
    )

    # Optionally debit income
    income_deduct = Decimal(0)
    if wallet.deduct_from_income:
        income_deduct = amount  # placeholder: deduct same amount from income
        try:
            ledger_service.debit_income(
                db=db,
                user_id=current_user.id,
                amount=income_deduct,
                description=f"Income deduction for withdrawal {amount}",
                reference_type="withdrawal",
            )
        except ValueError:
            income_deduct = Decimal(0)

    transaction = Transaction(
        user_id=current_user.id,
        type="withdrawal",
        amount=amount,
        commission_amount=Decimal(0),
        income_deduct_amount=income_deduct,
        status="pending",
        account_type=payload.account_type,
        account_number=payload.account_number,
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction


@router.get("/withdrawals", response_model=list[TransactionRead])
def list_my_withdrawals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Transaction)
        .filter(Transaction.user_id == current_user.id, Transaction.type == "withdrawal")
        .order_by(Transaction.created_at.desc())
        .all()
    )


@router.get("/deposits", response_model=list[TransactionRead])
def list_my_deposits(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Transaction)
        .filter(Transaction.user_id == current_user.id, Transaction.type == "deposit")
        .order_by(Transaction.created_at.desc())
        .all()
    )


@router.get("/all", response_model=list[TransactionRead])
def list_all_transactions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Transaction)
    if not current_user.is_admin:
        query = query.filter(Transaction.user_id == current_user.id)
    return query.order_by(Transaction.created_at.desc()).all()
