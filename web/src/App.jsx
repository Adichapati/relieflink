import { createContext, useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebaseClient";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import SkillSetupPage from "./pages/SkillSetupPage";
import DashboardPage from "./pages/DashboardPage";

export const AuthContext = createContext(null);

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      setUser(currentUser);

      if (currentUser) {
        try {
          const response = await fetch(
            `http://localhost:8787/user/${currentUser.uid}`,
          );
          if (response.ok) {
            const profileData = await response.json();
            setProfile(profileData);
          } else {
            setProfile(null);
          }
        } catch (err) {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return <div className="page-shell">Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, profile, setProfile }}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/landing" element={<Navigate replace to="/" />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/setup" element={<SkillSetupPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="*" element={<Navigate replace to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}
