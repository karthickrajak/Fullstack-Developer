import React, { useEffect, useState } from 'react';
import { Activity, ArrowUpRight, Bell, CarFront, CheckCircle2, ChevronRight, CircleGauge, Clock3, Cpu, Droplets, Gauge, Plus, Search, ShieldCheck, Sparkles, Wrench, Zap } from 'lucide-react';

const API = 'http://127.0.0.1:8000/api';
const starterCar = { name: 'Tata Sumo Gold', year: '2012', plate: 'TN 55 AB 1234', mileage: '13.2', fuel: 'Diesel' };
const initialServices = [
  { id: 's1', title: 'Engine oil & filter', date: '2026-09-12', status: 'Due soon', icon: Droplets },
  { id: 's2', title: 'Brake inspection', date: '2026-08-21', status: 'Completed', icon: ShieldCheck },
  { id: 's3', title: 'Air filter replacement', date: '2026-07-03', status: 'Completed', icon: Activity },
];

function App() {
  const [car, setCar] = useState(starterCar);
  const [services, setServices] = useState(initialServices);
  const [symptom, setSymptom] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState('Demo mode');
  const [showForm, setShowForm] = useState(false);
  const [newService, setNewService] = useState('');

  useEffect(() => {
    fetch(`${API}/health`).then(r => r.ok ? r.json() : Promise.reject()).then(() => setApiStatus('API connected')).catch(() => setApiStatus('Demo mode'));
    fetch(`${API}/vehicles`).then(r => r.ok ? r.json() : []).then(data => { if (data?.length) { const v = data[0]; setCar({ name: v.name, year: String(v.year), plate: v.plate || 'Not set', mileage: String(v.mileage ?? '—'), fuel: v.fuel || 'Not set' }); } }).catch(() => {});
    fetch(`${API}/services`).then(r => r.ok ? r.json() : []).then(data => { if (data?.length) setServices(data.map(s => ({ ...s, title: s.title, status: s.status || 'Logged', date: s.service_date || s.date, icon: Wrench }))); }).catch(() => {});
  }, []);

  async function addService(e) {
    e.preventDefault(); if (!newService.trim()) return;
    const item = { title: newService.trim(), service_date: new Date().toISOString().slice(0, 10), status: 'Logged' };
    try { const r = await fetch(`${API}/services`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) }); if (r.ok) { const saved = await r.json(); setServices(prev => [{ ...saved, title: saved.title, date: saved.service_date, icon: Wrench }, ...prev]); } else throw new Error(); }
    catch { setServices(prev => [{ id: `local-${Date.now()}`, title: item.title, date: item.service_date, status: 'Logged locally', icon: Wrench }, ...prev]); }
    setNewService(''); setShowForm(false);
  }

  async function runDiagnosis(e) {
    e.preventDefault(); if (!symptom.trim()) return; setLoading(true); setDiagnosis('');
    try { const r = await fetch(`${API}/diagnose`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ symptom }) }); if (!r.ok) throw new Error(); const d = await r.json(); setDiagnosis(`${d.summary} ${d.advice || ''}`); }
    catch { const s = symptom.toLowerCase(); const answer = s.includes('start') || s.includes('crank') ? 'Possible causes include a weak battery, loose terminals, starter motor, or fuel delivery issue. Check battery connections first; if the engine cranks but does not start, arrange a mechanic inspection.' : s.includes('brake') ? 'Brake noise or reduced braking can indicate worn pads, low fluid, or another brake-system issue. Avoid driving if braking feels weak and have it inspected promptly.' : s.includes('heat') || s.includes('overheat') ? 'Stop safely and switch the engine off if it is overheating. Never open a hot radiator cap. Let it cool and have coolant level, leaks, fan, and thermostat checked.' : 'This symptom needs more context. Note when it happens, any warning lights, sounds, smell, and whether the car is safe to drive. A mechanic can confirm the cause.'; setDiagnosis(answer); }
    setLoading(false);
  }

  return <div className="app-shell">
    <div className="ambient ambient-one"/><div className="ambient ambient-two"/>
    <aside className="sidebar">
      <a className="brand" href="#top"><span className="brand-icon"><CarFront size={22}/></span><span>CarCare<span className="brand-ai"> AI</span><small>YOUR CAR. UNDERSTOOD.</small></span></a>
      <div className="side-label">WORKSPACE</div>
      <a className="nav-item active" href="#overview"><CircleGauge size={18}/> Overview</a><a className="nav-item" href="#maintenance"><Wrench size={18}/> Maintenance <span className="nav-count">2</span></a><a className="nav-item" href="#diagnostics"><Sparkles size={18}/> AI Diagnostics</a><a className="nav-item" href="#history"><Clock3 size={18}/> Service history</a>
      <div className="sidebar-bottom"><div className="pro-card"><div className="pro-glow"><Zap size={18}/></div><strong>Drive smarter.</strong><p>Keep every mile in great shape.</p><a href="#diagnostics">Explore assistant <ArrowUpRight size={14}/></a></div><div className="profile-row"><div className="avatar">CC</div><div><strong>Car owner</strong><small>Personal garage</small></div><span className="online-dot"/></div></div>
    </aside>
    <main id="top" className="main-content">
      <header className="topbar"><div className="breadcrumb">Workspace <ChevronRight size={14}/> <span>Overview</span></div><div className="top-actions"><div className={`api-pill ${apiStatus === 'API connected' ? 'connected' : ''}`}><span/> {apiStatus}</div><button className="icon-button" aria-label="Notifications"><Bell size={18}/><i/></button><div className="avatar small-avatar">CC</div></div></header>
      <section className="welcome" id="overview"><div><div className="eyebrow"><span className="eyebrow-line"/> YOUR GARAGE, REIMAGINED</div><h1>Good morning.<br/><span>Your car deserves</span> <em>better.</em></h1><p className="welcome-copy">A little care today makes every journey smoother tomorrow.</p></div><div className="date-chip"><span className="date-dot"/> WEDNESDAY, OCT 28</div></section>
      <section className="hero-card"><div className="hero-grid"/><div className="hero-copy"><div className="status-tag"><span/> YOUR PRIMARY VEHICLE</div><h2>{car.name}</h2><p className="car-meta">{car.year} <span>•</span> {car.fuel} <span>•</span> {car.plate}</p><div className="hero-stats"><div><span>ODOMETER</span><strong>{Number(car.mileage) ? `${car.mileage} <small>km/L</small>` : 'Not set'}</strong></div><div><span>HEALTH SCORE</span><strong className="score">82<small>/100</small></strong></div><div><span>NEXT SERVICE</span><strong>Due soon</strong></div></div><a className="hero-link" href="#maintenance">View vehicle details <ArrowUpRight size={16}/></a></div><div className="car-art"><div className="car-halo"/><div className="orbit orbit-a"/><div className="orbit orbit-b"/><div className="car-emoji" role="img" aria-label="Illustration of a modern car">🚙</div><div className="floating-chip chip-health"><span className="chip-check"><CheckCircle2 size={15}/></span><span><b>All systems</b><small>Looking good</small></span></div><div className="floating-chip chip-mileage"><Gauge size={18}/><span><b>13.2 km/L</b><small>Fuel efficiency</small></span></div></div><div className="hero-corner">CC / 01</div></section>
      <section className="metrics-grid"><Metric icon={Activity} label="Vehicle health" value="82%" sub="Good condition" trend="+4.8%" tone="green"/><Metric icon={Wrench} label="Services logged" value={String(services.length).padStart(2, '0')} sub="Service records" tone="purple"/><Metric icon={Bell} label="Upcoming tasks" value="02" sub="Needs attention" tone="orange"/><Metric icon={CircleGauge} label="Fuel efficiency" value="13.2" suffix="km/L" sub="Based on your entry" tone="blue"/></section>
      <section className="content-grid"><div className="panel maintenance-panel" id="maintenance"><div className="panel-heading"><div><div className="section-kicker">STAY AHEAD</div><h3>Maintenance planner</h3><p>Small checkups. Big peace of mind.</p></div><button className="round-action" onClick={() => setShowForm(!showForm)} aria-label="Add service"><Plus size={19}/></button></div>{showForm && <form className="add-service" onSubmit={addService}><input value={newService} onChange={e => setNewService(e.target.value)} placeholder="e.g. Replace engine oil" aria-label="Service name"/><button type="submit">Add</button></form>}<div className="service-list">{services.slice(0, 4).map((s, i) => { const Icon = s.icon || Wrench; return <div className="service-row" key={s.id || `${s.title}-${i}`}><div className={`service-icon service-icon-${i % 3}`}><Icon size={18}/></div><div className="service-info"><strong>{s.title}</strong><small>{s.date || 'Date not set'}</small></div><span className={`service-status ${(s.status || '').toLowerCase().includes('due') ? 'due' : 'done'}`}>{s.status || 'Logged'}</span></div>; })}</div><a className="text-link" href="#history">View all service history <ArrowUpRight size={15}/></a></div>
      <div className="panel health-panel"><div className="panel-heading"><div><div className="section-kicker">AT A GLANCE</div><h3>Vehicle wellness</h3><p>Your maintenance snapshot.</p></div><span className="pulse-icon"><Activity size={18}/></span></div><div className="health-score-wrap"><div className="score-ring"><svg viewBox="0 0 120 120"><circle className="ring-bg" cx="60" cy="60" r="49"/><circle className="ring-progress" cx="60" cy="60" r="49"/></svg><div><strong>82</strong><small>out of 100</small></div></div><div className="health-caption"><strong>Looking good</strong><p>Your vehicle is in decent shape. A little scheduled maintenance can help keep it that way.</p></div></div><div className="health-bars"><HealthBar label="Engine care" value={76} color="violet"/><HealthBar label="Service routine" value={88} color="green"/><HealthBar label="Fuel efficiency" value={82} color="blue"/></div><div className="disclaimer">Estimated from your entries, not a sensor-based inspection.</div></div></section>
      <section className="panel diagnostic-panel" id="diagnostics"><div className="diagnostic-orb"><Sparkles size={24}/><span/></div><div className="diagnostic-intro"><div className="section-kicker">MEET YOUR COPILOT</div><h3>Something feel off?</h3><p>Describe a symptom and get practical next steps from your AI car assistant.</p></div><form className="diagnostic-form" onSubmit={runDiagnosis}><div className="input-wrap"><Search size={18}/><input value={symptom} onChange={e => setSymptom(e.target.value)} placeholder="e.g. My engine struggles to start..." aria-label="Describe car symptom"/></div><button type="submit" disabled={loading}>{loading ? 'Thinking…' : <>Ask CarCare AI <ArrowUpRight size={16}/></>}</button></form>{diagnosis && <div className="diagnosis-result"><div><Sparkles size={17}/><strong>Assistant suggestion</strong></div><p>{diagnosis}</p><small>Safety note: this is general guidance, not a confirmed diagnosis.</small></div>}<div className="suggestion-chips"><span>Try asking</span><button onClick={() => setSymptom('Engine cranks but will not start')}>Engine won't start</button><button onClick={() => setSymptom('Brake noise while stopping')}>Brake noise</button><button onClick={() => setSymptom('Engine overheating')}>Overheating</button></div></section>
      <section className="bottom-note" id="history"><div className="note-icon"><ShieldCheck size={20}/></div><div><strong>A safer drive starts with a small check.</strong><p>Keep service dates and mileage updated for more useful reminders.</p></div><span className="note-mark">CARCARE / CARE GUIDE</span></section>
      <footer>© 2026 CarCare AI <span>BUILT FOR EVERY JOURNEY</span><span className="footer-status"><i/> Systems ready</span></footer>
    </main>
  </div>;
}
function Metric({ icon: Icon, label, value, suffix, sub, trend, tone }) { return <div className="metric-card"><div className={`metric-icon ${tone}`}><Icon size={19}/></div><span className="metric-label">{label}</span><div className="metric-value">{value}<small>{suffix}</small></div><div className="metric-bottom"><span>{sub}</span>{trend && <b>{trend}</b>}</div></div>; }
function HealthBar({ label, value, color }) { return <div className="health-bar-row"><div><span>{label}</span><b>{value}%</b></div><div className="bar-track"><span className={color} style={{ width: `${value}%` }}/></div></div>; }

export default App;
