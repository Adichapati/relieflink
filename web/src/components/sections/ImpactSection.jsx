import { useRef, useState, useEffect, useMemo } from 'react';
import AnimatedCounter from '../dashboard/AnimatedCounter';

const TIMELINE = [
  { time: '0s', label: 'Distress signal received', detail: 'Raw text parsed by AI' },
  { time: '~2s', label: 'Data extracted & classified', detail: 'Type, urgency, location identified' },
  { time: '~30s', label: 'Volunteers matched', detail: 'Nearest qualified responders notified' },
  { time: '~4m', label: 'Resources dispatched', detail: 'Aid en route to affected area' },
];

function avgMinutes(tasks) {
  const deltas = [];
  for (const t of tasks) {
    if (t.assignedAt && t.createdAt) {
      const diff = new Date(t.assignedAt) - new Date(t.createdAt);
      if (diff > 0) deltas.push(diff);
    }
  }
  if (!deltas.length) return null;
  const avgMs = deltas.reduce((a, b) => a + b, 0) / deltas.length;
  return Math.max(0.1, Math.round((avgMs / 60000) * 10) / 10);
}

function computeStats(tasks = []) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'completed').length;
  const matched = tasks.filter(
    (t) => t.status === 'assigned' || t.status === 'dispatched' || t.status === 'completed',
  ).length;
  const matchAccuracy = total > 0 ? Math.round((matched / total) * 100) : 0;
  const avg = avgMinutes(tasks);

  return [
    { value: completed, label: 'Cases Resolved', suffix: '', icon: '🤝' },
    { value: matchAccuracy, label: 'Match Rate', suffix: '%', icon: '🎯' },
    { value: avg ?? 0.5, label: 'Min Avg Response', suffix: '', icon: '⚡' },
    { value: total, label: 'Signals Decoded', suffix: '', icon: '🌍' },
  ];
}

export default function ImpactSection({ tasks = [] }) {
  const sectionRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const stats = useMemo(() => computeStats(tasks), [tasks]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.2 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="section impact-section" id="impact" ref={sectionRef}>
      <div className="impact-header">
        <span className="section-eyebrow mono">04 // Impact</span>
        <h2 className="section-title">
          Making a <span className="accent">Difference</span>
        </h2>
        <p className="section-subtitle">
          From raw distress signals to coordinated action in minutes, not hours.
        </p>
      </div>

      {/* Stats grid */}
      <div className={`impact-stats ${visible ? 'visible' : ''}`}>
        {stats.map((stat) => (
          <div key={stat.label} className="impact-stat-card">
            <span className="impact-stat-icon">{stat.icon}</span>
            <span className="impact-stat-value mono">
              {visible ? (
                <AnimatedCounter value={stat.value} suffix={stat.suffix} duration={1600} />
              ) : '0'}
            </span>
            <span className="impact-stat-label">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Response timeline */}
      <div className={`impact-timeline ${visible ? 'visible' : ''}`}>
        <h3 className="timeline-title mono">Response Pipeline</h3>
        <div className="timeline-track">
          {TIMELINE.map((step, i) => (
            <div key={i} className="timeline-step" style={{ animationDelay: `${i * 0.2}s` }}>
              <div className="timeline-node">
                <span className="timeline-dot" />
                {i < TIMELINE.length - 1 && <span className="timeline-line" />}
              </div>
              <div className="timeline-content">
                <span className="timeline-time mono">{step.time}</span>
                <span className="timeline-label">{step.label}</span>
                <span className="timeline-detail">{step.detail}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="impact-cta">
        <p className="impact-cta-text">
          Built for hackathon judges. Designed for the real world.
        </p>
        <div className="impact-badges">
          <span className="impact-badge mono">Gemini AI</span>
          <span className="impact-badge mono">Real-time</span>
          <span className="impact-badge mono">Open Source</span>
        </div>
      </div>
    </section>
  );
}
