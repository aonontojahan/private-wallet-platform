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
   # Create virtual environment
   python -m venv .venv

   # Install dependencies (no activation needed)
   .venv/Scripts/python.exe -m pip install -r requirements.txt
   ```
   
   **Note:** On Windows with Git Bash, you do NOT need to activate the virtual environment. Use the Python executable directly from `.venv/Scripts/python.exe`.

4. Configure environment variables in `.env` (optional — defaults are provided):
   ```env
   DATABASE_URL=postgresql://postgres:shakibalarman@localhost:5432/private_wallet
   SECRET_KEY=super-secret-key-change-in-production
   ACCESS_TOKEN_EXPIRE_MINUTES=60
   ```

## Running the Backend

Start the FastAPI server:

```bash
# Using direct Python executable (recommended - no activation needed)
.venv/Scripts/python.exe -m uvicorn backend.main:app --reload --port 8001

# Or if you prefer to activate the venv first (optional)
source .venv/Scripts/activate
python -m uvicorn backend.main:app --reload --port 8001
```

The API will be available at `http://127.0.0.1:8001`.
- **API Documentation:** http://127.0.0.1:8001/docs
- **Alternative Documentation:** http://127.0.0.1:8001/redoc

On first startup, the database tables are auto-created and a default admin user is seeded:
- **Email:** `admin@wallet.com`
- **Password:** `admin123`

User Login in info
- **Email:** `aonontojahan@gmail.com`
- **Password:** `aonontojahan`

## Running the Frontend

The frontend is static HTML/JS. Choose one of the following methods:

### Option 1: Open Directly in Browser
Simply open `frontend/index.html` in your browser (file:// protocol).

### Option 2: Serve with Python HTTP Server
```bash
# Using Python's built-in HTTP server
.venv/Scripts/python.exe -m http.server 3000 --directory frontend
```

Then navigate to `http://localhost:3000`.

### Option 3: Use any static file server
You can use VS Code Live Server, Node's `http-server`, or any other static file server to serve the `frontend` folder.


