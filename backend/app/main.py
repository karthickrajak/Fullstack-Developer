from contextlib import asynccontextmanager
from datetime import date, datetime, timedelta
from pathlib import Path
import sqlite3
from typing import Optional

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

DB_PATH = Path(__file__).resolve().parents[1] / "carcare.db"


def connect():
    db = sqlite3.connect(DB_PATH)
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA foreign_keys = ON")
    return db


def init_db():
    with connect() as db:
        db.executescript("""
        CREATE TABLE IF NOT EXISTS vehicles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          year INTEGER NOT NULL,
          plate TEXT DEFAULT '',
          mileage REAL DEFAULT 0,
          fuel TEXT DEFAULT 'Unknown',
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS services (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          vehicle_id INTEGER,
          title TEXT NOT NULL,
          service_date TEXT NOT NULL,
          due_date TEXT,
          mileage REAL,
          notes TEXT DEFAULT '',
          status TEXT NOT NULL DEFAULT 'Logged',
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
        );
        """)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(title="CarCare AI API", version="1.0.0", description="Vehicle and maintenance tracking API", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

class VehicleIn(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    year: int = Field(ge=1950, le=2100)
    plate: str = Field(default="", max_length=30)
    mileage: float = Field(default=0, ge=0)
    fuel: str = Field(default="Unknown", max_length=30)

class ServiceIn(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    service_date: date = Field(default_factory=date.today)
    vehicle_id: Optional[int] = None
    due_date: Optional[date] = None
    mileage: Optional[float] = Field(default=None, ge=0)
    notes: str = Field(default="", max_length=1000)
    status: str = Field(default="Logged", max_length=30)

class DiagnosisIn(BaseModel):
    symptom: str = Field(min_length=3, max_length=1000)


def row_dict(row):
    return dict(row) if row else None

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "CarCare AI API", "database": "sqlite"}

@app.get("/api/vehicles")
def list_vehicles():
    with connect() as db:
        return [dict(r) for r in db.execute("SELECT * FROM vehicles ORDER BY id DESC")]

@app.post("/api/vehicles", status_code=status.HTTP_201_CREATED)
def create_vehicle(vehicle: VehicleIn):
    with connect() as db:
        cur = db.execute("INSERT INTO vehicles(name,year,plate,mileage,fuel) VALUES(?,?,?,?,?)", (vehicle.name, vehicle.year, vehicle.plate, vehicle.mileage, vehicle.fuel))
        return dict(db.execute("SELECT * FROM vehicles WHERE id=?", (cur.lastrowid,)).fetchone())

@app.get("/api/vehicles/{vehicle_id}")
def get_vehicle(vehicle_id: int):
    with connect() as db:
        row = db.execute("SELECT * FROM vehicles WHERE id=?", (vehicle_id,)).fetchone()
        if not row: raise HTTPException(404, "Vehicle not found")
        return dict(row)

@app.put("/api/vehicles/{vehicle_id}")
def update_vehicle(vehicle_id: int, vehicle: VehicleIn):
    with connect() as db:
        cur = db.execute("UPDATE vehicles SET name=?,year=?,plate=?,mileage=?,fuel=? WHERE id=?", (vehicle.name, vehicle.year, vehicle.plate, vehicle.mileage, vehicle.fuel, vehicle_id))
        if not cur.rowcount: raise HTTPException(404, "Vehicle not found")
        return dict(db.execute("SELECT * FROM vehicles WHERE id=?", (vehicle_id,)).fetchone())

@app.delete("/api/vehicles/{vehicle_id}")
def delete_vehicle(vehicle_id: int):
    with connect() as db:
        cur = db.execute("DELETE FROM vehicles WHERE id=?", (vehicle_id,))
        if not cur.rowcount: raise HTTPException(404, "Vehicle not found")
        return {"deleted": True, "id": vehicle_id}

@app.get("/api/services")
def list_services():
    with connect() as db:
        return [dict(r) for r in db.execute("SELECT * FROM services ORDER BY service_date DESC, id DESC")]

@app.post("/api/services", status_code=status.HTTP_201_CREATED)
def create_service(service: ServiceIn):
    with connect() as db:
        if service.vehicle_id is not None and not db.execute("SELECT id FROM vehicles WHERE id=?", (service.vehicle_id,)).fetchone():
            raise HTTPException(404, "Vehicle not found")
        cur = db.execute("INSERT INTO services(vehicle_id,title,service_date,due_date,mileage,notes,status) VALUES(?,?,?,?,?,?,?)", (service.vehicle_id, service.title, service.service_date.isoformat(), service.due_date.isoformat() if service.due_date else None, service.mileage, service.notes, service.status))
        return dict(db.execute("SELECT * FROM services WHERE id=?", (cur.lastrowid,)).fetchone())

@app.delete("/api/services/{service_id}")
def delete_service(service_id: int):
    with connect() as db:
        cur = db.execute("DELETE FROM services WHERE id=?", (service_id,))
        if not cur.rowcount: raise HTTPException(404, "Service record not found")
        return {"deleted": True, "id": service_id}

@app.get("/api/reminders")
def reminders():
    today = date.today().isoformat()
    soon = (date.today() + timedelta(days=30)).isoformat()
    with connect() as db:
        rows = db.execute("SELECT s.*, v.name AS vehicle_name FROM services s LEFT JOIN vehicles v ON v.id=s.vehicle_id WHERE s.due_date IS NOT NULL AND s.due_date<=? ORDER BY s.due_date", (soon,)).fetchall()
        return [{**dict(r), "overdue": r["due_date"] < today} for r in rows]

@app.post("/api/diagnose")
def diagnose(request: DiagnosisIn):
    symptom = request.symptom.lower()
    if any(k in symptom for k in ("start", "crank", "ignition", "battery")):
        summary = "Starting issue: common causes include a weak battery, loose battery terminals, starter motor, or fuel delivery problem."
        advice = "Check for loose/corroded terminals only when safe; a mechanic can test the battery and charging system."
        urgency = "moderate"
    elif any(k in symptom for k in ("brake", "stopping", "pedal")):
        summary = "Brake concern: worn pads, low brake fluid, or a brake-system fault may be involved."
        advice = "If braking is weak, the pedal feels unusual, or a warning light is on, stop driving and arrange professional inspection."
        urgency = "high"
    elif any(k in symptom for k in ("overheat", "hot engine", "temperature", "coolant")):
        summary = "Possible overheating: coolant loss, cooling fan, thermostat, or radiator problems are possible."
        advice = "Pull over safely and switch off the engine. Never open a hot radiator cap; get assistance once the engine cools."
        urgency = "high"
    elif any(k in symptom for k in ("oil leak", "leaking oil", "oil pressure")):
        summary = "Possible oil leak or oil-pressure concern. The source and severity need inspection."
        advice = "If the oil-pressure warning is on or oil is leaking heavily, switch off the engine and do not continue driving."
        urgency = "high"
    elif any(k in symptom for k in ("noise", "sound", "vibration", "shaking")):
        summary = "Unusual noise or vibration can come from tyres, brakes, mounts, suspension, or engine components."
        advice = "Note when it occurs and where it seems to come from. Stop if the vehicle feels unsafe and arrange an inspection."
        urgency = "moderate"
    else:
        summary = "More details are needed to narrow down this symptom; several causes may produce similar signs."
        advice = "Record when it happens, dashboard warning lights, unusual sounds or smells, and whether the car still drives safely."
        urgency = "unknown"
    return {"summary": summary, "advice": advice, "urgency": urgency, "disclaimer": "This is general rule-based guidance, not a confirmed diagnosis. Consult a qualified mechanic."}
