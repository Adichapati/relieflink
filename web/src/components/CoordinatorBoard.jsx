import RequestCard from './RequestCard';

function Column({ title, items, onMarkComplete, onManualPromote }) {
  return (
    <div className="board-column">
      <h3>{title}</h3>
      <div className="request-stack">
        {items.length ? (
          items.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              onMarkComplete={onMarkComplete}
              onManualPromote={onManualPromote}
            />
          ))
        ) : (
          <div className="empty-state">No requests in this column yet.</div>
        )}
      </div>
    </div>
  );
}

export default function CoordinatorBoard({ requests, volunteers, onMarkComplete, onManualPromote }) {
  const pending = requests.filter((request) => request.status === 'pending');
  const assigned = requests.filter((request) => request.status === 'assigned');
  const completed = requests.filter((request) => request.status === 'completed');

  return (
    <section className="panel">
      <h2>Coordinator dashboard</h2>
      <p className="helper-text">
        This board is wired to local mock data today so the team can start the end-to-end experience immediately.
      </p>

      <div className="board-grid">
        <Column title="Pending" items={pending} onMarkComplete={onMarkComplete} onManualPromote={onManualPromote} />
        <Column title="Assigned" items={assigned} onMarkComplete={onMarkComplete} onManualPromote={onManualPromote} />
        <Column title="Completed" items={completed} onMarkComplete={onMarkComplete} onManualPromote={onManualPromote} />
      </div>

      <div className="volunteer-list">
        <strong>Seeded volunteers</strong>
        {volunteers.map((volunteer) => (
          <span key={volunteer.id}>
            {volunteer.name} — {volunteer.skills.join(', ')} — {volunteer.available ? 'available' : 'busy'}
          </span>
        ))}
      </div>
    </section>
  );
}
