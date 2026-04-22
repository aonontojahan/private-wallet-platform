from decimal import Decimal
from typing import Optional
from sqlalchemy.orm import Session
from backend.models import LedgerEntry, Wallet


def _get_or_create_wallet(db: Session, user_id: int) -> Wallet:
    wallet = db.query(Wallet).filter(Wallet.user_id == user_id).first()
    if not wallet:
        wallet = Wallet(user_id=user_id)
        db.add(wallet)
        db.flush()
    return wallet


def _create_ledger_entry(
    db: Session,
    user_id: int,
    wallet_type: str,
    entry_type: str,
    amount: Decimal,
    description: str,
    reference_type: Optional[str] = None,
    reference_id: Optional[int] = None,
) -> LedgerEntry:
    entry = LedgerEntry(
        user_id=user_id,
        wallet_type=wallet_type,
        entry_type=entry_type,
        amount=amount,
        description=description,
        reference_type=reference_type,
        reference_id=reference_id,
    )
    db.add(entry)
    return entry


def credit_trust(
    db: Session,
    user_id: int,
    amount: Decimal,
    description: str,
    reference_type: Optional[str] = None,
    reference_id: Optional[int] = None,
) -> LedgerEntry:
    wallet = _get_or_create_wallet(db, user_id)
    wallet.trust_balance = Decimal(wallet.trust_balance) + amount
    entry = _create_ledger_entry(
        db, user_id, "trust", "credit", amount, description, reference_type, reference_id
    )
    db.flush()
    return entry


def debit_trust(
    db: Session,
    user_id: int,
    amount: Decimal,
    description: str,
    reference_type: Optional[str] = None,
    reference_id: Optional[int] = None,
) -> LedgerEntry:
    wallet = _get_or_create_wallet(db, user_id)
    current = Decimal(wallet.trust_balance)
    if current < amount:
        raise ValueError("Insufficient trust balance")
    wallet.trust_balance = current - amount
    entry = _create_ledger_entry(
        db, user_id, "trust", "debit", amount, description, reference_type, reference_id
    )
    db.flush()
    return entry


def credit_income(
    db: Session,
    user_id: int,
    amount: Decimal,
    description: str,
    reference_type: Optional[str] = None,
    reference_id: Optional[int] = None,
) -> LedgerEntry:
    wallet = _get_or_create_wallet(db, user_id)
    wallet.income_balance = Decimal(wallet.income_balance) + amount
    entry = _create_ledger_entry(
        db, user_id, "income", "credit", amount, description, reference_type, reference_id
    )
    db.flush()
    return entry


def debit_income(
    db: Session,
    user_id: int,
    amount: Decimal,
    description: str,
    reference_type: Optional[str] = None,
    reference_id: Optional[int] = None,
) -> LedgerEntry:
    wallet = _get_or_create_wallet(db, user_id)
    current = Decimal(wallet.income_balance)
    if current < amount:
        raise ValueError("Insufficient income balance")
    wallet.income_balance = current - amount
    entry = _create_ledger_entry(
        db, user_id, "income", "debit", amount, description, reference_type, reference_id
    )
    db.flush()
    return entry
