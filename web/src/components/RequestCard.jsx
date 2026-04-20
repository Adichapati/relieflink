function urgencyClassName(urgency) {
  if (urgency === 'high') return 'badge badge-high';
  if (urgency === 'medium') return 'badge badge-medium';
  return 'badge badge-low';
}

export default function RequestCard({ request, onMarkComplete, onManualPromote }) {
  return (
    <article className="request-card">
      <p>{request.rawText}</p>
      <div className="request-meta">
        <span className={urgencyClassName(request.urgency)}>{request.urgency} urgency</span>
        <span className={`badge ${request.confidence === 'review' ? 'badge-review' : 'badge-reviewed'}`}>
          confidence: {request.confidence}
        </span>
      </div>
      <div className="field-list">
        <span><strong>Category:</strong> {request.category}</span>
        <span><strong>Location:</strong> {request.locationText}</span>
        <span><strong>Details:</strong> {request.quantityOrDetails}</span>
        {request.assignedVolunteerName ? (
          <span><strong>Assigned:</strong> {request.assignedVolunteerName}</span>
        ) : null}
        {request.assignmentRationale ? (
          <span><strong>Why this match:</strong> {request.assignmentRationale}</span>
        ) : null}
      </div>
      <div className="request-actions">
        {request.confidence === 'review' ? (
          <button className="secondary-button" onClick={() => onManualPromote(request.id)}>
            Mark reviewed
          </button>
        ) : null}
        {request.status === 'assigned' ? (
          <button className="primary-button" onClick={() => onMarkComplete(request.id)}>
            Mark complete
          </button>
        ) : null}
      </div>
    </article>
  );
}
