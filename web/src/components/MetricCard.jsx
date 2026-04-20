export default function MetricCard({ label, value }) {
  return (
    <article className="metric-card">
      <span className="metric-label">{label}</span>
      <div className="metric-value">{value}</div>
    </article>
  );
}
