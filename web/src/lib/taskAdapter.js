const CITY_COORDS = {
  bangalore: [12.97, 77.59], bengaluru: [12.97, 77.59],
  mumbai: [19.08, 72.88], bombay: [19.08, 72.88],
  delhi: [28.61, 77.23], 'new delhi': [28.61, 77.23],
  chennai: [13.08, 80.27], madras: [13.08, 80.27],
  kolkata: [22.57, 88.36], calcutta: [22.57, 88.36],
  hyderabad: [17.39, 78.49],
  pune: [18.52, 73.86],
  ahmedabad: [23.03, 72.58],
  jaipur: [26.91, 75.79],
  lucknow: [26.85, 80.95],
  kanpur: [26.45, 80.33],
  nagpur: [21.15, 79.09],
  indore: [22.72, 75.86],
  bhopal: [23.26, 77.40],
  patna: [25.59, 85.14],
  vadodara: [22.31, 73.18],
  ludhiana: [30.90, 75.85],
  agra: [27.18, 78.01],
  nashik: [19.99, 73.79],
  faridabad: [28.41, 77.31],
  meerut: [28.98, 77.71],
  rajkot: [22.30, 70.80],
  varanasi: [25.32, 82.97],
  srinagar: [34.09, 74.79],
  amritsar: [31.63, 74.87],
  kochi: [9.94, 76.27], cochin: [9.94, 76.27],
  thiruvananthapuram: [8.52, 76.94], trivandrum: [8.52, 76.94],
  coimbatore: [11.02, 76.97],
  visakhapatnam: [17.69, 83.22],
  guwahati: [26.14, 91.74],
  bhubaneswar: [20.30, 85.82],
  dehradun: [30.32, 78.04],
  shimla: [31.10, 77.17],
  mangalore: [12.91, 74.86],
  mysore: [12.30, 76.65],
  goa: [15.30, 74.12], panaji: [15.50, 73.83],
  mg: [12.97, 77.59],
  riverside: [12.97, 77.59],

  london: [51.51, -0.13],
  paris: [48.86, 2.35],
  berlin: [52.52, 13.40],
  madrid: [40.42, -3.70],
  rome: [41.90, 12.50],
  amsterdam: [52.37, 4.90],
  moscow: [55.76, 37.62],
  istanbul: [41.01, 28.98],
  athens: [37.98, 23.73],
  vienna: [48.21, 16.37],
  warsaw: [52.23, 21.01],
  lisbon: [38.72, -9.14],
  dublin: [53.35, -6.26],
  stockholm: [59.33, 18.07],
  oslo: [59.91, 10.75],

  'new york': [40.71, -74.00], nyc: [40.71, -74.00], manhattan: [40.78, -73.97],
  'los angeles': [34.05, -118.24], la: [34.05, -118.24],
  chicago: [41.88, -87.63],
  houston: [29.76, -95.37],
  miami: [25.76, -80.19],
  toronto: [43.65, -79.38],
  vancouver: [49.28, -123.12],
  montreal: [45.50, -73.57],
  'mexico city': [19.43, -99.13],
  havana: [23.13, -82.38],

  'sao paulo': [-23.55, -46.63], 'são paulo': [-23.55, -46.63],
  'rio de janeiro': [-22.91, -43.17], rio: [-22.91, -43.17],
  'buenos aires': [-34.60, -58.38],
  lima: [-12.05, -77.04],
  bogota: [4.71, -74.07], 'bogotá': [4.71, -74.07],
  caracas: [10.49, -66.88],
  santiago: [-33.45, -70.67],

  cairo: [30.04, 31.24],
  lagos: [6.50, 3.40],
  nairobi: [-1.29, 36.82],
  johannesburg: [-26.20, 28.04],
  'cape town': [-33.92, 18.42],
  'addis ababa': [9.03, 38.74],
  accra: [5.60, -0.19],
  casablanca: [33.57, -7.59],
  tunis: [36.81, 10.18],
  dakar: [14.69, -17.44],

  tokyo: [35.68, 139.69],
  beijing: [39.90, 116.41],
  shanghai: [31.23, 121.47],
  seoul: [37.57, 126.98],
  bangkok: [13.75, 100.50],
  jakarta: [-6.21, 106.85],
  manila: [14.60, 120.98],
  singapore: [1.35, 103.82],
  'hong kong': [22.32, 114.17],
  'kuala lumpur': [3.14, 101.69],
  'ho chi minh': [10.82, 106.63],
  hanoi: [21.03, 105.85],
  taipei: [25.03, 121.57],
  dhaka: [23.81, 90.41],
  karachi: [24.86, 67.01],
  lahore: [31.55, 74.34],
  islamabad: [33.69, 73.05],
  kabul: [34.53, 69.17],
  tehran: [35.69, 51.39],
  baghdad: [33.32, 44.36],
  riyadh: [24.71, 46.68],
  dubai: [25.20, 55.27],
  'abu dhabi': [24.45, 54.38],
  doha: [25.29, 51.53],

  sydney: [-33.87, 151.21],
  melbourne: [-37.81, 144.96],
  auckland: [-36.85, 174.76],
};

const SORTED_KEYS = Object.keys(CITY_COORDS).sort((a, b) => b.length - a.length);

export function geocodeLocation(text) {
  if (!text) return null;
  const lower = text.toLowerCase();
  for (const key of SORTED_KEYS) {
    if (lower.includes(key)) return CITY_COORDS[key];
  }
  return null;
}

export function normalizeTask(task) {
  return {
    id: task.id,
    rawText: task.raw_text || task.rawText,
    category: task.category,
    urgency: task.urgency,
    locationText: task.location_text || task.locationText,
    quantityOrDetails: task.quantity_details || task.quantityOrDetails,
    confidence:
      typeof task.confidence === 'number'
        ? task.confidence < 0.6
          ? 'review'
          : 'high'
        : task.confidence,
    status: task.status,
    assignedVolunteerId: task.assigned_volunteer_id || task.assignedVolunteerId,
    assignedVolunteerName:
      task.assigned_volunteer_name || task.assignedVolunteerName,
    assignmentRationale: task.assignment_rationale || task.assignmentRationale,
    assignedVolunteerLat:
      task.assigned_volunteer_lat ?? task.assignedVolunteerLat ?? null,
    assignedVolunteerLng:
      task.assigned_volunteer_lng ?? task.assignedVolunteerLng ?? null,
    assignedVolunteerDistanceKm:
      task.assigned_volunteer_distance_km ??
      task.assignedVolunteerDistanceKm ??
      null,
    lat: typeof task.lat === 'number' ? task.lat : null,
    lng: typeof task.lng === 'number' ? task.lng : null,
    language: task.language || 'en',
    descriptionEn: task.description_en || task.descriptionEn || null,
    source: task.source || 'text',
    createdAt: task.created_at || task.createdAt,
    assignedAt: task.assigned_at || task.assignedAt,
    completedAt: task.completed_at || task.completedAt,
  };
}

const STATUS_TO_COLUMN = {
  needs_approval: 'review',
  needs_review: 'review',
  pending: 'incoming',
  assigned: 'matched',
  dispatched: 'dispatched',
  completed: 'resolved',
  resolved: 'resolved',
};

export function statusToColumn(status) {
  return STATUS_TO_COLUMN[status] || 'incoming';
}

export function urgencyKey(urgency) {
  const u = String(urgency || '').toLowerCase();
  if (u.startsWith('h')) return 'high';
  if (u.startsWith('l')) return 'low';
  return 'medium';
}

export function relativeTime(isoString) {
  if (!isoString) return 'just now';
  const then = new Date(isoString).getTime();
  if (Number.isNaN(then)) return 'just now';
  const diff = Math.max(0, Date.now() - then);
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

/* Coarse continent classifier from lat/lng. Boundaries are deliberately
   forgiving — the globe just needs to know which landmass to pin to. */
function continentFromLatLng(lat, lng) {
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;
  // Oceania first (overlaps Asia in lng terms)
  if (lat <= 0 && lng >= 110 && lng <= 180) return 'Oceania';
  if (lat <= -10 && lng >= 110 && lng <= 180) return 'Oceania';
  // Africa
  if (lat >= -36 && lat <= 38 && lng >= -18 && lng <= 52) return 'Africa';
  // Europe
  if (lat >= 35 && lat <= 72 && lng >= -25 && lng <= 50) return 'Europe';
  // Asia (broad)
  if (lat >= -10 && lat <= 78 && lng >= 50 && lng <= 180) return 'Asia';
  // North America
  if (lat >= 8 && lng >= -170 && lng <= -50) return 'North America';
  // South America
  if (lat <= 14 && lng >= -82 && lng <= -34) return 'South America';
  return null;
}

// Statuses that should NEVER appear on the field map / globe.
// Pre-approval signals live only in the Review column of the kanban —
// otherwise the map fills up with unverified noise and approval feels
// invisible because the pin was already there.
const HIDDEN_FROM_MAP = new Set([
  'needs_approval',
  'needs_review',
  'completed',
  'resolved',
]);

export function isMapVisibleStatus(status) {
  return !HIDDEN_FROM_MAP.has(status);
}

export function tasksToGlobePins(tasks = []) {
  const pins = [];
  for (const t of tasks) {
    if (typeof t.lat !== 'number' || typeof t.lng !== 'number') continue;
    if (!isMapVisibleStatus(t.status)) continue;
    const continent = continentFromLatLng(t.lat, t.lng);
    if (!continent) continue;
    pins.push({
      id: t.id,
      lat: t.lat,
      lng: t.lng,
      urgency: urgencyKey(t.urgency),
      continent,
    });
  }
  return pins;
}

export function taskToCard(task) {
  return {
    id: task.id,
    type: task.category || 'Unclassified',
    location: task.locationText || 'Location pending',
    urgency: urgencyKey(task.urgency),
    people: task.quantityOrDetails || null,
    volunteerName: task.assignedVolunteerName || null,
    rationale: task.assignmentRationale || null,
    contact: task.assignedVolunteerName
      ? `Volunteer: ${task.assignedVolunteerName}`
      : null,
    status: statusToColumn(task.status),
    rawStatus: task.status,
    timestamp: relativeTime(task.createdAt),
    language: task.language || 'en',
    descriptionEn: task.descriptionEn || null,
    raw: task,
  };
}
