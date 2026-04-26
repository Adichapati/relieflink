import RequestCard from './RequestCard';
import { taskToCard } from '../../lib/taskAdapter';

const REVIEW_COLUMN = { key: 'review', label: 'AWAITING REVIEW', color: '#aa66ff' };
const BASE_COLUMNS = [
  { key: 'incoming', label: 'PENDING', color: '#ff3333' },
  { key: 'matched', label: 'MATCHED', color: '#ffaa00' },
  { key: 'dispatched', label: 'DISPATCHED', color: '#00cc66' },
  { key: 'resolved', label: 'RESOLVED', color: '#888888' },
];

export default function KanbanBoard({
  tasks = [],
  highlightVolunteerId = null,
  showAdminActions = false,
  showReviewColumn = false,
  onComplete = null,
  onReassign = null,
  onApprove = null,
  onAssign = null,
  onDelete = null,
  volunteers = [],
}) {
  const cards = tasks.map(taskToCard);
  const columns = showReviewColumn
    ? [REVIEW_COLUMN, ...BASE_COLUMNS]
    : BASE_COLUMNS;

  return (
    <div className={`kanban-board ${showReviewColumn ? 'with-review' : ''}`}>
      {columns.map((col) => {
        const columnCards = cards.filter((c) => c.status === col.key);
        return (
          <div key={col.key} className={`kanban-column kanban-col-${col.key}`}>
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
                  onApprove={onApprove}
                  onAssign={onAssign}
                  onDelete={onDelete}
                  volunteers={volunteers}
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
