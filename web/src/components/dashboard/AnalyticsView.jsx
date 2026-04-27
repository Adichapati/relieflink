import { useMemo } from 'react';

const CATEGORY_LABELS = {
  food: 'Food',
  water: 'Water',
  medicine: 'Medicine',
  shelter: 'Shelter',
  general_relief: 'General',
};

const CATEGORY_ICONS = {
  food: '🍱',
  water: '💧',
  medicine: '💊',
  shelter: '🏠',
  general_relief: '🆘',
};

const URGENCY_ORDER = ['critical', 'high', 'medium', 'low'];
const URGENCY_COLORS = {
  critical: '#ff3333',
  high: '#ff6633',
  medium: '#ffaa00',
  low: '#00cc66',
};

function bucketResponseTimes(tasks) {
  const buckets = [
    { label: '<1m', min: 0, max: 60_000, count: 0 },
    { label: '1–5m', min: 60_000, max: 300_000, count: 0 },
    { label: '5–15m', min: 300_000, max: 900_000, count: 0 },
    { label: '15–60m', min: 900_000, max: 3_600_000, count: 0 },
    { label: '>1h', min: 3_600_000, max: Infinity, count: 0 },
  ];
  let assigned = 0;
  let totalMs = 0;
  for (const t of tasks) {
    if (!t.assignedAt || !t.createdAt) continue;
    const diff = new Date(t.assignedAt) - new Date(t.createdAt);
    if (!(diff >= 0)) continue;
    assigned++;
    totalMs += diff;
    const b = buckets.find((bk) => diff >= bk.min && diff < bk.max);
    if (b) b.count++;
  }
  const avgMin = assigned > 0 ? totalMs / assigned / 60_000 : null;
  return { buckets, assigned, avgMin };
}

function pickHotZones(tasks, limit = 5) {
  const map = new Map();
  for (const t of tasks) {
    const loc = (t.locationText || '').trim();
    if (!loc || loc === 'NEEDS MANUAL REVIEW') continue;
    // Use first comma-separated segment as the zone key
    const key = loc.split(',')[0].trim().slice(0, 32);
    if (!key) continue;
    const slot = map.get(key) || { name: key, total: 0, critical: 0 };
    slot.total++;
    if (t.urgency === 'critical' || t.urgency === 'high') slot.critical++;
    map.set(key, slot);
  }
  return Array.from(map.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

function pickLanguageMix(tasks) {
  const map = new Map();
  for (const t of tasks) {
    const code = (t.language || 'en').toLowerCase();
    map.set(code, (map.get(code) || 0) + 1);
  }
  return Array.from(map.entries())
    .map(([code, count]) => ({ code, count }))
    .sort((a, b) => b.count - a.count);
}

function buildVolunteerLeaderboard(tasks, volunteers) {
  const map = new Map();
  for (const t of tasks) {
    const id = t.assignedVolunteerId;
    if (!id) continue;
    const slot = map.get(id) || {
      id,
      name: t.assignedVolunteerName || 'Volunteer',
      assigned: 0,
      completed: 0,
    };
    slot.assigned++;
    if (t.status === 'completed') slot.completed++;
    map.set(id, slot);
  }
  // Hydrate names from the volunteers list when possible
  for (const v of volunteers) {
    const slot = map.get(v.id || v.firebaseUid);
    if (slot && v.name) slot.name = v.name;
  }
  return Array.from(map.values())
    .sort((a, b) => b.completed - a.completed || b.assigned - a.assigned)
    .slice(0, 5);
}

export default function AnalyticsView({ tasks = [], volunteers = [] }) {
  const data = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const active = tasks.filter(
      (t) => t.status === 'assigned' || t.status === 'dispatched',
    ).length;
    const review = tasks.filter(
      (t) => t.status === 'needs_review' || t.status === 'needs_approval',
    ).length;

    // Category breakdown
    const categoryCounts = {};
    for (const t of tasks) {
      const c = t.category || 'general_relief';
      categoryCounts[c] = (categoryCounts[c] || 0) + 1;
    }
    const maxCategoryCount = Math.max(1, ...Object.values(categoryCounts));

    // Urgency mix
    const urgencyCounts = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const t of tasks) {
      const u = (t.urgency || 'medium').toLowerCase();
      if (u in urgencyCounts) urgencyCounts[u]++;
    }

    const { buckets: responseBuckets, assigned, avgMin } = bucketResponseTimes(tasks);
    const maxBucket = Math.max(1, ...responseBuckets.map((b) => b.count));

    const hotZones = pickHotZones(tasks);
    const maxZone = Math.max(1, ...hotZones.map((z) => z.total));

    const languageMix = pickLanguageMix(tasks);
    const leaderboard = buildVolunteerLeaderboard(tasks, volunteers);

    const volunteersAvailable = volunteers.filter(
      (v) => v.status === 'available',
    ).length;

    return {
      total,
      completed,
      active,
      review,
      categoryCounts,
      maxCategoryCount,
      urgencyCounts,
      responseBuckets,
      maxBucket,
      avgMin,
      assignedWithTime: assigned,
      hotZones,
      maxZone,
      languageMix,
      leaderboard,
      volunteersAvailable,
      volunteersTotal: volunteers.length,
    };
  }, [tasks, volunteers]);

  if (data.total === 0) {
    return (
      <div className="analytics-empty mono">
        No signals yet — analytics will populate as requests stream in.
      </div>
    );
  }

  const categoryEntries = Object.entries(data.categoryCounts).sort(
    (a, b) => b[1] - a[1],
  );
  const urgencyTotal =
    data.urgencyCounts.critical +
      data.urgencyCounts.high +
      data.urgencyCounts.medium +
      data.urgencyCounts.low || 1;

  return (
    <div className="analytics-view">
      {/* KPI strip */}
      <div className="analytics-kpis">
        <div className="analytics-kpi">
          <span className="analytics-kpi-label mono">Total Signals</span>
          <span className="analytics-kpi-value mono">{data.total}</span>
        </div>
        <div className="analytics-kpi">
          <span className="analytics-kpi-label mono">Resolved</span>
          <span className="analytics-kpi-value mono accent">{data.completed}</span>
        </div>
        <div className="analytics-kpi">
          <span className="analytics-kpi-label mono">In Flight</span>
          <span className="analytics-kpi-value mono">{data.active}</span>
        </div>
        <div className="analytics-kpi">
          <span className="analytics-kpi-label mono">Awaiting Review</span>
          <span className="analytics-kpi-value mono">{data.review}</span>
        </div>
        <div className="analytics-kpi">
          <span className="analytics-kpi-label mono">Avg Response</span>
          <span className="analytics-kpi-value mono">
            {data.avgMin == null ? '—' : `${data.avgMin.toFixed(1)}m`}
          </span>
        </div>
        <div className="analytics-kpi">
          <span className="analytics-kpi-label mono">Volunteers Free</span>
          <span className="analytics-kpi-value mono">
            {data.volunteersAvailable}/{data.volunteersTotal}
          </span>
        </div>
      </div>

      <div className="analytics-grid">
        {/* Category breakdown */}
        <div className="analytics-card">
          <div className="analytics-card-header">
            <span className="analytics-card-title mono">Category Mix</span>
            <span className="analytics-card-sub">What people need</span>
          </div>
          <div className="analytics-bars">
            {categoryEntries.map(([cat, count]) => {
              const pct = (count / data.maxCategoryCount) * 100;
              return (
                <div key={cat} className="analytics-bar-row">
                  <span className="analytics-bar-label">
                    <span className="analytics-bar-icon">
                      {CATEGORY_ICONS[cat] || '•'}
                    </span>
                    {CATEGORY_LABELS[cat] || cat}
                  </span>
                  <div className="analytics-bar-track">
                    <span
                      className="analytics-bar-fill"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="analytics-bar-value mono">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Urgency mix as a stacked bar */}
        <div className="analytics-card">
          <div className="analytics-card-header">
            <span className="analytics-card-title mono">Urgency Mix</span>
            <span className="analytics-card-sub">{urgencyTotal} total</span>
          </div>
          <div className="analytics-stack">
            {URGENCY_ORDER.map((u) => {
              const c = data.urgencyCounts[u] || 0;
              const pct = (c / urgencyTotal) * 100;
              if (c === 0) return null;
              return (
                <span
                  key={u}
                  className="analytics-stack-segment"
                  style={{
                    width: `${pct}%`,
                    background: URGENCY_COLORS[u],
                  }}
                  title={`${u}: ${c}`}
                />
              );
            })}
          </div>
          <div className="analytics-stack-legend">
            {URGENCY_ORDER.map((u) => (
              <div key={u} className="analytics-stack-legend-item">
                <span
                  className="analytics-stack-legend-dot"
                  style={{ background: URGENCY_COLORS[u] }}
                />
                <span className="analytics-stack-legend-text mono">
                  {u} · {data.urgencyCounts[u] || 0}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Response time histogram */}
        <div className="analytics-card">
          <div className="analytics-card-header">
            <span className="analytics-card-title mono">Response Time</span>
            <span className="analytics-card-sub">
              {data.assignedWithTime} matched signal
              {data.assignedWithTime === 1 ? '' : 's'}
            </span>
          </div>
          <div className="analytics-histo">
            {data.responseBuckets.map((b) => {
              const pct = (b.count / data.maxBucket) * 100;
              return (
                <div key={b.label} className="analytics-histo-col">
                  <div className="analytics-histo-bar-wrap">
                    <span
                      className="analytics-histo-bar"
                      style={{ height: `${Math.max(4, pct)}%` }}
                    >
                      <span className="analytics-histo-count mono">{b.count}</span>
                    </span>
                  </div>
                  <span className="analytics-histo-label mono">{b.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Hot zones */}
        <div className="analytics-card">
          <div className="analytics-card-header">
            <span className="analytics-card-title mono">Top Hot Zones</span>
            <span className="analytics-card-sub">By signal volume</span>
          </div>
          {data.hotZones.length === 0 ? (
            <div className="analytics-card-empty mono">No locations yet</div>
          ) : (
            <div className="analytics-bars">
              {data.hotZones.map((z) => {
                const pct = (z.total / data.maxZone) * 100;
                return (
                  <div key={z.name} className="analytics-bar-row">
                    <span
                      className="analytics-bar-label"
                      title={z.name}
                    >
                      <span className="analytics-bar-icon">📍</span>
                      <span className="analytics-zone-name">{z.name}</span>
                    </span>
                    <div className="analytics-bar-track">
                      <span
                        className="analytics-bar-fill hot"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="analytics-bar-value mono">
                      {z.total}
                      {z.critical > 0 && (
                        <span className="analytics-zone-critical">
                          {' '}· {z.critical} hi
                        </span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Language mix */}
        <div className="analytics-card">
          <div className="analytics-card-header">
            <span className="analytics-card-title mono">Language Mix</span>
            <span className="analytics-card-sub">Origin of distress</span>
          </div>
          <div className="analytics-langs">
            {data.languageMix.map((l) => (
              <div key={l.code} className="analytics-lang-chip mono">
                <span className="analytics-lang-code">{l.code.toUpperCase()}</span>
                <span className="analytics-lang-count">{l.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Volunteer leaderboard */}
        <div className="analytics-card">
          <div className="analytics-card-header">
            <span className="analytics-card-title mono">Top Responders</span>
            <span className="analytics-card-sub">Completed missions</span>
          </div>
          {data.leaderboard.length === 0 ? (
            <div className="analytics-card-empty mono">
              No assignments yet
            </div>
          ) : (
            <ol className="analytics-leaderboard">
              {data.leaderboard.map((v, i) => (
                <li key={v.id} className="analytics-leader-row">
                  <span className="analytics-leader-rank mono">{i + 1}</span>
                  <span className="analytics-leader-name">{v.name}</span>
                  <span className="analytics-leader-stats mono">
                    <span className="analytics-leader-completed accent">
                      {v.completed}
                    </span>
                    <span className="analytics-leader-divider">/</span>
                    <span>{v.assigned}</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
