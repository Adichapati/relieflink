import { useMemo, useState } from 'react';
import RequestForm from './components/RequestForm';
import CoordinatorBoard from './components/CoordinatorBoard';
import MetricCard from './components/MetricCard';
import { seedRequests, seedVolunteers } from './lib/demoData';
import { extractRequestFields } from './lib/extractionMock';
import { matchAllRequests } from './lib/matching';

function createRequestFromText(rawText) {
  const extracted = extractRequestFields(rawText);
  return {
    id: crypto.randomUUID(),
    rawText,
    ...extracted,
    status: 'pending',
    assignedVolunteerId: null,
    assignedVolunteerName: null,
    assignmentRationale: null,
    createdAt: Date.now(),
    assignedAt: null,
    completedAt: null,
  };
}

export default function App() {
  const [volunteers, setVolunteers] = useState(seedVolunteers);
  const [requests, setRequests] = useState(seedRequests.map(createRequestFromText));

  const metrics = useMemo(() => {
    const assigned = requests.filter((req) => req.status === 'assigned' || req.status === 'completed');
    const completed = requests.filter((req) => req.status === 'completed');
    const assignmentDurations = assigned
      .filter((req) => req.assignedAt)
      .map((req) => req.assignedAt - req.createdAt);
    const averageAssignmentSeconds = assignmentDurations.length
      ? Math.round(assignmentDurations.reduce((sum, value) => sum + value, 0) / assignmentDurations.length / 1000)
      : 0;

    return {
      total: requests.length,
      assigned: assigned.length,
      completed: completed.length,
      avgAssignmentSeconds: averageAssignmentSeconds,
    };
  }, [requests]);

  const handleSubmitRequest = (rawText) => {
    const nextRequest = createRequestFromText(rawText);
    setRequests((current) => [nextRequest, ...current]);
  };

  const handleMatchPending = () => {
    const result = matchAllRequests(requests, volunteers);
    setRequests(result.requests);
    setVolunteers(result.volunteers);
  };

  const handleMarkComplete = (requestId) => {
    setRequests((current) =>
      current.map((request) =>
        request.id === requestId
          ? { ...request, status: 'completed', completedAt: Date.now() }
          : request
      )
    );
  };

  const handleManualPromote = (requestId) => {
    setRequests((current) =>
      current.map((request) =>
        request.id === requestId ? { ...request, confidence: 'reviewed' } : request
      )
    );
  };

  return (
    <div className="page-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Hackathon MVP</p>
          <h1>ReliefLink</h1>
          <p className="hero-copy">
            Turn messy disaster-help messages into structured requests and match the best volunteer in seconds.
          </p>
        </div>
        <button className="primary-button" onClick={handleMatchPending}>
          Match pending requests
        </button>
      </header>

      <section className="metrics-grid">
        <MetricCard label="Total requests" value={metrics.total} />
        <MetricCard label="Assigned" value={metrics.assigned} />
        <MetricCard label="Completed" value={metrics.completed} />
        <MetricCard label="Avg assignment time" value={`${metrics.avgAssignmentSeconds}s`} />
      </section>

      <section className="workspace-grid">
        <RequestForm onSubmit={handleSubmitRequest} />
        <CoordinatorBoard
          requests={requests}
          volunteers={volunteers}
          onMarkComplete={handleMarkComplete}
          onManualPromote={handleManualPromote}
        />
      </section>
    </div>
  );
}
