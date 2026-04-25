import { useEffect, useState } from "react";

function normalizeTask(task) {
  return {
    id: task.id,
    rawText: task.raw_text || task.rawText,
    category: task.category,
    urgency: task.urgency,
    locationText: task.location_text || task.locationText,
    quantityOrDetails: task.quantity_details || task.quantityOrDetails,
    confidence:
      typeof task.confidence === "number"
        ? task.confidence < 0.6
          ? "review"
          : "high"
        : task.confidence,
    status: task.status,
    assignedVolunteerId: task.assigned_volunteer_id || task.assignedVolunteerId,
    assignedVolunteerName:
      task.assigned_volunteer_name || task.assignedVolunteerName,
    assignmentRationale: task.assignment_rationale || task.assignmentRationale,
    createdAt: task.created_at || task.createdAt,
    assignedAt: task.assigned_at || task.assignedAt,
    completedAt: task.completed_at || task.completedAt,
  };
}

export default function VolunteerDashboard({ profile }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    setLoading(true);
    const response = await fetch("http://localhost:8787/tasks");
    if (response.ok) {
      const data = await response.json();
      setTasks(data.map(normalizeTask));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const myTasks = tasks.filter(
    (task) => task.assignedVolunteerId === profile.firebaseUid,
  );

  return (
    <div className="page-shell">
      <section className="panel">
        <p className="eyebrow">Volunteer dashboard</p>
        <h1>Welcome, {profile.name}</h1>
        <p className="helper-text">
          Your assigned tasks will appear below once the admin or matching
          service allocates them.
        </p>
      </section>

      <section className="workspace-grid">
        <section className="panel">
          <h2>Your assigned tasks</h2>
          {loading ? (
            <p>Loading tasks…</p>
          ) : myTasks.length ? (
            myTasks.map((task) => (
              <article key={task.id} className="request-card">
                <p>{task.rawText}</p>
                <div className="field-list">
                  <span>
                    <strong>Category:</strong> {task.category}
                  </span>
                  <span>
                    <strong>Location:</strong> {task.locationText}
                  </span>
                  <span>
                    <strong>Details:</strong> {task.quantityOrDetails}
                  </span>
                  <span>
                    <strong>Status:</strong> {task.status}
                  </span>
                </div>
              </article>
            ))
          ) : (
            <p>No assigned tasks yet.</p>
          )}
        </section>
      </section>
    </div>
  );
}
