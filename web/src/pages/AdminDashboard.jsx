import { useEffect, useState } from "react";
import RequestForm from "../components/RequestForm";
import CoordinatorBoard from "../components/CoordinatorBoard";

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

export default function AdminDashboard() {
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

  const handleMatchPending = async () => {
    const pendingTasks = tasks.filter((task) => task.status === "pending");
    await Promise.all(
      pendingTasks.map((task) =>
        fetch("http://localhost:8787/match-request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ requestId: task.id }),
        }),
      ),
    );
    fetchTasks();
  };

  const handleSubmitRequest = async (rawText) => {
    try {
      const response = await fetch("http://localhost:8787/extract-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: rawText }),
      });

      if (response.ok) {
        fetchTasks(); // Refresh the tasks list
      } else {
        console.error("Failed to submit request");
      }
    } catch (error) {
      console.error("Error submitting request:", error);
    }
  };

  return (
    <div className="page-shell">
      <section className="panel">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <p className="eyebrow">Admin dashboard</p>
            <h1>Review tasks and run matching</h1>
          </div>
          <button
            className="primary-button"
            onClick={handleMatchPending}
            disabled={loading}
          >
            Match pending requests
          </button>
        </div>
      </section>

      <section className="workspace-grid">
        {loading ? (
          <section className="panel">Loading tasks...</section>
        ) : (
          <>
            <RequestForm onSubmit={handleSubmitRequest} />
            <CoordinatorBoard
              requests={tasks}
              volunteers={[]}
              onMarkComplete={() => {}}
              onManualPromote={() => {}}
            />
          </>
        )}
      </section>
    </div>
  );
}
