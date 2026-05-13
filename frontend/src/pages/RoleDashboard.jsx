import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import BorrowerDashboard from "./BorrowerDashboard";
import FieldOfficerDashboard from "./FieldOfficerDashboard";
import OperationsDashboard from "./OperationsDashboard";

export default function RoleDashboard() {
  const { user } = useAuth();

  if (user?.role === "borrower") return <BorrowerDashboard />;
  if (user?.role === "field_officer") return <FieldOfficerDashboard />;
  if (user?.role === "supervisor") return <OperationsDashboard mode="supervisor" />;
  if (user?.role === "admin") return <OperationsDashboard mode="admin" />;

  return <Navigate to="/login" replace />;
}
