# Low-cost Soil Moisture & Irrigation Advisor for Campus Gardens

A web dashboard that helps campus grounds staff and gardening clubs keep plants healthy without guesswork. Low-cost soil moisture sensors placed in garden beds feed the system, which displays live moisture levels, tracks trends over time, and gives clear watering recommendations per garden zone — including a 3D visualization of the garden that color-codes each plot by moisture level.

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
- A Node script (`backend/src/simulator/sensorSimulator.js`) generates realistic per-zone moisture readings and posts them to the API on an interval, standing in for real hardware (e.g. capacitive soil sensors on an ESP32) until it's wired up. It talks to the same `/api/readings` endpoint real sensors would use, so swapping in hardware later doesn't require changing the backend.

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

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend expects the backend at `http://localhost:5001/api` (configurable via `VITE_API_URL`).

## How It Works

1. The simulator (or, later, real sensors) posts a moisture reading per zone to `POST /api/readings`.
2. The backend stores it and runs it through the irrigation advisor, which flags a zone for watering if moisture drops below a configurable threshold (`MOISTURE_THRESHOLD` in `.env`), logging an irrigation event.
3. The dashboard polls `/api/readings/latest` for live status cards and a Three.js 3D scene, and `/api/readings/history/:zoneId` for the moisture trend chart.
4. In the 3D scene, each garden plot is color-coded (red = dry, amber = moderate, green = well-watered), and an animated sprinkler cue appears on zones currently below threshold.

## Core Features (in progress)

- [x] Garden zone schema + seed data
- [x] Sensor reading ingestion + rule-based watering advisor
- [x] Simulated sensor data generator
- [x] Dashboard: live status cards + moisture history chart
- [x] 3D garden scene with moisture color-coding
- [ ] Manual "water this zone" trigger from the dashboard
- [ ] Historical irrigation event log view
- [ ] Real sensor hardware integration (ESP32 + soil sensor)

## Status

Foundational scaffold: database schema, API routes, simulated sensor pipeline, and the dashboard + 3D scene base are in place. Feature work is ongoing.
