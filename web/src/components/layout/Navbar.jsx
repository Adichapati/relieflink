import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebaseClient';

export default function Navbar({ scrolled = false, profile = null }) {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } finally {
      navigate('/');
    }
  };

  return (
    <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
      <div className="navbar-brand">
        Relief<span>Link</span>
      </div>

      <div className="navbar-actions">
        <div className="navbar-status">
          <span className="status-dot" />
          <span>System Online</span>
        </div>

        {profile ? (
          <>
            <div className="navbar-user">
              <span className="navbar-user-name">{profile.name}</span>
              <span className={`navbar-role-pill ${profile.role?.toLowerCase()}`}>
                {profile.role}
              </span>
            </div>
            <button
              type="button"
              className="sign-out-btn"
              onClick={handleSignOut}
            >
              Sign out
            </button>
          </>
        ) : null}
      </div>
    </nav>
  );
}
