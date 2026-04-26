import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, profile } = useContext(AuthContext);

  useEffect(() => {
    if (user && profile) {
      navigate('/dashboard');
    }
  }, [user, profile, navigate]);

  return (
    <>
      <div className="star-field" />

      <div className="landing-shell">
        <header className="landing-nav">
          <div className="navbar-brand">
            Relief<span>Link</span>
          </div>
          <div className="landing-nav-actions">
            <button
              type="button"
              className="btn-ghost"
              onClick={() => navigate('/auth?mode=login')}
            >
              Log in
            </button>
            <button
              type="button"
              className="btn-accent"
              onClick={() => navigate('/auth?mode=signup')}
            >
              <span>Get started</span>
              <span style={{ fontSize: '1.05em' }}>→</span>
            </button>
          </div>
        </header>

        <section className="landing-hero">
          <p className="hero-eyebrow">AI-Powered Disaster Relief</p>
          <h1 className="landing-title">
            Turn distress signals into
            <span className="hero-title-accent"> coordinated action</span>
          </h1>
          <p className="landing-subtitle">
            ReliefLink decodes messy field reports with Gemini, geocodes them onto a tactical map,
            and matches each request to the nearest qualified volunteer — automatically.
          </p>

          <div className="landing-cta-row">
            <button
              type="button"
              className="btn-accent landing-cta"
              onClick={() => navigate('/auth?mode=signup')}
            >
              <span className="btn-icon">⚡</span>
              <span>Join the network</span>
            </button>
            <button
              type="button"
              className="btn-ghost landing-cta"
              onClick={() => navigate('/auth?mode=login')}
            >
              I already have an account
            </button>
          </div>
        </section>

        <section className="landing-features">
          <div className="landing-feature">
            <span className="landing-feature-num mono">01</span>
            <h3>Decode</h3>
            <p>Paste raw distress text. Gemini extracts type, urgency, location, and quantity in seconds.</p>
          </div>
          <div className="landing-feature">
            <span className="landing-feature-num mono">02</span>
            <h3>Match</h3>
            <p>Available volunteers are scored against the request. The best match is dispatched automatically.</p>
          </div>
          <div className="landing-feature">
            <span className="landing-feature-num mono">03</span>
            <h3>Coordinate</h3>
            <p>One command center. Live kanban, geocoded tactical map, instant volunteer status.</p>
          </div>
        </section>
      </div>
    </>
  );
}
