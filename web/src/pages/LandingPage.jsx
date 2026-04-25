import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../App";

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  return (
    <div className="page-shell">
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 0",
          borderBottom: "1px solid #e0e0e0",
          marginBottom: "40px",
        }}
      >
        <h2 style={{ margin: 0 }}>ReliefLink</h2>
        <div>
          {user ? (
            <button
              className="primary-button"
              onClick={() => navigate("/dashboard")}
            >
              Go to Dashboard
            </button>
          ) : (
            <button
              className="secondary-button"
              onClick={() => navigate("/auth?mode=login")}
            >
              Login
            </button>
          )}
        </div>
      </header>

      <section className="panel">
        <p className="eyebrow">Welcome to ReliefLink</p>
        <h1>Simple disaster relief coordination for volunteers and admins.</h1>
        <p className="hero-copy">
          Sign in, sign up, and route volunteers automatically. Admins can
          review all requests and match pending items with one tap.
        </p>
        <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
          <button
            className="primary-button"
            onClick={() => navigate("/auth?mode=login")}
          >
            Login
          </button>
          <button
            className="secondary-button"
            onClick={() => navigate("/auth?mode=signup")}
          >
            Sign up
          </button>
        </div>
      </section>
    </div>
  );
}
