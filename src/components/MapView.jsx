import { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import {
  PORT_COORDS,
  STATUS_COLORS,
  STATUS_RANK,
  MAP_CENTER,
  MAP_ZOOM,
} from '../constants.js';
import { formatDate } from '../utils.js';
import StatusBadge from './StatusBadge.jsx';
import StatusLegend from './StatusLegend.jsx';

// Build a coloured teardrop pin as a Leaflet divIcon.
function makePinIcon(color) {
  return L.divIcon({
    className: 'spinframe-pin',
    html: `
      <div style="position:relative;width:26px;height:36px;">
        <svg width="26" height="36" viewBox="0 0 26 36" xmlns="http://www.w3.org/2000/svg">
          <path d="M13 0C5.82 0 0 5.82 0 13c0 9.2 13 23 13 23s13-13.8 13-23C26 5.82 20.18 0 13 0z"
                fill="${color}" stroke="#0a1124" stroke-width="1.5"/>
          <circle cx="13" cy="13" r="5" fill="#0a1124"/>
        </svg>
      </div>`,
    iconSize: [26, 36],
    iconAnchor: [13, 36],
    popupAnchor: [0, -34],
  });
}

// The "overall" status of a port = its least advanced solution status.
function portOverallStatus(solutions) {
  let best = null;
  let bestRank = Infinity;
  for (const s of solutions) {
    const rank = STATUS_RANK[s.Status];
    if (rank != null && rank < bestRank) {
      bestRank = rank;
      best = s.Status;
    }
  }
  return best || solutions[0]?.Status || 'Assembly';
}

export default function MapView({ rows, activeStatuses, onToggleStatus }) {
  // Group rows by port.
  const ports = useMemo(() => {
    const map = new Map();
    for (const r of rows) {
      if (!PORT_COORDS[r.Port]) continue;
      if (!map.has(r.Port)) map.set(r.Port, []);
      map.get(r.Port).push(r);
    }
    return Array.from(map.entries()).map(([port, solutions]) => ({
      port,
      solutions,
      coords: PORT_COORDS[port],
      overall: portOverallStatus(solutions),
    }));
  }, [rows]);

  const visiblePorts = ports.filter((p) => activeStatuses.includes(p.overall));

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Port Map</h2>
          <p className="text-sm text-slate-400">
            Pin colour shows each port's least advanced solution ·{' '}
            {visiblePorts.length} of {ports.length} ports shown
          </p>
        </div>
        <div className="rounded-lg border border-navy-700 bg-navy-900 p-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            Filter ports by status
          </p>
          <StatusLegend active={activeStatuses} onToggle={onToggleStatus} />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-navy-700">
        <MapContainer
          center={MAP_CENTER}
          zoom={MAP_ZOOM}
          scrollWheelZoom
          style={{ height: '70vh', minHeight: 460, width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          {visiblePorts.map((p) => (
            <Marker
              key={p.port}
              position={p.coords}
              icon={makePinIcon(STATUS_COLORS[p.overall] || '#6b7280')}
            >
              <Popup>
                <div className="min-w-[200px]">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-white">
                      {p.port}
                    </span>
                    <StatusBadge status={p.overall} size="sm" />
                  </div>
                  <div className="mb-2 text-[11px] text-slate-400">
                    {p.solutions.length} solution
                    {p.solutions.length === 1 ? '' : 's'}
                  </div>
                  <ul className="space-y-2">
                    {p.solutions.map((s) => (
                      <li
                        key={s['Solution ID']}
                        className="rounded-md border border-navy-700 bg-navy-950/60 p-2"
                      >
                        <div className="text-[13px] font-medium text-white">
                          {s['Solution Name']}
                        </div>
                        <div className="mt-1 flex items-center justify-between gap-2">
                          <StatusBadge status={s.Status} size="sm" />
                          <span className="text-[11px] tabular-nums text-slate-400">
                            {formatDate(s['Expected Operational Date'])}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
