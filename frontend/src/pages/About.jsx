const members = [
  { id: 'UGE/24145/13', name: 'Biruk Tesfaye' },
  { id: 'UGE/27686/14', name: 'Dereje Bogale' },
  { id: 'UGE/27834/14', name: 'Efa Mirkana Abdisa' },
  { id: 'UGE/24133/13', name: 'Elsabet Negash' },
  { id: 'UGE/24149/13', name: 'Epherem Tesfaye' },
  { id: 'UGE/27638/14', name: 'Machir Tadesse Woldemariam' },
  { id: 'UGE/27831/14', name: 'Musbha Rida' },
];

const components = [
  { part: 'Microcontroller', spec: 'ESP32 DevKit v1 (12-bit ADC, built-in WiFi)' },
  { part: 'Soil sensor', spec: 'Capacitive soil moisture sensor v1.2/v2.0' },
  { part: 'Actuator', spec: '1-channel 5V relay + small DC water pump' },
  { part: 'Power', spec: '5V/2A USB (ESP32) + supply matched to pump voltage' },
];

export default function About() {
  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-semibold mb-1">About This Project</h1>
      <p className="text-sm text-gray-500 mb-4">
        Low-cost Soil Moisture & Irrigation Advisor for Campus Gardens — IETP Project
      </p>

      <h2 className="font-medium mb-2">Group Members</h2>
      <table className="w-full text-sm border mb-6">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-2 border">ID</th>
            <th className="p-2 border">Name</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.id}>
              <td className="p-2 border font-mono">{m.id}</td>
              <td className="p-2 border">{m.name}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="font-medium mb-2">Hardware Components</h2>
      <table className="w-full text-sm border mb-2">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-2 border">Component</th>
            <th className="p-2 border">Spec</th>
          </tr>
        </thead>
        <tbody>
          {components.map((c) => (
            <tr key={c.part}>
              <td className="p-2 border">{c.part}</td>
              <td className="p-2 border">{c.spec}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-gray-500">
        Full wiring, calibration, and firmware reference: see HARDWARE.md in the repository.
      </p>
    </div>
  );
}
