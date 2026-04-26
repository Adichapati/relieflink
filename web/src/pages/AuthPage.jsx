import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth } from '../firebaseClient';

const API_BASE = 'http://localhost:8787';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const requested = searchParams.get('mode');
    if (requested === 'signup' || requested === 'login') {
      setMode(requested);
    }
  }, [searchParams]);

  const routeAfterLogin = async (uid) => {
    const response = await fetch(`${API_BASE}/user/${uid}`);
    navigate(response.ok ? '/dashboard' : '/setup');
  };

  const handleSignup = async (event) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate('/setup');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      await routeAfterLogin(credential.user.uid);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await routeAfterLogin(result.user.uid);
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
        <button
          type="button"
          className="auth-back"
          onClick={() => navigate('/')}
        >
          ← Back
        </button>

        <div className="auth-card">
          <p className="hero-eyebrow">
            {mode === 'signup' ? 'Create an account' : 'Welcome back'}
          </p>
          <h1 className="auth-title">
            {mode === 'signup' ? 'Join ReliefLink' : 'Sign in to ReliefLink'}
          </h1>

          <form
            className="auth-form"
            onSubmit={mode === 'signup' ? handleSignup : handleLogin}
          >
            {mode === 'signup' && (
              <label className="auth-field">
                <span className="auth-label mono">NAME</span>
                <input
                  className="auth-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                />
              </label>
            )}

            <label className="auth-field">
              <span className="auth-label mono">EMAIL</span>
              <input
                className="auth-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@relieflink.app"
                required
              />
            </label>

            <label className="auth-field">
              <span className="auth-label mono">PASSWORD</span>
              <input
                className="auth-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </label>

            {error && <div className="auth-error mono">⚠ {error}</div>}

            <button
              className="btn-accent auth-submit"
              type="submit"
              disabled={submitting}
            >
              <span className="btn-icon">⚡</span>
              <span>
                {submitting
                  ? 'Working…'
                  : mode === 'signup'
                    ? 'Create account'
                    : 'Sign in'}
              </span>
            </button>

            <div className="auth-divider mono">OR</div>

            <button
              type="button"
              className="auth-google"
              onClick={handleGoogleSignIn}
              disabled={submitting}
            >
              Continue with Google
            </button>

            <button
              type="button"
              className="auth-toggle"
              onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}
            >
              {mode === 'signup'
                ? 'Have an account? Sign in'
                : "Don't have an account? Sign up"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
