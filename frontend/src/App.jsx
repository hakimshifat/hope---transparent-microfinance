import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import About from "./pages/About";
import BorrowerDashboard from "./pages/BorrowerDashboard";
import BorrowerProfile from "./pages/BorrowerProfile";
import BorrowerVerification from "./pages/AdminBorrowerVerification";
import FieldOfficerDashboard from "./pages/FieldOfficerDashboard";
import Home from "./pages/Home";
import Ledger from "./pages/Ledger";
import LoanApplicationsPage from "./pages/LoanApplicationsPage";
import LoanProducts from "./pages/LoanProducts";
import Login from "./pages/Login";
import MockPayment from "./pages/MockPayment";
import OperationsDashboard from "./pages/OperationsDashboard";
import ReceiptDetail from "./pages/ReceiptDetail";
import Receipts from "./pages/Receipts";
import Register from "./pages/Register";
import RoleDashboard from "./pages/RoleDashboard";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<RoleDashboard />} />
        </Route>

        {/* Borrower routes */}
        <Route element={<ProtectedRoute roles={["borrower"]} />}>
          <Route path="/borrower" element={<BorrowerDashboard />} />
          <Route path="/profile" element={<BorrowerProfile />} />
          <Route path="/loan-products" element={<LoanProducts />} />
          <Route path="/mock-payment" element={<MockPayment />} />
          <Route path="/ledger" element={<Ledger />} />
          <Route path="/receipts" element={<Receipts />} />
          <Route path="/receipts/:id" element={<ReceiptDetail />} />
        </Route>

        {/* Field Officer routes */}
        <Route element={<ProtectedRoute roles={["field_officer"]} />}>
          <Route path="/field/cases" element={<FieldOfficerDashboard />} />
        </Route>

        {/* Shared Supervisor + Admin routes */}
        <Route element={<ProtectedRoute roles={["supervisor", "admin"]} />}>
          <Route path="/borrower-verification" element={<BorrowerVerification />} />
          <Route path="/loan-applications" element={<LoanApplicationsPage />} />
        </Route>

        {/* Supervisor-only dashboard */}
        <Route element={<ProtectedRoute roles={["supervisor"]} />}>
          <Route path="/supervisor" element={<OperationsDashboard mode="supervisor" />} />
        </Route>

        {/* Admin-only routes */}
        <Route element={<ProtectedRoute roles={["admin"]} />}>
          <Route path="/admin" element={<OperationsDashboard mode="admin" />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
