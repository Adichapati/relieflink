import { useMemo, useState } from 'react';
import TacticalMap from '../map/TacticalMap';
import KanbanBoard from '../dashboard/KanbanBoard';
import AnimatedCounter from '../dashboard/AnimatedCounter';
import { statusToColumn } from '../../lib/taskAdapter';

function defaultStats(tasks) {
  const total = tasks.length;
  const active = tasks.filter((t) => statusToColumn(t.status) !== 'resolved').length;
  const matched = tasks.filter((t) => statusToColumn(t.status) === 'matched').length;
  const matchRate = total > 0 ? Math.round((matched / total) * 100) : 0;
  const review = tasks.filter((t) => t.status === 'needs_review').length;
  return [
    { label: 'Active Requests', value: active, suffix: '', accent: true },
    { label: 'Matched', value: matched, suffix: '' },
    { label: 'Match Rate', value: matchRate, suffix: '%', accent: true },
    { label: 'Needs Review', value: review, suffix: '' },
  ];
}

export default function OperationsSection({
  tasks = [],
  highlightVolunteerId = null,
  title = 'Command',
  titleAccent = 'Center',
  eyebrow = '03 // Operations',
  stats = null,
  defaultView = 'map',
  onAutoMatch = null,
  autoMatching = false,
  showAdminActions = false,
  onComplete = null,
  onReassign = null,
  onDemoMode = null,
  demoStep = 0,
  demoTotal = 5,
}) {
  const [view, setView] = useState(defaultView);
  const computedStats = useMemo(() => stats || defaultStats(tasks), [stats, tasks]);
  const pendingCount = tasks.filter((t) => t.status === 'pending' || t.status === 'needs_review').length;

  return (
    <section className="section operations-section" id="operations">
      <div className="ops-header">
        <div className="ops-header-left">
          <span className="section-eyebrow mono">{eyebrow}</span>
          <h2 className="section-title">
            {title} <span className="accent">{titleAccent}</span>
          </h2>
        </div>

        <div className="ops-stats">
          {computedStats.map((s) => (
            <div key={s.label} className="ops-stat">
              <span className={`ops-stat-value mono ${s.accent ? 'accent' : ''}`}>
                <AnimatedCounter value={s.value} suffix={s.suffix} />
              </span>
              <span className="ops-stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="ops-controls">
        <div className="ops-tabs">
          <button
            className={`ops-tab ${view === 'map' ? 'active' : ''}`}
            onClick={() => setView('map')}
          >
            <span className="tab-dot" /> Tactical Map
          </button>
          <button
            className={`ops-tab ${view === 'board' ? 'active' : ''}`}
            onClick={() => setView('board')}
          >
            <span className="tab-dot" /> Request Board
          </button>
        </div>

        <div className="ops-action-group">
          {onDemoMode && (
            <button
              className="demo-mode-btn"
              type="button"
              onClick={onDemoMode}
              disabled={demoStep > 0}
            >
              <span className="btn-icon">▶</span>
              {demoStep > 0
                ? `Streaming ${demoStep}/${demoTotal}…`
                : 'Demo Mode'}
            </button>
          )}
          {onAutoMatch && (
            <button
              className="auto-match-btn"
              type="button"
              onClick={onAutoMatch}
              disabled={autoMatching || pendingCount === 0}
            >
              <span className="btn-icon">⚡</span>
              {autoMatching
                ? 'Matching…'
                : pendingCount > 0
                  ? `Auto-Match ${pendingCount} Pending`
                  : 'No Pending'}
            </button>
          )}
        </div>
      </div>

      <div className="ops-content">
        {view === 'map' ? (
          <TacticalMap tasks={tasks} />
        ) : (
          <KanbanBoard
            tasks={tasks}
            highlightVolunteerId={highlightVolunteerId}
            showAdminActions={showAdminActions}
            onComplete={onComplete}
            onReassign={onReassign}
          />
        )}
      </div>
    </section>
  );
}
