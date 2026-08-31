function statusColor(moisture) {
  if (moisture < 30) return 'bg-red-100 border-red-400 text-red-800';
  if (moisture < 60) return 'bg-yellow-100 border-yellow-400 text-yellow-800';
  return 'bg-green-100 border-green-400 text-green-800';
}

export default function StatusCards({ zones, readingsByZone }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {zones.map((zone) => {
        const reading = readingsByZone[zone.id];
        const moisture = reading ? reading.moisture_percent : null;
        return (
          <div
            key={zone.id}
            className={`border rounded-lg p-3 ${moisture !== null ? statusColor(moisture) : 'bg-gray-50 border-gray-300'}`}
          >
            <p className="font-medium text-sm">{zone.name}</p>
            <p className="text-2xl font-bold">
              {moisture !== null ? `${moisture}%` : '—'}
            </p>
            <p className="text-xs opacity-75">{zone.location_note}</p>
          </div>
        );
      })}
    </div>
  );
}
