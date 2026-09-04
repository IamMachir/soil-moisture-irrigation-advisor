import { useState } from 'react';
import Dashboard from './pages/Dashboard';
import CreateZone from './pages/CreateZone';
import About from './pages/About';
import IrrigationLog from './pages/IrrigationLog';

export default function App() {
  const [view, setView] = useState('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div>
      <div className="flex gap-2 px-6 pt-4">
        <button
          className={`text-sm px-3 py-1 rounded ${view === 'dashboard' ? 'bg-emerald-700 text-white' : 'bg-gray-100'}`}
          onClick={() => setView('dashboard')}
        >
          Dashboard
        </button>
        <button
          className={`text-sm px-3 py-1 rounded ${view === 'create-zone' ? 'bg-emerald-700 text-white' : 'bg-gray-100'}`}
          onClick={() => setView('create-zone')}
        >
          Add Zone
        </button>
        <button
          className={`text-sm px-3 py-1 rounded ${view === 'log' ? 'bg-emerald-700 text-white' : 'bg-gray-100'}`}
          onClick={() => setView('log')}
        >
          Irrigation Log
        </button>
        <button
          className={`text-sm px-3 py-1 rounded ${view === 'about' ? 'bg-emerald-700 text-white' : 'bg-gray-100'}`}
          onClick={() => setView('about')}
        >
          About
        </button>
      </div>

      {view === 'dashboard' && <Dashboard key={refreshKey} />}
      {view === 'create-zone' && <CreateZone onCreated={() => setRefreshKey((k) => k + 1)} />}
      {view === 'log' && <IrrigationLog />}
      {view === 'about' && <About />}
    </div>
  );
}
