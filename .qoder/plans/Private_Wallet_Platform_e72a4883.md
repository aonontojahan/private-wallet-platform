# Private Wallet Platform — Development Plan

## Tech Stack
- **Backend:** FastAPI, SQLAlchemy 2.0, PostgreSQL, bcrypt, PyJWT
- **Frontend:** Vanilla HTML, CSS, JavaScript
- **Auth:** JWT + HTTPBearer
- **Database:** Auto-created tables via SQLAlchemy `create_all`

---

## Project Structure

```
private-wallet-platform/
├── backend/
│   ├── main.py                 # FastAPI app entry point, mounts routers
│   ├── database.py             # SQLAlchemy engine, session, Base
│   ├── models.py               # All ORM models
│   ├── schemas.py              # Pydantic request/response models
│   ├── auth.py                 # JWT creation/validation, password hashing, get_current_user
│   ├── config.py               # Settings (SECRET_KEY, DATABASE_URL, etc.)
│   ├── services/
│   │   ├── ledger_service.py   # ALL balance changes go through here
│   │   └── notification_service.py
│   └── routers/
│       ├── auth.py             # Login, change password
│       ├── admin.py            # Create user, view users, adjust balances
│       ├── wallet.py           # Get balances
│       ├── transactions.py     # Deposit request, withdrawal request, list transactions
│       └── notifications.py    # List/mark-read notifications
├── frontend/
│   ├── index.html              # Login page
│   ├── dashboard.html          # Main dashboard with balances & stats
│   ├── transactions.html       # Transactions list with filters
│   ├── withdrawals.html        # Withdrawal requests + history
│   ├── accounts.html           # User accounts (admin) / profile (user)
│   ├── statistics.html         # Statistics & reports
│   ├── css/
│   │   └── style.css           # Dark theme, sidebar, cards, tables
│   └── js/
│       ├── api.js              # API base URL, fetch wrapper, token handling
│       ├── auth.js             # Login, logout, token storage
│       ├── dashboard.js        # Dashboard page logic
│       ├── transactions.js     # Transactions page logic
│       ├── withdrawals.js      # Withdrawals page logic
│       ├── accounts.js         # Accounts page logic
│       ├── statistics.js       # Statistics page logic
│       └── app.js              # Sidebar, auth guards, shared UI helpers
└── requirements.txt
```

---

## Database Schema

### 1. User
| Column | Type | Notes |
|--------|------|-------|
| id | Integer PK | Auto-increment |
| email | String(255) | Unique, indexed |
| full_name | String(255) | |
| hashed_password | String(255) | bcrypt |
| is_admin | Boolean | Default False |
| is_active | Boolean | Default True |
| created_at | DateTime | Default now |

### 2. Wallet (one per user, auto-created)
| Column | Type | Notes |
|--------|------|-------|
| id | Integer PK | |
| user_id | Integer FK | Unique |
| trust_balance | Numeric(18,4) | Default 0 |
| income_balance | Numeric(18,4) | Default 0 |
| deduct_from_income | Boolean | Default True (toggle) |

### 3. LedgerEntry (MANDATORY — every balance change)
| Column | Type | Notes |
|--------|------|-------|
| id | Integer PK | |
| user_id | Integer FK | |
| wallet_type | String(20) | 'trust' or 'income' |
| entry_type | String(20) | 'debit' or 'credit' |
| amount | Numeric(18,4) | Always positive |
| description | String(500) | |
| reference_type | String(50) | 'deposit', 'withdrawal', 'commission', 'deduction', 'admin_adjustment' |
| reference_id | Integer | Optional FK to transaction |
| created_at | DateTime | Default now |

### 4. Transaction
| Column | Type | Notes |
|--------|------|-------|
| id | Integer PK | |
| user_id | Integer FK | |
| type | String(20) | 'deposit' or 'withdrawal' |
| amount | Numeric(18,4) | |
| commission_amount | Numeric(18,4) | Default 0 |
| income_deduct_amount | Numeric(18,4) | Default 0 |
| status | String(20) | 'pending', 'approved', 'rejected' |
| account_type | String(50) | 'bkash', 'nagad', etc. |
| account_number | String(50) | |
| admin_note | String(500) | |
| created_at | DateTime | Default now |
| updated_at | DateTime | |

### 5. Notification
| Column | Type | Notes |
|--------|------|-------|
| id | Integer PK | |
| user_id | Integer FK | |
| title | String(255) | |
| message | String(1000) | |
| is_read | Boolean | Default False |
| created_at | DateTime | Default now |

---

## API Endpoints

### Auth (`/api/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /login | JWT token login |
| POST | /change-password | User changes own password |

### Admin (`/api/admin`) — Admin only
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /users | Create new user (sets temp password) |
| GET | /users | List all users |
| GET | /users/{id} | User detail with balances |
| POST | /deposits | Admin initiates deposit for user |
| POST | /transactions/{id}/approve | Approve withdrawal/deposit |
| POST | /transactions/{id}/reject | Reject withdrawal/deposit |
| POST | /adjust-balance | Adjust trust/income balance via ledger |

### Wallet (`/api/wallet`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /balances | Get trust + income balance |
| GET | /ledger | Get user's ledger history |

### Transactions (`/api/transactions`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /withdrawals | Request withdrawal |
| GET | /withdrawals | List my withdrawals |
| GET | /deposits | List my deposits |
| GET | /all | List all transactions (admin: all, user: own) |

### Notifications (`/api/notifications`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | / | List my notifications |
| POST | /{id}/read | Mark as read |

---

## Development Phases

### Phase 1: Backend Foundation
**Task 1.1:** Create `requirements.txt` with all dependencies (fastapi, uvicorn, sqlalchemy, psycopg2-binary, pydantic, pyjwt, bcrypt, python-multipart).

**Task 1.2:** Create `backend/config.py` — load settings from environment or defaults. Include SECRET_KEY, DATABASE_URL, ACCESS_TOKEN_EXPIRE_MINUTES.
  - Default DATABASE_URL: `postgresql://postgres:aonontojahan@localhost:5432/private_wallet`

**Task 1.3:** Create `backend/database.py` — SQLAlchemy engine, SessionLocal, declarative Base. Use PostgreSQL.

**Task 1.4:** Create `backend/models.py` — define all 5 ORM models with relationships. Add a helper to auto-create admin user on first run.

**Task 1.5:** Create `backend/schemas.py` — Pydantic models for all requests/responses.

**Task 1.6:** Create `backend/auth.py` — password hashing with bcrypt, JWT creation/validation, `get_current_user` dependency, `require_admin` dependency.

**Task 1.7:** Create `backend/routers/auth.py` — `/login` returns JWT, `/change-password`.

**Task 1.8:** Create `backend/routers/admin.py` — admin create user endpoint. Auto-create Wallet for new user.

**Task 1.9:** Update `backend/main.py` — create app, include auth and admin routers, add CORS, add startup event to create tables + seed admin.

### Phase 2: Wallet + Ledger System
**Task 2.1:** Create `backend/services/ledger_service.py` — the ONLY place balance changes happen.
- `credit_trust(user_id, amount, description, reference)`
- `debit_trust(user_id, amount, description, reference)`
- `credit_income(user_id, amount, description, reference)`
- `debit_income(user_id, amount, description, reference)`
- Each function creates a LedgerEntry AND updates the Wallet cached balance in the same DB transaction.
- Returns the ledger entry.

**Task 2.2:** Create `backend/routers/wallet.py` — GET `/balances` returns trust and income. GET `/ledger` returns user's ledger.

**Task 2.3:** Test ledger logic — ensure balances update correctly and ledger entries are created.

### Phase 3: Transaction System
**Task 3.1:** Create `backend/routers/transactions.py`:
- POST `/withdrawals` — user requests withdrawal. Deduct from trust balance immediately via ledger (debit_trust), create Transaction with status `pending`. If `deduct_from_income` toggle is on, also deduct from income.
- POST `/deposits` — admin only, directly credits trust and creates Transaction as `approved`.
- GET endpoints for listing.

**Task 3.2:** Update `backend/routers/admin.py`:
- Approve withdrawal: update transaction status, if rejection was pending do nothing extra.
- Reject withdrawal: credit trust balance back via ledger (reverse the debit).
- Approve deposit: already handled, but ensure commission and deduction logic works.

**Task 3.3:** Commission & Deduction Logic:
- On deposit: commission_amount credited to income_balance via ledger.
- On deposit: if `deduct_from_income` is True, calculate deduction and debit from income.
- On withdrawal: no commission, but if `deduct_from_income` is True, deduct fee from income.

### Phase 4: Notification System
**Task 4.1:** Create `backend/services/notification_service.py` — helper to create notifications.

**Task 4.2:** Integrate notifications into:
- Deposit processed
- Withdrawal approved/rejected
- Password changed
- Admin balance adjustment

**Task 4.3:** Create `backend/routers/notifications.py` — list and mark-read endpoints.

### Phase 5: Frontend Setup (HTML/CSS/JS)
**Task 5.1:** Create `frontend/css/style.css` — dark theme matching the screenshots.
- CSS variables for colors (dark bg: #0f172a, card bg: #1e293b, accent: #3b82f6, success: #22c55e, danger: #ef4444).
- Sidebar styles.
- Card/balance card styles.
- Table styles with hover.
- Form/input styles.
- Status badges (pending: yellow, approved: green, rejected: red).
- Responsive grid.

**Task 5.2:** Create `frontend/js/api.js` — base API URL (`http://localhost:8000/api`), fetch wrapper with Authorization header, 401 redirect to login.

**Task 5.3:** Create `frontend/js/auth.js` — handle login form, store token in localStorage, logout, check auth.

**Task 5.4:** Create `frontend/index.html` — login page matching the dark split-screen design.

**Task 5.5:** Create `frontend/js/app.js` — sidebar toggle, active nav highlighting, notification bell dropdown, load user info, auth guard for all pages.

**Task 5.6:** Create page shell template (`dashboard.html` first) with sidebar, topbar, main content area.

### Phase 6: Dashboard Page
**Task 6.1:** Create `frontend/dashboard.html` + `frontend/js/dashboard.js`.
- Trust balance card (large number, status indicator).
- Income balance card (with "Deduct from income" toggle).
- Quick action buttons: Deposit, Withdraw.
- Statistics summary section (deposits, withdrawals, etc.).
- Recent transactions table (last 5).

### Phase 7: Transactions Page
**Task 7.1:** Create `frontend/transactions.html` + `frontend/js/transactions.js`.
- Tabs: All / USDT Sell (or Deposit / Withdrawal).
- Filter: Date range, Transaction type, Account type, Status.
- Table: Transaction ID, Account Type, Transaction Type, Account Number, Amount, Commission, Income Deduct, Status.
- Download CSV button.

### Phase 8: Withdrawals Page
**Task 8.1:** Create `frontend/withdrawals.html` + `frontend/js/withdrawals.js`.
- Balance cards at top (Trust + Income).
- Withdraw button opens modal/form.
- Withdrawals history table with filters.
- Status badges.

### Phase 9: Accounts Page
**Task 9.1:** Create `frontend/accounts.html` + `frontend/js/accounts.js`.
- Admin: list all users, create user modal, view user balances.
- User: view own profile, change password form.

### Phase 10: Statistics Page
**Task 10.1:** Create `frontend/statistics.html` + `frontend/js/statistics.js`.
- Date range picker.
- Summary cards: Deposit amount, Withdrawal amount, etc.
- Transactions by accounts table.
- Download button.

### Phase 11: Integration & Polish
**Task 11.1:** Wire all API calls in frontend JS files.
**Task 11.2:** Handle loading states and error messages.
**Task 11.3:** Ensure admin-only UI elements are hidden for regular users.
**Task 11.4:** Test full flows: admin create user -> login -> deposit -> withdraw -> approve -> check balances -> check ledger.
**Task 11.5:** Create `requirements.txt` and run instructions.

---

## Key Business Rules

1. **No Public Signup:** Only admin can create users via POST `/api/admin/users`.
2. **Ledger Mandatory:** `ledger_service.py` is the ONLY module that modifies wallet balances. All other code calls these functions.
3. **Withdrawal Flow:** User requests -> trust balance debited immediately -> transaction created as pending -> admin approves (status changes) or rejects (trust credited back).
4. **Deposit Flow:** Admin creates deposit -> trust credited immediately -> transaction created as approved.
5. **Commission:** On deposit, a configurable commission % goes to income balance.
6. **Income Deduction:** If user's `deduct_from_income` toggle is ON, certain fees are deducted from income balance.
7. **Notifications:** Created automatically on key events. Users see unread count in topbar.

---

## Running the Project

1. Install PostgreSQL and create database `private_wallet`.
2. Create `.env` or set env vars: `DATABASE_URL=postgresql://postgres:aonontojahan@localhost:5432/private_wallet`, `SECRET_KEY=your-secret`.
   (If your PostgreSQL username is different from `postgres`, update the URL accordingly. Password is: `aonontojahan`)
3. `pip install -r requirements.txt`
4. `cd backend && uvicorn main:app --reload`
5. Open `frontend/index.html` in browser (or serve via Live Server).
6. Default admin is auto-created (email: `admin@platform.com`, password: `admin123`).

---

## Files to Create (Summary)

Backend: `main.py`, `database.py`, `models.py`, `schemas.py`, `auth.py`, `config.py`, `services/ledger_service.py`, `services/notification_service.py`, `routers/auth.py`, `routers/admin.py`, `routers/wallet.py`, `routers/transactions.py`, `routers/notifications.py`

Frontend: `index.html`, `dashboard.html`, `transactions.html`, `withdrawals.html`, `accounts.html`, `statistics.html`, `css/style.css`, `js/api.js`, `js/auth.js`, `js/app.js`, `js/dashboard.js`, `js/transactions.js`, `js/withdrawals.js`, `js/accounts.js`, `js/statistics.js`

Root: `requirements.txt`
