import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminRoute({ children }) {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-white/50">
        Loading…
      </div>
    );
  }

  if (!token) return <Navigate to="/admin/login" replace />;

  return children;
}
