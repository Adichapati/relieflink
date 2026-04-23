import { memo } from 'react';

/**
 * Request card with breathing urgency border and glitch hover.
 * Uses consistent height via flexbox layout.
 */
const RequestCard = memo(function RequestCard({ request }) {
  const { id, type, location, urgency, people, contact, status, timestamp } = request;

  const urgencyColors = {
    high: '#ff3333',
    medium: '#ffaa00',
    low: '#00cc66',
  };

  const color = urgencyColors[urgency] || '#888';
  const isHighUrgency = urgency === 'high';

  return (
    <div
      className={`request-card ${urgency} ${isHighUrgency ? 'breathing' : ''}`}
      style={{ '--card-urgency-color': color }}
    >
      <div className="card-header">
        <span className={`card-urgency-badge ${urgency}`}>
          {urgency.toUpperCase()}
        </span>
        <span className="card-id mono">#{String(id).padStart(3, '0')}</span>
      </div>

      <h4 className="card-type">{type}</h4>

      <div className="card-details">
        <div className="card-detail">
          <span className="card-detail-icon">📍</span>
          <span className="card-detail-text">{location}</span>
        </div>
        <div className="card-detail">
          <span className="card-detail-icon">👥</span>
          <span className="card-detail-text">{people || '—'}</span>
        </div>
        <div className="card-detail">
          <span className="card-detail-icon">📞</span>
          <span className="card-detail-text">{contact || '—'}</span>
        </div>
      </div>

      <div className="card-footer">
        <span className="card-time mono">{timestamp}</span>
        <span className={`card-status ${status}`}>{status}</span>
      </div>
    </div>
  );
});

export default RequestCard;
