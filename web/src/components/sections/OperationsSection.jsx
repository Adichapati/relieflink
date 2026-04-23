import { useState } from 'react';
import TacticalMap from '../map/TacticalMap';
import KanbanBoard from '../dashboard/KanbanBoard';
import AnimatedCounter from '../dashboard/AnimatedCounter';

const STATS = [
  { label: 'Active Requests', value: 7, suffix: '', accent: true },
  { label: 'Volunteers Online', value: 24, suffix: '' },
  { label: 'Match Rate', value: 86, suffix: '%', accent: true },
  { label: 'Avg Response', value: 4.2, suffix: 'm' },
];

export default function OperationsSection() {
  const [view, setView] = useState('map'); // 'map' | 'board'

  return (
    <section className="section operations-section" id="operations">
      <div className="ops-header">
        <div className="ops-header-left">
          <span className="section-eyebrow mono">03 // Operations</span>
          <h2 className="section-title">
            Command <span className="accent">Center</span>
          </h2>
        </div>

        <div className="ops-stats">
          {STATS.map((s) => (
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

      <div className="ops-content">
        {view === 'map' ? (
          <TacticalMap />
        ) : (
          <KanbanBoard />
        )}
      </div>
    </section>
  );
}
{ view === 'volunteer' && <VolunteerPortal /> }
      </div >
    </section >
  );
}
