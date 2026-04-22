# Private Wallet Platform

Admin-controlled private wallet platform with secure login, dual-balance system, and transaction management (deposit, withdrawal, and ledger tracking).

## Tech Stack

- **Backend:** FastAPI, SQLAlchemy 2.0, PostgreSQL, bcrypt, PyJWT
- **Frontend:** Vanilla HTML, CSS, JavaScript
- **Auth:** JWT + HTTPBearer
- **Database:** Auto-created tables via SQLAlchemy `create_all`

## Prerequisites

- Python 3.10+
- PostgreSQL running locally

## Setup

1. Clone the repository and navigate to the project folder.

2. Create the PostgreSQL database:
   ```bash
   createdb -U postgres private_wallet
   ```

3. Create a virtual environment and install dependencies:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

4. Configure environment variables in `.env` (optional — defaults are provided):
   ```env
   DATABASE_URL=postgresql://postgres:aonontojahan@localhost:5432/private_wallet
   SECRET_KEY=super-secret-key-change-in-production
   ACCESS_TOKEN_EXPIRE_MINUTES=60
   ```

## Running the Backend

Start the FastAPI server:

```bash
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8001
```

The API will be available at `http://localhost:8001`.

On first startup, the database tables are auto-created and a default admin user is seeded:
- **Email:** `admin@wallet.com`
- **Password:** `admin123`

## Running the Frontend

The frontend is static HTML/JS. Simply open `frontend/index.html` in your browser, or serve it with any static file server:

```bash
# Using Python's built-in HTTP server (from the frontend folder)
cd frontend
python -m http.server 3000
```

Then navigate to `http://localhost:3000`.

## API Overview

| Prefix | Description |
|--------|-------------|
| `/api/auth` | Login, change password, get current user |
| `/api/admin` | Create users, deposits, approve/reject transactions, balance adjustments |
| `/api/wallet` | View balances, ledger history, toggle income deduction |
| `/api/transactions` | Withdrawal requests, list transactions |
| `/api/notifications` | List and mark notifications as read |

## Project Structure

```
private-wallet-platform/
├── backend/
│   ├── main.py
│   ├── config.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── auth.py
│   ├── routers/
│   │   ├── auth.py
│   │   ├── admin.py
│   │   ├── wallet.py
│   │   ├── transactions.py
│   │   └── notifications.py
│   └── services/
│       ├── ledger_service.py
│       └── notification_service.py
├── frontend/
│   ├── index.html
│   ├── dashboard.html
│   ├── transactions.html
│   ├── withdrawals.html
│   ├── accounts.html
│   ├── statistics.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── api.js
│       ├── auth.js
│       ├── app.js
│       ├── dashboard.js
│       ├── transactions.js
│       ├── withdrawals.js
│       ├── accounts.js
│       └── statistics.js
├── requirements.txt
├── .env
└── README.md
```
