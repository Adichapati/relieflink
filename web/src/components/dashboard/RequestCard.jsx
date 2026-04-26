import { memo, useState } from 'react';

const URGENCY_COLORS = {
  high: '#ff3333',
  medium: '#ffaa00',
  low: '#00cc66',
};

const RequestCard = memo(function RequestCard({
  request,
  highlight = false,
  showAdminActions = false,
  showVolunteerActions = false,
  onComplete = null,
  onReassign = null,
  onAccept = null,
  onDecline = null,
  onMissionComplete = null,
}) {
  const {
    id,
    type,
    location,
    urgency,
    people,
    volunteerName,
    rationale,
    rawStatus,
    timestamp,
    status,
  } = request;
  const urgencyKey = urgency || 'medium';
  const color = URGENCY_COLORS[urgencyKey] || '#888';
  const isHigh = urgencyKey === 'high';
  const shortId = String(id).slice(-4).toUpperCase();
  const [showRationale, setShowRationale] = useState(false);
  const [busy, setBusy] = useState(false);

  const isAssigned = rawStatus === 'assigned' || rawStatus === 'dispatched';
  const isComplete = rawStatus === 'completed';

  const handle = async (fn) => {
    if (!fn || busy) return;
    setBusy(true);
    try {
      await fn(id);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={`request-card ${urgencyKey} ${isHigh ? 'breathing' : ''} ${highlight ? 'mine' : ''}`}
      style={{ '--card-urgency-color': color }}
    >
      <div className="card-header">
        <span className={`card-urgency-badge ${urgencyKey}`}>
          {urgencyKey.toUpperCase()}
        </span>
        <span className="card-id mono">#{shortId}</span>
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
          <span className="card-detail-icon">🧑‍🚒</span>
          <span className="card-detail-text">
            {volunteerName ? volunteerName : 'Unassigned'}
          </span>
        </div>
      </div>

      {rationale && (
        <button
          type="button"
          className={`card-rationale-toggle mono ${showRationale ? 'open' : ''}`}
          onClick={() => setShowRationale((v) => !v)}
        >
          {showRationale ? '▼' : '▶'} Why this match?
        </button>
      )}
      {showRationale && rationale && (
        <div className="card-rationale">{rationale}</div>
      )}

      {showAdminActions && (
        <div className="card-actions">
          {isAssigned && (
            <>
              <button
                type="button"
                className="card-action complete"
                disabled={busy}
                onClick={() => handle(onComplete)}
              >
                ✓ Complete
              </button>
              <button
                type="button"
                className="card-action reassign"
                disabled={busy}
                onClick={() => handle(onReassign)}
              >
                ↻ Reassign
              </button>
            </>
          )}
          {isComplete && (
            <span className="card-action-static mono">✓ Resolved</span>
          )}
        </div>
      )}

      {showVolunteerActions && (
        <div className="card-actions">
          {rawStatus === 'assigned' && (
            <>
              <button
                type="button"
                className="card-action complete"
                disabled={busy}
                onClick={() => handle(onAccept)}
              >
                ✓ Accept
              </button>
              <button
                type="button"
                className="card-action reassign"
                disabled={busy}
                onClick={() => handle(onDecline)}
              >
                ✕ Decline
              </button>
            </>
          )}
          {rawStatus === 'dispatched' && (
            <button
              type="button"
              className="card-action complete"
              disabled={busy}
              onClick={() => handle(onMissionComplete)}
            >
              ✓ Mark Complete
            </button>
          )}
          {isComplete && (
            <span className="card-action-static mono">✓ Resolved</span>
          )}
        </div>
      )}

      <div className="card-footer">
        <span className="card-time mono">{timestamp}</span>
        <span className={`card-status ${status}`}>{status}</span>
      </div>

      {highlight && <span className="card-mine-badge mono">YOURS</span>}
    </div>
  );
});

export default RequestCard;
