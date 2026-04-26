import { memo, useEffect, useRef, useState } from 'react';

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
  volunteers = [],
  onComplete = null,
  onReassign = null,
  onAccept = null,
  onDecline = null,
  onMissionComplete = null,
  onApprove = null,
  onAssign = null,
  onDelete = null,
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
  const [showAssignPicker, setShowAssignPicker] = useState(false);
  const pickerRef = useRef(null);

  const isAwaitingReview =
    rawStatus === 'needs_approval' || rawStatus === 'needs_review';
  const isPending = rawStatus === 'pending';
  const isAssigned = rawStatus === 'assigned' || rawStatus === 'dispatched';
  const isComplete = rawStatus === 'completed';

  // Close the picker when clicking outside
  useEffect(() => {
    if (!showAssignPicker) return;
    const onClick = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowAssignPicker(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [showAssignPicker]);

  const handle = async (fn, ...args) => {
    if (!fn || busy) return;
    setBusy(true);
    try {
      await fn(id, ...args);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || busy) return;
    if (!window.confirm('Delete this signal? This cannot be undone.')) return;
    handle(onDelete);
  };

  const handlePickVolunteer = async (vId) => {
    setShowAssignPicker(false);
    handle(onAssign, vId);
  };

  const availableVolunteers = volunteers.filter(
    (v) => v.status === 'available',
  );

  return (
    <div
      className={`request-card ${urgencyKey} ${isHigh ? 'breathing' : ''} ${highlight ? 'mine' : ''} ${isAwaitingReview ? 'awaiting-review' : ''}`}
      style={{ '--card-urgency-color': color }}
    >
      <div className="card-header">
        <span className={`card-urgency-badge ${urgencyKey}`}>
          {urgencyKey.toUpperCase()}
        </span>
        {isAwaitingReview && (
          <span className="card-review-badge mono">REVIEW</span>
        )}
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
          {isAwaitingReview && (
            <>
              <button
                type="button"
                className="card-action approve"
                disabled={busy}
                onClick={() => handle(onApprove)}
              >
                ✓ Approve
              </button>
              <button
                type="button"
                className="card-action delete"
                disabled={busy}
                onClick={handleDelete}
              >
                🗑 Delete
              </button>
            </>
          )}

          {isPending && (
            <>
              <div className="card-assign-wrap" ref={pickerRef}>
                <button
                  type="button"
                  className="card-action assign"
                  disabled={busy}
                  onClick={() => setShowAssignPicker((v) => !v)}
                >
                  👤 Assign…
                </button>
                {showAssignPicker && (
                  <div className="card-assign-picker">
                    <div className="picker-header mono">
                      Available volunteers ({availableVolunteers.length})
                    </div>
                    {availableVolunteers.length === 0 && (
                      <div className="picker-empty mono">
                        No volunteers available
                      </div>
                    )}
                    {availableVolunteers.map((v) => (
                      <button
                        type="button"
                        key={v.id}
                        className="picker-item"
                        onClick={() => handlePickVolunteer(v.id)}
                      >
                        <span className="picker-name">{v.name || v.email}</span>
                        {v.skills?.length > 0 && (
                          <span className="picker-skills mono">
                            {v.skills.slice(0, 3).join(' · ')}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                className="card-action delete"
                disabled={busy}
                onClick={handleDelete}
              >
                🗑 Delete
              </button>
            </>
          )}

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
