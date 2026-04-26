export default function HeroSection({
  eyebrow = 'AI-Powered Disaster Relief',
  title = 'ReliefLink',
  subtitle = 'Turn messy distress signals into coordinated volunteer action. Real-time AI extraction. Intelligent matching. One command center.',
  ctaLabel = 'Enter Command Center',
  scrollTargetId = 'intake',
}) {
  const handleCta = () => {
    const target = scrollTargetId
      ? document.getElementById(scrollTargetId)
      : null;
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
    }
  };

  return (
    <section className="hero-section" id="hero">
      <div className="hero-content">
        <p className="hero-eyebrow">{eyebrow}</p>
        <h1 className="hero-title">
          <span className="hero-title-accent">{title}</span>
        </h1>
        <p className="hero-subtitle">{subtitle}</p>
        <button className="hero-cta" type="button" onClick={handleCta}>
          <span>{ctaLabel}</span>
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
