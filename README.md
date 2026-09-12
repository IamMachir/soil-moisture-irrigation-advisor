# Low-cost Soil Moisture & Irrigation Advisor for Campus Gardens

A web dashboard that helps campus grounds staff and gardening clubs keep plants healthy without guesswork. Low-cost soil moisture sensors placed in garden beds feed the system, which displays live moisture levels, tracks trends over time, and gives clear watering recommendations per garden zone — including a 3D visualization of the garden that color-codes each plot by moisture level.

## Group Members

Section 1 · Computer Science and Engineering (CSE), except Dereje Bogale (Software Engineering) · 5th Year, except Biruk Tesfaye, Elsabet Negash, and Epherem Tesfaye (6th Year)

| ID | Name |
|---|---|
| UGE/24145/13 | Biruk Tesfaye |
| UGE/27686/14 | Dereje Bogale |
| UGE/27834/14 | Efa Mirkana Abdisa |
| UGE/24133/13 | Elsabet Negash |
| UGE/24149/13 | Epherem Tesfaye |
| UGE/27638/14 | Machir Tadesse Woldemariam |
| UGE/27831/14 | Musbha Rida |

## Tech Stack

**Frontend**
- React (Vite)
- Tailwind CSS
- Recharts (moisture history charts)
- Three.js (3D garden scene)

**Backend**
- Node.js + Express.js
- MySQL (via `mysql2`)
- Rule-based irrigation advisor logic (no ML needed for a system this scale)

**Simulated sensor pipeline**
- A Node script (`backend/src/simulator/sensorSimulator.js`) models a real sensor's measurement chain — per-zone-calibrated raw ADC drift, sensor noise, and a raw-to-percentage mapping matching real hardware — and posts readings to the API on an interval, standing in for physical sensors until they're wired up. It talks to the same `/api/readings` endpoint real sensors would use, and only applies a simulated "watering" effect when the backend's advisor actually returns `watered: true`, so the simulated physical world and the real decision logic never disagree.

## Hardware Components

| Component | Spec |
|---|---|
| Microcontroller | ESP32 DevKit v1 (12-bit ADC, built-in WiFi) |
| Soil sensor | Capacitive soil moisture sensor v1.2/v2.0 (not resistive — avoids probe corrosion) |
| Actuator | 1-channel 5V relay module + small DC water pump (or solenoid valve) |
| Power | 5V/2A USB supply (ESP32) + separate supply matched to the pump's voltage |

Full bill of materials, wiring diagram, calibration procedure, and a complete ESP32 firmware reference implementation are in **[HARDWARE.md](./HARDWARE.md)**.

## Project Structure

```
soil-moisture-irrigation-advisor/
├── backend/
│   ├── src/
│   │   ├── config/       # DB connection
│   │   ├── controllers/  # Route handler logic
│   │   ├── models/       # DB queries (zones, readings, irrigation events)
│   │   ├── routes/       # Express routers
│   │   ├── simulator/    # Simulated sensor data generator
│   │   ├── utils/        # Irrigation advisor (threshold logic)
│   │   └── server.js
│   ├── migrations/       # SQL schema + seed zones
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── api/           # Axios client
    │   ├── components/    # StatusCards, MoistureChart
    │   ├── three/          # GardenScene3D (Three.js)
    │   └── pages/          # Dashboard (3D scene + panel side by side)
    └── index.html
```

## Getting Started

### Backend

```bash
cd backend
cp .env.example .env   # fill in your MySQL credentials
npm install
mysql -u root -p < migrations/001_init_schema.sql
npm run dev
```

### Run the simulated sensor feed (separate terminal)

```bash
cd backend
npm run simulate
```

### Seed historical data (optional but recommended for demos)

```bash
cd backend
npm run seed
```

This backfills 48 hours of realistic moisture history (with a day/night cycle and matching irrigation events for low-moisture points) per zone, so the dashboard's chart and irrigation log aren't empty the moment you open it — before the live simulator has built up its own history. Safe to re-run; it skips zones that already have readings.

### Run tests

```bash
cd backend
npm test
```

Covers input validation rules and the rule-based irrigation advisor — including per-zone threshold behavior (e.g. confirming a zone with a 50% threshold waters earlier than one using the old global 30% default) — using Jest with mocked models, no database connection required.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend expects the backend at `http://localhost:5001/api` (configurable via `VITE_API_URL`).

## How It Works

1. The simulator (or, later, real sensor firmware — see [HARDWARE.md](./HARDWARE.md)) posts a calibrated moisture reading per zone to `POST /api/readings`.
2. The backend stores it and runs it through the irrigation advisor, which flags a zone for watering if moisture drops below that zone's own configurable threshold — and enforces a cooldown (`IRRIGATION_COOLDOWN_MINUTES`) so a zone sitting below threshold doesn't re-trigger a new watering event on every single reading, the same way a real pump needs time to run and water needs time to absorb before the next decision is meaningful.
3. The API response includes `advisorResult.watered` — real firmware acts on this directly (pulsing a relay) rather than duplicating the threshold/cooldown logic locally, so changing a zone's threshold in the dashboard takes effect immediately without reflashing hardware.
4. The dashboard polls `/api/readings/latest` for live status cards and a Three.js 3D scene, and `/api/readings/history/:zoneId` for the moisture trend chart.
5. In the 3D scene, each garden plot is color-coded (red = dry, amber = moderate, green = well-watered), and an animated sprinkler cue appears on zones currently below threshold.

## IETP5201 Guide Compliance

The IETP guide (unlike the Capstone guide) doesn't mandate specific software architecture/security/testing domains — it's centered on the multidisciplinary engineering project cycle. Checked against it:

- **Team size (3–10)**: 7 members — compliant.
- **Prototype/Simulation Development**: satisfied by this dashboard + 3D garden scene.
- **Not covered here (non-code, requires team/advisor input)**: project proposal document, A0 poster, oral presentation, progress reports to the advisor, and the 30–45 page final report. These need real project-specific content (advisor name, meeting dates, lab safety notes, etc.) that only the team can supply — happy to draft templates for any of these on request.

## Deployment

- **Backend + simulator**: `render.yaml` defines two services for [Render](https://render.com) — the API server and the sensor simulator as a background worker, wired together automatically. Railway works similarly if preferred.
- **Database**: A managed MySQL instance on Railway, PlanetScale, or Render's MySQL add-on. Run the migration (`migrations/001_init_schema.sql`) once, then optionally `npm run seed` for historical data.
- **Frontend**: Deploy `frontend/` to Vercel or Netlify. Set `VITE_API_URL` to your deployed backend's `/api` URL, and confirm CORS allows your frontend's domain.
- **Real hardware (future)**: if ESP32 + soil sensors are wired up later, they can POST directly to the same deployed `/api/readings` endpoint the simulator uses today — no backend changes needed.

## Demo Script (for your defense)

1. Open the dashboard — point out the 3D garden scene next to the live status cards and moisture chart.
2. Rotate/zoom the 3D scene with the mouse, hover over a plot to show the exact moisture tooltip.
3. Watch a zone's color shift from green → amber → red as the simulator dries it out, then see the sprinkler cue and auto-watering kick in once it crosses the threshold.
4. Click "Water now" on a zone to demonstrate the manual override, and check the "Irrigation Log" tab to show the logged event (auto vs. manual).
5. Switch to "Add Zone" to show a new garden bed can be added without touching the database directly.

## Core Features

- [x] Garden zone schema + seed data
- [x] Sensor reading ingestion + rule-based watering advisor
- [x] Simulated sensor data generator with per-zone variance + day/night cycle
- [x] Dashboard: live status cards + moisture history chart
- [x] 3D garden scene with moisture color-coding, orbit controls, and hover tooltips
- [x] Manual "water this zone" trigger from the dashboard
- [x] Historical irrigation event log view
- [x] Server-side input validation on all write endpoints
- [x] Seed script for historical demo data
- [ ] Real sensor hardware integration (ESP32 + soil sensor)
- [ ] Per-zone configurable moisture thresholds

## Status

Feature-complete for an IETP MVP: schema, simulated sensor pipeline with realistic variance, rule-based advisor, dashboard with 3D scene + panel, manual override, event log, validation, and seed data are all in place, with a deployment blueprint ready for hosting. Real hardware integration is the natural next step and is documented as future work.
