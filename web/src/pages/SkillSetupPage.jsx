import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../App";

export default function SkillSetupPage() {
  const { user, setProfile } = useContext(AuthContext);
  const navigate = useNavigate();
  const [role, setRole] = useState("VOLUNTEER");
  const [name, setName] = useState(user?.displayName ?? "");
  const [skills, setSkills] = useState("");
  const [error, setError] = useState(null);

  if (!user) {
    navigate("/auth?mode=login");
    return null;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    try {
      const response = await fetch("http://localhost:8787/add-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebaseUid: user.uid,
          email: user.email,
          name: name || "Relief volunteer",
          role,
          skills: skills
            .split(",")
            .map((skill) => skill.trim())
            .filter(Boolean),
        }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || "Failed to save profile");
      }

      const profile = await response.json();
      setProfile(profile);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page-shell">
      <section className="panel">
        <p className="eyebrow">Profile setup</p>
        <h1>Choose your role and skills</h1>
        <form onSubmit={handleSubmit}>
          <label>
            Display name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Full name"
            />
          </label>
          <label>
            Role
            <select
              value={role}
              onChange={(event) => setRole(event.target.value)}
            >
              <option value="VOLUNTEER">Volunteer</option>
              <option value="ADMIN">Admin</option>
            </select>
          </label>
          <label>
            Skills (comma separated)
            <input
              value={skills}
              onChange={(event) => setSkills(event.target.value)}
              placeholder="e.g. medical, logistics, transport"
            />
          </label>
          {error ? <div className="error-text">{error}</div> : null}
          <button className="primary-button" type="submit">
            Save profile
          </button>
        </form>
      </section>
    </div>
  );
}
