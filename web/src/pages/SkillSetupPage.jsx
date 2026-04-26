import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';

const API_BASE = 'http://localhost:8787';

const SUGGESTED_SKILLS = [
  'medical', 'logistics', 'transport', 'food prep',
  'translation', 'first aid', 'shelter', 'communications',
];

export default function SkillSetupPage() {
  const { user, setProfile } = useContext(AuthContext);
  const navigate = useNavigate();
  const [role, setRole] = useState('VOLUNTEER');
  const [name, setName] = useState(user?.displayName ?? '');
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (!user) {
    navigate('/auth?mode=login');
    return null;
  }

  const addSkill = (raw) => {
    const trimmed = raw.trim().toLowerCase();
    if (!trimmed || skills.includes(trimmed)) return;
    setSkills((prev) => [...prev, trimmed]);
    setSkillInput('');
  };

  const removeSkill = (s) => setSkills((prev) => prev.filter((x) => x !== s));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch(`${API_BASE}/add-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebaseUid: user.uid,
          email: user.email,
          name: name || 'Relief volunteer',
          role,
          skills,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Failed to save profile');
      }

      const profile = await response.json();
      setProfile(profile);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="star-field" />

      <div className="auth-shell">
        <div className="auth-card auth-card-wide">
          <p className="hero-eyebrow">Profile setup</p>
          <h1 className="auth-title">Configure your role</h1>
          <p className="landing-subtitle" style={{ marginBottom: 'var(--space-xl)' }}>
            This determines whether you'll triage incoming signals or be dispatched to them.
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="auth-field">
              <span className="auth-label mono">DISPLAY NAME</span>
              <input
                className="auth-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
              />
            </label>

            <div className="auth-field">
              <span className="auth-label mono">ROLE</span>
              <div className="role-toggle">
                <button
                  type="button"
                  className={`role-option ${role === 'VOLUNTEER' ? 'active' : ''}`}
                  onClick={() => setRole('VOLUNTEER')}
                >
                  <span className="role-option-title">Volunteer</span>
                  <span className="role-option-sub mono">Receive missions</span>
                </button>
                <button
                  type="button"
                  className={`role-option ${role === 'ADMIN' ? 'active' : ''}`}
                  onClick={() => setRole('ADMIN')}
                >
                  <span className="role-option-title">Admin</span>
                  <span className="role-option-sub mono">Coordinate response</span>
                </button>
              </div>
            </div>

            {role === 'VOLUNTEER' && (
              <div className="auth-field">
                <span className="auth-label mono">SKILLS</span>
                <div className="skill-chip-row">
                  {skills.map((s) => (
                    <button
                      type="button"
                      key={s}
                      className="skill-pill mono active"
                      onClick={() => removeSkill(s)}
                    >
                      {s} ×
                    </button>
                  ))}
                </div>
                <input
                  className="auth-input"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      addSkill(skillInput);
                    }
                  }}
                  placeholder="Type a skill, press Enter"
                />
                <div className="skill-chip-row" style={{ marginTop: 'var(--space-sm)' }}>
                  {SUGGESTED_SKILLS.filter((s) => !skills.includes(s)).map((s) => (
                    <button
                      type="button"
                      key={s}
                      className="skill-pill mono"
                      onClick={() => addSkill(s)}
                    >
                      + {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && <div className="auth-error mono">⚠ {error}</div>}

            <button
              className="btn-accent auth-submit"
              type="submit"
              disabled={submitting}
            >
              <span className="btn-icon">⚡</span>
              <span>{submitting ? 'Saving…' : 'Enter command center'}</span>
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
