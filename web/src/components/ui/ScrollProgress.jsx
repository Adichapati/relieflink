export default function ScrollProgress({ progress = 0 }) {
  return (
    <div
      className="scroll-progress"
      style={{ width: `${progress * 100}%` }}
    />
  );
}
