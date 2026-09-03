import { useEffect, useState } from 'react';
import api from '../api/client';
import GardenScene3D from '../three/GardenScene3D';
import StatusCards from '../components/StatusCards';
import MoistureChart from '../components/MoistureChart';

export default function Dashboard() {
  const [zones, setZones] = useState([]);
  const [readingsByZone, setReadingsByZone] = useState({});
  const [selectedZoneId, setSelectedZoneId] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');

  // Load zones once
  useEffect(() => {
    api
      .get('/zones')
      .then((res) => {
        setZones(res.data);
        if (res.data.length > 0) setSelectedZoneId(res.data[0].id);
      })
      .catch(() => setError('Could not load zones. Is the backend running?'));
  }, []);

  // Poll latest readings periodically (simulates a live feed)
  useEffect(() => {
    function fetchLatest() {
      api
        .get('/readings/latest')
        .then((res) => {
          const map = {};
          res.data.forEach((r) => {
            map[r.zone_id] = r;
          });
          setReadingsByZone(map);
        })
        .catch(() => setError('Could not load live readings.'));
    }

    fetchLatest();
    const interval = setInterval(fetchLatest, 4000);
    return () => clearInterval(interval);
  }, []);

  // Load history for the selected zone whenever it changes or new data comes in
  useEffect(() => {
    if (!selectedZoneId) return;
    api
      .get(`/readings/history/${selectedZoneId}`)
      .then((res) => setHistory(res.data))
      .catch(() => {});
  }, [selectedZoneId, readingsByZone]);

  // Optimistically reflect a manual watering event before the next poll confirms it
  function handleWatered(zoneId) {
    setReadingsByZone((prev) => ({
      ...prev,
      [zoneId]: {
        ...(prev[zoneId] || {}),
        zone_id: zoneId,
        moisture_percent: 70,
        recorded_at: new Date().toISOString(),
      },
    }));
  }

  return (
    <div className="p-6 h-screen flex flex-col">
      <h1 className="text-2xl font-semibold mb-1">Soil Moisture & Irrigation Advisor</h1>
      <p className="text-sm text-gray-500 mb-4">Live campus garden overview (simulated sensor feed)</p>
      {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
        {/* 3D scene */}
        <div className="min-h-[320px]">
          <GardenScene3D zones={zones} readingsByZone={readingsByZone} />
        </div>

        {/* Dashboard panel */}
        <div className="flex flex-col gap-4 overflow-y-auto">
          <StatusCards zones={zones} readingsByZone={readingsByZone} onWatered={handleWatered} />

          <div className="border rounded-lg p-3">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-medium text-sm">Moisture history</h2>
              <select
                className="text-sm border rounded px-2 py-1"
                value={selectedZoneId || ''}
                onChange={(e) => setSelectedZoneId(Number(e.target.value))}
              >
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                  </option>
                ))}
              </select>
            </div>
            <MoistureChart history={history} />
          </div>
        </div>
      </div>
    </div>
  );
}
