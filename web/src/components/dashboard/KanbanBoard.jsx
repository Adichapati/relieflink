import RequestCard from './RequestCard';
import { taskToCard } from '../../lib/taskAdapter';

const COLUMNS = [
  { key: 'incoming', label: 'INCOMING', color: '#ff3333' },
  { key: 'matched', label: 'MATCHED', color: '#ffaa00' },
  { key: 'dispatched', label: 'DISPATCHED', color: '#00cc66' },
  { key: 'resolved', label: 'RESOLVED', color: '#888888' },
];

export default function KanbanBoard({
  tasks = [],
  highlightVolunteerId = null,
  showAdminActions = false,
  onComplete = null,
  onReassign = null,
}) {
  const cards = tasks.map(taskToCard);

  return (
    <div className="kanban-board">
      {COLUMNS.map((col) => {
        const columnCards = cards.filter((c) => c.status === col.key);
        return (
          <div key={col.key} className="kanban-column">
            <div className="kanban-col-header">
              <span className="kanban-col-dot" style={{ background: col.color }} />
              <span className="kanban-col-label mono">{col.label}</span>
              <span className="kanban-col-count mono">{columnCards.length}</span>
            </div>
            <div className="kanban-col-cards">
              {columnCards.map((c) => (
                <RequestCard
                  key={c.id}
                  request={c}
                  highlight={
                    highlightVolunteerId &&
                    c.raw?.assignedVolunteerId === highlightVolunteerId
                  }
                  showAdminActions={showAdminActions}
                  onComplete={onComplete}
                  onReassign={onReassign}
                />
              ))}
              {columnCards.length === 0 && (
                <div className="kanban-empty mono">No requests</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
