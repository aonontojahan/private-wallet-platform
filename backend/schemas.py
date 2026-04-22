from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from decimal import Decimal
from typing import Optional, List


class UserBase(BaseModel):
    email: EmailStr
    full_name: str


class UserCreate(UserBase):
    password: str = Field(..., min_length=4)
    is_admin: bool = False


class UserOut(UserBase):
    id: int
    is_admin: bool
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserDetail(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    is_admin: bool
    is_active: bool
    created_at: datetime
    trust_balance: Decimal
    income_balance: Decimal


class WalletOut(BaseModel):
    trust_balance: Decimal
    income_balance: Decimal
    deduct_from_income: bool

    class Config:
        from_attributes = True


class WalletToggle(BaseModel):
    deduct_from_income: bool


class LedgerEntryOut(BaseModel):
    id: int
    wallet_type: str
    entry_type: str
    amount: Decimal
    description: Optional[str]
    reference_type: Optional[str]
    reference_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


class TransactionCreate(BaseModel):
    type: str
    amount: Decimal = Field(..., gt=0)
    account_type: Optional[str] = None
    account_number: Optional[str] = None


class TransactionOut(BaseModel):
    id: int
    user_id: int
    type: str
    amount: Decimal
    commission_amount: Decimal
    income_deduct_amount: Decimal
    status: str
    account_type: Optional[str]
    account_number: Optional[str]
    admin_note: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DepositCreate(BaseModel):
    user_id: int
    amount: Decimal = Field(..., gt=0)
    account_type: Optional[str] = "bank"
    account_number: Optional[str] = None
    commission_amount: Optional[Decimal] = Decimal("0")
    income_deduct_amount: Optional[Decimal] = Decimal("0")


class WithdrawalRequest(BaseModel):
    amount: Decimal = Field(..., gt=0)
    account_type: str
    account_number: str


class BalanceAdjust(BaseModel):
    user_id: int
    wallet_type: str
    amount: Decimal = Field(..., gt=0)
    description: str


class TransactionAction(BaseModel):
    admin_note: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=4)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class NotificationOut(BaseModel):
    id: int
    title: str
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True
