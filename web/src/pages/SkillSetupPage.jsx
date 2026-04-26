import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { geocodeLocation } from '../lib/taskAdapter';

const API_BASE = 'http://localhost:8787';

const SUGGESTED_SKILLS = [
  'medical', 'logistics', 'transport', 'food prep',
  'translation', 'first aid', 'shelter', 'communications',
];

export default function SkillSetupPage() {
  const { user, setProfile } = useContext(AuthContext);
  const navigate = useNavigate();
  const [name, setName] = useState(user?.displayName ?? '');
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [locationText, setLocationText] = useState('');
  const [coords, setCoords] = useState(null); // { lat, lng, source: 'gps' | 'city' }
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);
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

  const useMyLocation = () => {
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported in this browser');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          source: 'gps',
        });
        setLocationText('Current location');
        setLocating(false);
      },
      (err) => {
        setLocationError(err.message || 'Could not access location');
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  };

  const handleCityChange = (text) => {
    setLocationText(text);
    setLocationError(null);
    // Live preview: if the city matches our dictionary, show resolved coords.
    // Backend has the same dictionary as authoritative fallback.
    const match = geocodeLocation(text);
    if (match) {
      setCoords({ lat: match[0], lng: match[1], source: 'city' });
    } else if (coords?.source === 'city') {
      setCoords(null);
    }
  };

  const clearLocation = () => {
    setCoords(null);
    setLocationText('');
    setLocationError(null);
  };

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
          skills,
          lat: coords?.lat ?? null,
          lng: coords?.lng ?? null,
          location_text: locationText || null,
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
          <h1 className="auth-title">Join as a volunteer</h1>
          <p className="landing-subtitle" style={{ marginBottom: 'var(--space-xl)' }}>
            You'll receive matched relief missions and can also report new
            distress signals from the field. Coordinator (admin) accounts are
            issued out of band — log in with existing credentials if you have one.
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

            <div className="role-locked-card">
              <span className="role-locked-icon">🧑‍🚒</span>
              <div className="role-locked-body">
                <span className="role-locked-title">Volunteer</span>
                <span className="role-locked-sub mono">FIELD OPERATIVE</span>
              </div>
              <span className="role-locked-badge mono">Default role</span>
            </div>

            {true && (
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

            <div className="auth-field">
              <span className="auth-label mono">
                BASE LOCATION{' '}
                <span className="auth-label-hint">— powers distance matching</span>
              </span>

              <div className="loc-actions">
                <button
                  type="button"
                  className="loc-gps-btn"
                  onClick={useMyLocation}
                  disabled={locating}
                >
                  <span className="loc-gps-icon">{locating ? '◌' : '🛰'}</span>
                  <span>
                    {locating ? 'Locating…' : 'Use my current location'}
                  </span>
                </button>
                <span className="loc-or mono">OR</span>
                <input
                  className="auth-input loc-city-input"
                  value={
                    coords?.source === 'gps' ? '' : locationText
                  }
                  onChange={(e) => handleCityChange(e.target.value)}
                  placeholder="City or area (e.g. Bangalore)"
                  disabled={coords?.source === 'gps'}
                />
              </div>

              {coords && (
                <div className="loc-preview">
                  <span className="loc-preview-dot" />
                  <span className="loc-preview-label mono">
                    {coords.source === 'gps' ? 'GPS' : 'CITY'}
                  </span>
                  <span className="loc-preview-text">
                    {coords.source === 'gps'
                      ? 'Using current device location'
                      : locationText}
                  </span>
                  <span className="loc-preview-coords mono">
                    {coords.lat.toFixed(2)}, {coords.lng.toFixed(2)}
                  </span>
                  <button
                    type="button"
                    className="loc-clear"
                    onClick={clearLocation}
                  >
                    ×
                  </button>
                </div>
              )}

              {locationError && (
                <div className="loc-error mono">⚠ {locationError}</div>
              )}
              {!coords && !locationError && (
                <span className="loc-hint mono">
                  Optional, but volunteers with a location get matched faster.
                </span>
              )}
            </div>

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
