export default function AttentionAlerts({ zones, readingsByZone }) {
  const alerts = zones.filter((zone) => {
    const reading = readingsByZone[zone.id];
    if (!reading) return false;
    const threshold = Number(zone.moisture_threshold ?? 30);
    return reading.moisture_percent < threshold;
  });

  if (alerts.length === 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 mb-4">
      <p className="text-amber-800 font-medium text-sm mb-1">
        {alerts.length} zone{alerts.length > 1 ? 's' : ''} need{alerts.length === 1 ? 's' : ''} attention
      </p>
      <ul className="text-sm text-amber-700 space-y-0.5">
        {alerts.map((zone) => {
          const reading = readingsByZone[zone.id];
          return (
            <li key={zone.id}>
              {zone.name} — {reading.moisture_percent}% (below {zone.moisture_threshold}% threshold)
            </li>
          );
        })}
      </ul>
    </div>
  );
}
