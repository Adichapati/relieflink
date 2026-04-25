import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../App";
import AdminDashboard from "./AdminDashboard";
import VolunteerDashboard from "./VolunteerDashboard";

export default function DashboardPage() {
  const { user, profile } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/auth?mode=login");
    } else if (!profile) {
      navigate("/setup");
    }
  }, [user, profile]);

  if (!user || !profile) {
    return null;
  }

  if (profile.role === "ADMIN") {
    return <AdminDashboard profile={profile} />;
  }

  return <VolunteerDashboard profile={profile} />;
}
