# CarCare AI — React + Vite + FastAPI + SQLite

A beginner-friendly starter project for vehicle profiles, maintenance tracking, service history, reminders, and a rule-based diagnostic assistant. The diagnostic endpoint is an educational helper, **not a substitute for a qualified mechanic**.

## Requirements
- Windows 10/11
- Node.js 20+ and npm
- Python 3.10+

## 1. Start the backend (Windows)
Open PowerShell in the `carcare-ai-updated` folder:

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
uvicorn app.main:app --reload
```

If PowerShell blocks activation, run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` in that same terminal, then activate again. API docs: http://127.0.0.1:8000/docs

## 2. Start the frontend
Open a **second** PowerShell terminal in the project folder:

```powershell
cd frontend
npm install
npm run dev
```

Open the local URL Vite prints (usually http://localhost:5173).

## Features
- Animated dark landing/dashboard UI with responsive layout
- Vehicle profile creation and listing
- Maintenance items and service history
- Maintenance reminders based on due dates
- Rule-based diagnostic assistant
- FastAPI REST endpoints backed by SQLite

## API endpoints
- `GET /api/health`
- `GET /api/vehicles`, `POST /api/vehicles`, `GET /api/vehicles/{id}`, `PUT /api/vehicles/{id}`, `DELETE /api/vehicles/{id}`
- `GET /api/services`, `POST /api/services`, `DELETE /api/services/{id}`
- `GET /api/reminders`
- `POST /api/diagnose` with `{ "symptom": "engine cranks but won't start" }`

SQLite database file `carcare.db` is created automatically in the backend folder on first run. CORS is open for local development; restrict it before deployment. This starter does not connect to a real vehicle's onboard diagnostics (OBD-II) hardware or an external AI model.
