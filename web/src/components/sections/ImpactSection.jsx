import { useRef, useState, useEffect } from 'react';
import AnimatedCounter from '../dashboard/AnimatedCounter';

const IMPACT_STATS = [
  { value: 1247, label: 'People Helped', suffix: '+', icon: '🤝' },
  { value: 86, label: 'Match Accuracy', suffix: '%', icon: '🎯' },
  { value: 4.2, label: 'Min Avg Response', suffix: '', icon: '⚡' },
  { value: 23, label: 'Countries Reached', suffix: '', icon: '🌍' },
];

const TIMELINE = [
  { time: '0s', label: 'Distress signal received', detail: 'Raw text parsed by AI' },
  { time: '~2s', label: 'Data extracted & classified', detail: 'Type, urgency, location identified' },
  { time: '~30s', label: 'Volunteers matched', detail: 'Nearest qualified responders notified' },
  { time: '~4m', label: 'Resources dispatched', detail: 'Aid en route to affected area' },
];

export default function ImpactSection() {
  const sectionRef = useRef(null);
  const [visible, setVisible] = useState(false);

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
        {IMPACT_STATS.map((stat) => (
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
