import RequestCard from './RequestCard';

const COLUMNS = [
  { key: 'incoming', label: 'INCOMING', color: '#ff3333' },
  { key: 'matched', label: 'MATCHED', color: '#ffaa00' },
  { key: 'dispatched', label: 'DISPATCHED', color: '#00cc66' },
  { key: 'resolved', label: 'RESOLVED', color: '#888888' },
];

const REQUESTS = [
  {
    id: 1, type: 'Food & Water', location: 'Bangalore, India', urgency: 'high',
    people: '~200 families', contact: 'Priya — 9876543210',
    status: 'incoming', timestamp: '2m ago',
  },
  {
    id: 2, type: 'Medical Supplies', location: 'Delhi, India', urgency: 'medium',
    people: '~80 people', contact: 'Raj — 9123456789',
    status: 'incoming', timestamp: '5m ago',
  },
  {
    id: 3, type: 'Emergency Shelter', location: 'Lagos, Nigeria', urgency: 'high',
    people: '~500 families', contact: 'Adewale — +234 801 2345',
    status: 'matched', timestamp: '8m ago',
  },
  {
    id: 4, type: 'Water Purification', location: 'Nairobi, Kenya', urgency: 'medium',
    people: '~120 people', contact: 'Wanjiku — +254 712 345',
    status: 'matched', timestamp: '12m ago',
  },
  {
    id: 5, type: 'Volunteer Coordination', location: 'Cairo, Egypt', urgency: 'low',
    people: null, contact: 'Ahmed — +20 100 2345',
    status: 'dispatched', timestamp: '18m ago',
  },
  {
    id: 6, type: 'Flood Relief', location: 'São Paulo, Brazil', urgency: 'high',
    people: '~350 families', contact: 'Maria — +55 11 98765',
    status: 'dispatched', timestamp: '22m ago',
  },
  {
    id: 7, type: 'Logistics Hub', location: 'Paris, France', urgency: 'low',
    people: null, contact: 'Jean — +33 6 12 34',
    status: 'resolved', timestamp: '1h ago',
  },
];

export default function KanbanBoard() {
  return (
    <div className="kanban-board">
      {COLUMNS.map((col) => {
        const cards = REQUESTS.filter((r) => r.status === col.key);
        return (
          <div key={col.key} className="kanban-column">
            <div className="kanban-col-header">
              <span className="kanban-col-dot" style={{ background: col.color }} />
              <span className="kanban-col-label mono">{col.label}</span>
              <span className="kanban-col-count mono">{cards.length}</span>
            </div>
            <div className="kanban-col-cards">
              {cards.map((r) => (
                <RequestCard key={r.id} request={r} />
              ))}
              {cards.length === 0 && (
                <div className="kanban-empty mono">No requests</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
