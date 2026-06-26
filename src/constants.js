// Shared, hardcoded domain constants for the Spinframe Portal.

// The only valid ports (hardcoded per spec).
export const PORTS = [
  'Brisbane',
  'Melbourne',
  'Port Kembla',
  'Adelaide',
  'Darwin',
  'Fremantle',
];

// Status values in rollout order (least -> most advanced).
export const STATUSES = [
  'Assembly',
  'Testing',
  'Shipment',
  'Placement',
  'Validation',
  'Operational',
];

// Status -> colour (matches tailwind.config.js `status` palette).
export const STATUS_COLORS = {
  Assembly: '#6b7280', // grey
  Testing: '#eab308', // yellow
  Shipment: '#3b82f6', // blue
  Placement: '#f97316', // orange
  Validation: '#a855f7', // purple
  Operational: '#22c55e', // green
};

// Rank used to find the "least advanced" status for a port.
export const STATUS_RANK = STATUSES.reduce((acc, s, i) => {
  acc[s] = i;
  return acc;
}, {});

// Approximate geographic coordinates for each port [lat, lng].
export const PORT_COORDS = {
  Brisbane: [-27.3818, 153.133],
  Melbourne: [-37.84, 144.92],
  'Port Kembla': [-34.472, 150.911],
  Adelaide: [-34.779, 138.487],
  Darwin: [-12.417, 130.85],
  Fremantle: [-32.05, 115.74],
};

// Center / zoom for the Australia map.
export const MAP_CENTER = [-28.0, 134.0];
export const MAP_ZOOM = 4;
