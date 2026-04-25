import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "../firebaseClient";

export default function AuthPage() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const requested = searchParams.get("mode");
    if (requested === "signup" || requested === "login") {
      setMode(requested);
    }
  }, [searchParams]);

  const handleSignup = async (event) => {
    event.preventDefault();
    setError(null);

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate("/setup");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setError(null);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const firebaseUid = userCredential.user.uid;
      const response = await fetch(`http://localhost:8787/user/${firebaseUid}`);
      if (response.ok) {
        navigate("/dashboard");
      } else {
        navigate("/setup");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const firebaseUid = result.user.uid;
      const response = await fetch(`http://localhost:8787/user/${firebaseUid}`);
      if (response.ok) {
        navigate("/dashboard");
      } else {
        navigate("/setup");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page-shell">
      <section className="panel">
        <p className="eyebrow">
          {mode === "signup" ? "Create an account" : "Welcome back"}
        </p>
        <h1>
          {mode === "signup"
            ? "Sign up for ReliefLink"
            : "Log in to ReliefLink"}
        </h1>
        <form onSubmit={mode === "signup" ? handleSignup : handleLogin}>
          {mode === "signup" ? (
            <label>
              Name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your full name"
              />
            </label>
          ) : null}
          <label>
            Email
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email address"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
            />
          </label>

          {error ? <div className="error-text">{error}</div> : null}
          <div className="request-actions">
            <button className="primary-button" type="submit">
              {mode === "signup" ? "Create account" : "Log in"}
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={handleGoogleSignIn}
              style={{
                backgroundColor: "#4285f4",
                color: "white",
                border: "none",
              }}
            >
              Continue with Google
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setMode(mode === "signup" ? "login" : "signup")}
            >
              {mode === "signup"
                ? "Have an account? Log in"
                : "Need an account? Sign up"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
