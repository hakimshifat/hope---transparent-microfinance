import {
  BadgeCheck,
  Banknote,
  ClipboardList,
  FileCheck2,
  PackagePlus,
  ScrollText,
  ShieldCheck,
  UserPlus,
  Users
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api, { getErrorMessage } from "../api/client";
import EmptyState from "../components/EmptyState";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import { currency, date, title } from "../utils/format";

const initialProduct = { productName: "", description: "", minAmount: "", maxAmount: "", serviceChargeRate: "", durationMonths: "", installmentFrequency: "weekly", numberOfInstallments: "", lateFeeAmount: "", eligibilityNote: "", status: "active" };
const initialUser = { fullName: "", phone: "", email: "", password: "Admin123!", role: "field_officer", status: "active" };

const inputCls = "w-full rounded-2xl border border-white/10 bg-surfaceHighlight/40 px-5 py-3.5 text-slate-200 placeholder-slate-500 outline-none transition-all duration-300 focus:border-primary-500 focus:bg-white/5 focus:ring-4 focus:ring-primary-500/10 hover:border-white/20";
const btnPrimary = "rounded-2xl bg-gradient-to-r from-primary-600 to-primary-500 px-6 py-3 text-sm font-bold text-white shadow-glow hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300";
const btnSecondary = "rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold text-slate-300 hover:bg-white/10 hover:text-white transition-all duration-300";
const btnSuccess = "rounded-xl bg-emerald-600/20 border border-emerald-500/30 px-4 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:shadow-glow";
const btnDanger = "rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-600 hover:text-white transition-all duration-300 shadow-[0_0_15px_rgba(239,68,68,0.1)] hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]";

function DarkTable({ heads, children }) {
  return (
    <div className="overflow-x-auto rounded-3xl border border-white/10 shadow-glass-premium">
      <table className="min-w-full divide-y divide-white/5 text-sm">
        <thead className="bg-surfaceHighlight/50 text-left text-xs uppercase tracking-widest text-slate-400 font-semibold">
          <tr>{heads.map((h) => <th key={h} className="px-6 py-5">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-white/5 bg-surfaceHighlight/10">{children}</tbody>
      </table>
    </div>
  );
}

export default function OperationsDashboard({ mode }) {
  const isAdmin = mode === "admin";
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "verification";
  const [state, setState] = useState({ users: [], profiles: [], applications: [], loans: [], pendingPayments: [], cases: [], products: [], auditLogs: [], overdueInstallments: [], visitLogs: [] });
  const [productForm, setProductForm] = useState(initialProduct);
  const [editingProduct, setEditingProduct] = useState(null);
  const [userForm, setUserForm] = useState(initialUser);
  const [assignment, setAssignment] = useState({ overdueKey: "", officerId: "", priority: "normal", notes: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadData() {
    const requests = [
      api.get("/users"),
      api.get("/borrowers"),
      api.get("/loan-applications"),
      api.get("/loans"),
      api.get("/payments/pending"),
      api.get("/cases"),
      api.get("/loan-products"),
      api.get("/audit-logs"),
      api.get("/visit-logs")
    ];
    const [users, profiles, applications, loans, pendingPayments, cases, products, auditLogs, visitLogs] = await Promise.all(requests);
    const schedules = await Promise.all(
      loans.data.filter((l) => l.loanStatus === "active").map((loan) => api.get(`/installments/loan/${loan.id}`).then(({ data }) => ({ loan, installments: data })))
    );
    const overdueInstallments = schedules.flatMap(({ loan, installments }) =>
      installments.filter((i) => i.status === "overdue" || (new Date(i.dueDate) < new Date() && i.amountPaid < i.amountDue)).map((i) => ({ loan, installment: i }))
    );
    setState({ users: users.data, profiles: profiles.data, applications: applications.data, loans: loans.data, pendingPayments: pendingPayments.data, cases: cases.data, products: products.data, auditLogs: auditLogs?.data || [], overdueInstallments, visitLogs: visitLogs?.data || [] });
  }

  useEffect(() => { loadData().catch((e) => setError(getErrorMessage(e))).finally(() => setLoading(false)); }, [mode]);

  const stats = useMemo(() => ({
    borrowers: state.users.filter((u) => u.role === "borrower").length,
    activeLoans: state.loans.filter((l) => l.loanStatus === "active").length,
    pendingApplications: state.applications.filter((a) => a.applicationStatus === "pending").length,
    pendingPayments: state.pendingPayments.length,
    overdueCases: state.cases.filter((c) => c.caseStatus !== "resolved").length
  }), [state]);

  const officers = state.users.filter((u) => u.role === "field_officer" && u.status === "active");

  async function runAction(action, success) {
    setError(""); setMessage("");
    try { await action(); await loadData(); setMessage(success); }
    catch (e) { setError(getErrorMessage(e)); }
  }

  function rejectReason(def) { return window.prompt("Reason", def) || def; }

  async function submitProduct(event) {
    event.preventDefault();
    const payload = { ...productForm, minAmount: Number(productForm.minAmount), maxAmount: Number(productForm.maxAmount), serviceChargeRate: Number(productForm.serviceChargeRate), durationMonths: Number(productForm.durationMonths), numberOfInstallments: Number(productForm.numberOfInstallments), lateFeeAmount: Number(productForm.lateFeeAmount || 0) };
    await runAction(async () => { editingProduct ? await api.patch(`/loan-products/${editingProduct}`, payload) : await api.post("/loan-products", payload); setProductForm(initialProduct); setEditingProduct(null); }, editingProduct ? "Product updated." : "Product created.");
  }

  async function submitUser(event) {
    event.preventDefault();
    await runAction(async () => { await api.post("/users", userForm); setUserForm(initialUser); }, "User created.");
  }

  async function submitAssignment(event) {
    event.preventDefault();
    const selected = state.overdueInstallments.find((item) => `${item.loan.id}:${item.installment.id}` === assignment.overdueKey);
    if (!selected) { setError("Select an overdue installment"); return; }
    await runAction(() => api.post("/cases/assign", { borrowerId: selected.loan.borrower?.id || selected.loan.borrowerId, loanId: selected.loan.id, installmentId: selected.installment.id, assignedOfficerId: assignment.officerId, priority: assignment.priority, notes: assignment.notes }), "Case assigned.");
    setAssignment({ overdueKey: "", officerId: "", priority: "normal", notes: "" });
  }

  if (loading) return <div className="glass-panel rounded-2xl p-8 text-center text-slate-400 animate-scale-in">Loading operations dashboard...</div>;

  const tabLabel = {
    verification: "Borrower Verification",
    applications: "Loan Applications",
    payments: "Pending Payments",
    overdue: "Overdue Cases",
    field_logs: "Field Officer Logs",
    audit: "Audit Logs",
    users: "User Management",
    products: "Loan Products"
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between opacity-0 animate-fade-in-up">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs font-semibold text-slate-300 mb-3">
            <ShieldCheck className="h-3.5 w-3.5 text-accent-light" /> Admin Operations
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">{isAdmin ? "Admin Overview" : "Supervisor Operations"}</h1>
          <p className="mt-2 text-base text-slate-400">Review queues, overdue handling, field activity, and system data.</p>
        </div>
      </div>

      {message ? <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-sm font-bold text-emerald-400 flex items-center gap-3 shadow-[0_0_20px_rgba(16,185,129,0.15)] opacity-0 animate-fade-in-up"><ShieldCheck className="h-5 w-5" /> {message}</div> : null}
      {error ? <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm font-bold text-red-400 flex items-center gap-3 shadow-[0_0_20px_rgba(239,68,68,0.15)] opacity-0 animate-fade-in-up"><BadgeCheck className="h-5 w-5" /> {error}</div> : null}

      {/* Widget Bar */}
      <div className="glass-panel rounded-3xl p-6 opacity-0 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <div className="grid gap-6 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-white/10">
          <div className="px-4"><StatCard icon={Users} label="Borrowers" value={stats.borrowers} tone="blue" /></div>
          <div className="px-4"><StatCard icon={Banknote} label="Active Loans" value={stats.activeLoans} tone="green" /></div>
          <div className="px-4"><StatCard icon={ClipboardList} label="Pending Apps" value={stats.pendingApplications} tone="amber" /></div>
          <div className="px-4"><StatCard icon={FileCheck2} label="Pending Payments" value={stats.pendingPayments} tone="amber" /></div>
          <div className="px-4"><StatCard icon={ShieldCheck} label="Open Cases" value={stats.overdueCases} tone={stats.overdueCases ? "red" : "slate"} /></div>
        </div>
      </div>

      {/* Main Tab Panel */}
      <div className="glass-panel rounded-3xl overflow-hidden opacity-0 animate-scale-in" style={{ animationDelay: '200ms' }}>
        <div className="border-b border-white/10 px-8 py-6 bg-gradient-to-r from-surfaceHighlight/50 to-transparent">
          <h2 className="text-2xl font-bold text-white tracking-tight">{tabLabel[activeTab] || "Dashboard"}</h2>
        </div>
        <div className="p-8">

          {/* Borrower Verification */}
          {activeTab === "verification" && (
            <DarkTable heads={["Borrower", "Phone", "Income", "Status", "Action"]}>
              {state.profiles.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-400"><EmptyState title="No borrower profiles pending" /></td></tr>
              ) : state.profiles.map((profile) => (
                <tr key={profile.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-5 font-bold text-slate-200 group-hover:text-white">{profile.fullName}</td>
                  <td className="px-6 py-5 text-slate-400 font-mono">{profile.phone}</td>
                  <td className="px-6 py-5 font-medium text-primary-400">{currency(profile.monthlyIncome)}</td>
                  <td className="px-6 py-5"><StatusBadge value={profile.verificationStatus} /></td>
                  <td className="px-6 py-5">
                    <div className="flex gap-3">
                      <button onClick={() => runAction(() => api.patch(`/borrowers/${profile.id}/verify`, { verificationStatus: "verified" }), "Borrower verified.")} className={btnSuccess}>Approve</button>
                      <button onClick={() => runAction(() => api.patch(`/borrowers/${profile.id}/verify`, { verificationStatus: "rejected", verificationNotes: rejectReason("Verification rejected") }), "Borrower rejected.")} className={btnDanger}>Reject</button>
                    </div>
                  </td>
                </tr>
              ))}
            </DarkTable>
          )}

          {/* Loan Applications */}
          {activeTab === "applications" && (
            <DarkTable heads={["Borrower", "Product", "Amount", "Purpose", "Status", "Action"]}>
              {state.applications.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-10 text-center"><EmptyState title="No pending applications" /></td></tr>
              ) : state.applications.map((app) => (
                <tr key={app.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-5 font-bold text-slate-200 group-hover:text-white">{app.borrower?.fullName}</td>
                  <td className="px-6 py-5 text-slate-300 font-medium">{app.loanProduct?.productName}</td>
                  <td className="px-6 py-5 font-extrabold text-white text-lg">{currency(app.requestedAmount)}</td>
                  <td className="px-6 py-5 max-w-xs text-slate-400 text-xs italic">"{app.purpose}"</td>
                  <td className="px-6 py-5"><StatusBadge value={app.applicationStatus} /></td>
                  <td className="px-6 py-5">
                    {app.applicationStatus === "pending" ? (
                      <div className="flex gap-3">
                        <button onClick={() => runAction(() => api.patch(`/loan-applications/${app.id}/approve`), "Application approved.")} className={btnSuccess}>Approve Loan</button>
                        <button onClick={() => runAction(() => api.patch(`/loan-applications/${app.id}/reject`, { rejectionReason: rejectReason("Application rejected") }), "Application rejected.")} className={btnDanger}>Deny</button>
                      </div>
                    ) : <span className="text-xs text-slate-500 font-semibold uppercase">Reviewed</span>}
                  </td>
                </tr>
              ))}
            </DarkTable>
          )}

          {/* Pending Payments */}
          {activeTab === "payments" && (
            !state.pendingPayments.length
              ? <EmptyState title="No pending payments" message="All payments have been reviewed." />
              : <div className="grid gap-6 xl:grid-cols-2">
                  {state.pendingPayments.map((payment) => (
                    <div key={payment.id} className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-sm hover:shadow-glow transition-all duration-300">
                      <div className="flex items-start justify-between gap-3 border-b border-white/5 pb-4 mb-4">
                        <div>
                          <div className="font-bold text-white text-lg">{payment.borrower?.fullName}</div>
                          <div className="text-xs text-slate-400 mt-1 font-mono tracking-wider">TXN: {payment.transactionId}</div>
                        </div>
                        <StatusBadge value={payment.paymentStatus} />
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-5">
                        <div className="rounded-2xl border border-white/5 bg-surfaceHighlight/30 p-4">
                          <div className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Amount Paid</div>
                          <div className="mt-1 font-extrabold text-primary-400 text-xl">{currency(payment.amount)}</div>
                        </div>
                        <div className="rounded-2xl border border-white/5 bg-surfaceHighlight/30 p-4">
                          <div className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Method</div>
                          <div className="mt-1 font-bold text-white text-lg">{payment.paymentMethod}</div>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => runAction(() => api.patch(`/payments/${payment.id}/approve`), "Payment approved.")} className={`flex-1 ${btnSuccess} py-3 text-sm`}>Approve Payment</button>
                        <button onClick={() => runAction(() => api.patch(`/payments/${payment.id}/reject`, { rejectionReason: rejectReason("Payment rejected") }), "Payment rejected.")} className={`${btnDanger} py-3 text-sm flex-[0.5]`}>Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
          )}

          {/* Overdue Cases */}
          {activeTab === "overdue" && (
            <div className="space-y-8">
              <div className="rounded-3xl border border-white/10 bg-surfaceHighlight/30 p-6">
                <h3 className="text-lg font-bold text-white mb-4">Assign Overdue Case</h3>
                <form onSubmit={submitAssignment} className="grid gap-4 lg:grid-cols-[1.5fr_1fr_0.8fr_1fr_auto]">
                  <select className={inputCls} value={assignment.overdueKey} onChange={(e) => setAssignment({ ...assignment, overdueKey: e.target.value })} required>
                    <option value="" className="bg-surfaceHighlight">Select overdue installment...</option>
                    {state.overdueInstallments.map(({ loan, installment }) => (
                      <option key={installment.id} value={`${loan.id}:${installment.id}`} className="bg-surfaceHighlight">
                        {loan.borrower?.fullName} — #{installment.installmentNumber} — {currency(installment.amountDue - installment.amountPaid)}
                      </option>
                    ))}
                  </select>
                  <select className={inputCls} value={assignment.officerId} onChange={(e) => setAssignment({ ...assignment, officerId: e.target.value })} required>
                    <option value="" className="bg-surfaceHighlight">Assign to Field Officer...</option>
                    {officers.map((o) => <option key={o.id} value={o.id} className="bg-surfaceHighlight">{o.fullName}</option>)}
                  </select>
                  <select className={inputCls} value={assignment.priority} onChange={(e) => setAssignment({ ...assignment, priority: e.target.value })}>
                    <option value="normal" className="bg-surfaceHighlight">Normal Priority</option>
                    <option value="urgent" className="bg-surfaceHighlight">Urgent Priority</option>
                  </select>
                  <input className={inputCls} placeholder="Additional notes..." value={assignment.notes} onChange={(e) => setAssignment({ ...assignment, notes: e.target.value })} />
                  <button className={btnPrimary}>Assign Case</button>
                </form>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                {state.cases.length === 0 ? <EmptyState title="No active cases" /> : state.cases.slice(0, 10).map((item) => (
                  <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-sm hover:border-white/20 transition-all">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="font-bold text-white text-lg">{item.borrower?.fullName}</div>
                        <div className="text-sm text-slate-400 mt-1">Assigned to: <span className="font-medium text-slate-300">{item.assignedOfficer?.fullName}</span></div>
                      </div>
                      <StatusBadge value={item.caseStatus} />
                    </div>
                    {item.notes ? <div className="rounded-xl bg-surfaceHighlight/30 p-3 text-sm text-slate-400 italic">"{item.notes}"</div> : null}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User Management (admin only) */}
          {activeTab === "users" && isAdmin && (
            <div className="space-y-8">
              <div className="rounded-3xl border border-white/10 bg-surfaceHighlight/30 p-6">
                <h3 className="text-lg font-bold text-white mb-4">Create New User</h3>
                <form onSubmit={submitUser} className="grid gap-4 lg:grid-cols-5">
                  {["fullName", "phone", "email", "password"].map((field) => (
                    <input key={field} className={inputCls} placeholder={title(field)} type={field === "password" ? "password" : "text"} value={userForm[field]} onChange={(e) => setUserForm({ ...userForm, [field]: e.target.value })} required={field !== "email"} />
                  ))}
                  <select className={inputCls} value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}>
                    {["borrower", "field_officer", "supervisor", "admin"].map((r) => <option key={r} value={r} className="bg-surfaceHighlight">{title(r)}</option>)}
                  </select>
                  <div className="lg:col-span-5 flex justify-end">
                    <button className={btnPrimary}>Create User Account</button>
                  </div>
                </form>
              </div>

              <DarkTable heads={["Name", "Phone", "Role", "Status"]}>
                {state.users.map((user) => (
                  <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-5 font-bold text-slate-200 group-hover:text-white">{user.fullName}</td>
                    <td className="px-6 py-5 text-slate-400 font-mono">{user.phone}</td>
                    <td className="px-6 py-5">
                      <select className="rounded-xl border border-white/10 bg-surfaceHighlight/50 px-4 py-2 text-sm text-slate-200 outline-none focus:border-primary-500 font-medium" value={user.role} onChange={(e) => runAction(() => api.patch(`/users/${user.id}/role`, { role: e.target.value }), "Role updated.")}>
                        {["borrower", "field_officer", "supervisor", "admin"].map((r) => <option key={r} value={r} className="bg-surfaceHighlight">{title(r)}</option>)}
                      </select>
                    </td>
                    <td className="px-6 py-5">
                      <select className="rounded-xl border border-white/10 bg-surfaceHighlight/50 px-4 py-2 text-sm text-slate-200 outline-none focus:border-primary-500 font-medium" value={user.status} onChange={(e) => runAction(() => api.patch(`/users/${user.id}/status`, { status: e.target.value }), "Status updated.")}>
                        {["active", "inactive", "pending"].map((s) => <option key={s} className="bg-surfaceHighlight">{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </DarkTable>
            </div>
          )}

          {/* Loan Products (admin only) */}
          {activeTab === "products" && isAdmin && (
            <div className="space-y-8">
              <div className="rounded-3xl border border-white/10 bg-surfaceHighlight/30 p-6">
                <h3 className="text-lg font-bold text-white mb-4">{editingProduct ? "Edit Loan Product" : "Create Loan Product"}</h3>
                <form onSubmit={submitProduct} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {[["productName", "Product name", "text"], ["minAmount", "Min amount", "number"], ["maxAmount", "Max amount", "number"], ["serviceChargeRate", "Service charge %", "number"], ["durationMonths", "Duration (months)", "number"], ["numberOfInstallments", "No. of installments", "number"], ["lateFeeAmount", "Late fee", "number"]].map(([field, label, type]) => (
                    <input key={field} className={inputCls} placeholder={label} type={type} value={productForm[field]} onChange={(e) => setProductForm({ ...productForm, [field]: e.target.value })} required={field !== "lateFeeAmount"} />
                  ))}
                  <select className={inputCls} value={productForm.installmentFrequency} onChange={(e) => setProductForm({ ...productForm, installmentFrequency: e.target.value })}>
                    <option value="weekly" className="bg-surfaceHighlight">Weekly Frequency</option>
                    <option value="monthly" className="bg-surfaceHighlight">Monthly Frequency</option>
                  </select>
                  <textarea className={`${inputCls} min-h-[100px] md:col-span-2`} placeholder="Product description..." value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} required />
                  <textarea className={`${inputCls} min-h-[100px] md:col-span-2`} placeholder="Eligibility note (optional)..." value={productForm.eligibilityNote} onChange={(e) => setProductForm({ ...productForm, eligibilityNote: e.target.value })} />
                  <div className="flex gap-4 md:col-span-2 xl:col-span-4 mt-2">
                    <button className={btnPrimary}>{editingProduct ? "Update Product" : "Create Product"}</button>
                    {editingProduct ? <button type="button" onClick={() => { setEditingProduct(null); setProductForm(initialProduct); }} className={btnSecondary}>Cancel</button> : null}
                  </div>
                </form>
              </div>

              <div className="grid gap-6 xl:grid-cols-2">
                {state.products.map((product) => (
                  <div key={product.id} className="rounded-3xl border border-white/10 bg-white/5 p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="font-extrabold text-white text-xl">{product.productName}</div>
                        <StatusBadge value={product.status} />
                      </div>
                      <div className="text-primary-400 font-bold mb-4">{currency(product.minAmount)} — {currency(product.maxAmount)}</div>
                      <p className="text-sm text-slate-400 line-clamp-2 mb-6">{product.description}</p>
                    </div>
                    <div className="flex gap-3 pt-4 border-t border-white/5">
                      <button onClick={() => { setEditingProduct(product.id); setProductForm({ productName: product.productName, description: product.description, minAmount: product.minAmount, maxAmount: product.maxAmount, serviceChargeRate: product.serviceChargeRate, durationMonths: product.durationMonths, installmentFrequency: product.installmentFrequency, numberOfInstallments: product.numberOfInstallments, lateFeeAmount: product.lateFeeAmount, eligibilityNote: product.eligibilityNote || "", status: product.status }); }} className={`${btnSecondary} text-xs py-2.5 px-6 flex-1`}>Edit</button>
                      <button onClick={() => runAction(() => api.patch(`/loan-products/${product.id}/status`, { status: product.status === "active" ? "inactive" : "active" }), "Status updated.")} className={`${btnSecondary} text-xs py-2.5 px-6 flex-1 hover:border-amber-500/50 hover:text-amber-400`}>{product.status === "active" ? "Disable" : "Enable"}</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Field Officer Logs (supervisor + admin) */}
          {activeTab === "field_logs" && (
            <div className="space-y-4">
              {!state.visitLogs.length ? <EmptyState title="No visit logs yet" message="Field officers submit logs when they visit borrowers." /> : state.visitLogs.map((log) => (
                <div key={log.id} className="rounded-3xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition-all">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4 border-b border-white/5 pb-4">
                    <div>
                      <div className="font-bold text-white text-lg">{log.caseId?.borrower?.fullName}</div>
                      <div className="text-sm text-slate-400 mt-1 tracking-widest font-mono">{log.caseId?.borrower?.phone}</div>
                    </div>
                    <div className="sm:text-right">
                      <div className="text-sm font-bold text-primary-400 bg-primary-500/10 px-3 py-1 rounded-full border border-primary-500/20 inline-block">{date(log.visitDate)}</div>
                      <div className="text-xs text-slate-500 mt-2 font-medium uppercase tracking-wider">Officer: {log.officer?.fullName}</div>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 mb-4">
                    <div className="rounded-2xl border border-white/5 bg-surfaceHighlight/40 p-4">
                      <div className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-1.5">Outcome</div>
                      <div className="text-white font-medium">{log.visitOutcome}</div>
                    </div>
                    <div className="rounded-2xl border border-white/5 bg-surfaceHighlight/40 p-4">
                      <div className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-1.5">Borrower Response</div>
                      <div className="text-slate-300 italic">"{log.borrowerResponse}"</div>
                    </div>
                  </div>
                  {log.notes || log.nextFollowUpDate ? (
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-surfaceHighlight/20 p-4 rounded-xl">
                      {log.notes ? <div className="text-sm text-slate-400 flex-1"><span className="font-bold text-slate-300">Notes:</span> {log.notes}</div> : <div className="flex-1"></div>}
                      {log.nextFollowUpDate ? <div className="text-sm font-bold text-amber-400 bg-amber-500/10 px-4 py-2 rounded-xl border border-amber-500/20 whitespace-nowrap">Next Follow-up: {date(log.nextFollowUpDate)}</div> : null}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}

          {/* Audit Logs (supervisor + admin) */}
          {activeTab === "audit" && (
            <div className="relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-primary-500/50 before:via-white/10 before:to-transparent mt-4 mb-8">
              {!state.auditLogs.length ? <EmptyState title="No audit logs" /> : state.auditLogs.slice(0, 30).map((log) => (
                <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active py-2">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-primary-500/50 bg-surfaceHighlight shadow-glow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-transform group-hover:scale-110 duration-300">
                    <ScrollText className="h-4 w-4 text-primary-400" />
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-5 rounded-2xl border border-white/5 bg-white/5 shadow-sm group-hover:shadow-glass group-hover:border-white/10 group-hover:bg-white/10 transition-all duration-300">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-2">
                      <strong className="text-white text-base tracking-wide">{title(log.actionType)}</strong>
                      <span className="text-xs text-slate-400 font-mono tracking-widest">{date(log.createdAt)}</span>
                    </div>
                    <div className="text-slate-300 text-sm leading-relaxed mb-3">{log.description}</div>
                    <div className="text-xs font-semibold text-primary-400 uppercase tracking-wider bg-primary-500/10 px-3 py-1.5 rounded-lg inline-block border border-primary-500/20">Actor: {log.actorId?.fullName} ({title(log.actorRole)})</div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
