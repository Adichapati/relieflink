export default function HeroSection() {
  return (
    <section className="hero-section" id="hero">
      <div className="hero-content">
        <p className="hero-eyebrow">AI-Powered Disaster Relief</p>
        <h1 className="hero-title">
          <span className="hero-title-accent">ReliefLink</span>
        </h1>
        <p className="hero-subtitle">
          Turn messy distress signals into coordinated volunteer action.
          Real-time AI extraction. Intelligent matching. One command center.
        </p>
        <button className="hero-cta" type="button">
          <span>Enter Command Center</span>
          <span style={{ fontSize: '1.1em' }}>↓</span>
        </button>
      </div>

      <div className="scroll-indicator">
        <span>Scroll to dive in</span>
        <div className="scroll-indicator-line" />
      </div>
    </section>
  );
}
