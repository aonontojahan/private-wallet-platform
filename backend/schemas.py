from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, EmailStr, ConfigDict


# ----------------------------
# Auth Schemas
# ----------------------------
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


# ----------------------------
# User Schemas
# ----------------------------
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    is_admin: bool = False
    is_active: bool = True


class UserCreate(UserBase):
    password: str


class UserRead(UserBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime


class UserDetailRead(UserRead):
    trust_balance: Optional[Decimal] = None
    income_balance: Optional[Decimal] = None
    deduct_from_income: Optional[bool] = None


class AdminCreateUser(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    is_admin: bool = False


# ----------------------------
# Wallet Schemas
# ----------------------------
class WalletRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    trust_balance: Decimal
    income_balance: Decimal
    deduct_from_income: bool


class WalletToggleRequest(BaseModel):
    deduct_from_income: bool


# ----------------------------
# Ledger Schemas
# ----------------------------
class LedgerEntryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    wallet_type: str
    entry_type: str
    amount: Decimal
    description: Optional[str]
    reference_type: Optional[str]
    reference_id: Optional[int]
    created_at: datetime


# ----------------------------
# Transaction Schemas
# ----------------------------
class TransactionCreate(BaseModel):
    type: str
    amount: Decimal
    account_type: Optional[str] = None
    account_number: Optional[str] = None


class TransactionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
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
    updated_at: Optional[datetime]


class TransactionApprovalRequest(BaseModel):
    admin_note: Optional[str] = None


class BalanceAdjustmentRequest(BaseModel):
    user_id: int
    wallet_type: str  # 'trust' or 'income'
    amount: Decimal
    description: Optional[str] = "Admin adjustment"


# ----------------------------
# Notification Schemas
# ----------------------------
class NotificationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    title: str
    message: str
    is_read: bool
    created_at: datetime


# ----------------------------
# Generic Schemas
# ----------------------------
class MessageResponse(BaseModel):
    message: str


class DashboardStats(BaseModel):
    trust_balance: Decimal
    income_balance: Decimal
    deduct_from_income: bool
    total_deposits: Decimal
    total_withdrawals: Decimal
    pending_withdrawals: int
    recent_transactions: List[TransactionRead]
