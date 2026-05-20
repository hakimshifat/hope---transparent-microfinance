import { CheckCircle2, ChevronRight, Clock, FileText, Search, Send, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import api, { getErrorMessage } from "../api/client";
import EmptyState from "../components/EmptyState";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import { currency, date } from "../utils/format";

const inputCls =
  "w-full rounded-xl border border-white/10 bg-surfaceHighlight/50 px-4 py-3 text-slate-200 placeholder-slate-500 outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20";

const STATUS_FILTERS = ["all", "pending", "approved", "rejected"];

function InfoTile({ label, value, accent }) {
  return (
    <div className="rounded-xl border border-white/5 bg-surfaceHighlight/40 p-4">
      <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">{label}</div>
      <div className={`font-semibold ${accent || "text-slate-200"}`}>{value || "—"}</div>
    </div>
  );
}

export default function LoanApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [rejectionReason, setRejectionReason] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  async function load() {
    const { data } = await api.get("/loan-applications");
    setApplications(data);
  }

  useEffect(() => {
    load().catch((e) => setError(getErrorMessage(e))).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setRejectionReason(selected?.rejectionReason || "");
    setMessage(""); setError("");
  }, [selected?.id]);

  const counts = useMemo(() => ({
    total: applications.length,
    pending: applications.filter((a) => a.applicationStatus === "pending").length,
    approved: applications.filter((a) => a.applicationStatus === "approved").length,
    rejected: applications.filter((a) => a.applicationStatus === "rejected").length
  }), [applications]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return applications.filter((a) => {
      const matchStatus = statusFilter === "all" || a.applicationStatus === statusFilter;
      const matchQuery = !term || [
        a.borrower?.fullName, a.borrower?.phone,
        a.loanProduct?.productName, a.purpose
      ].filter(Boolean).some((v) => String(v).toLowerCase().includes(term));
      return matchStatus && matchQuery;
    });
  }, [applications, query, statusFilter]);

  async function act(status) {
    if (!selected) return;
    setActionLoading(true); setMessage(""); setError("");
    try {
      const endpoint = status === "approved"
        ? `/loan-applications/${selected.id}/approve`
        : `/loan-applications/${selected.id}/reject`;
      const payload = status === "rejected"
        ? { rejectionReason: rejectionReason || "Application rejected" }
        : {};
      const { data } = await api.patch(endpoint, payload);
      await load();
      // approve returns { application, loan }, reject returns application directly
      setSelected(data.application || data);
      setMessage(`Application ${status === "approved" ? "approved — loan disbursed" : "rejected"} successfully.`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  }

  const borderColor = {
    pending: "border-l-amber-500",
    approved: "border-l-emerald-500",
    rejected: "border-l-red-500"
  };

  if (loading) return <div className="glass-panel rounded-2xl p-8 text-center text-slate-400 animate-scale-in">Loading applications...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between opacity-0 animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Loan Applications</h1>
          <p className="mt-1 text-base text-slate-400">Review, approve, or reject borrower loan applications.</p>
        </div>
        <StatusBadge value={counts.pending ? "pending" : "active"} />
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-4 opacity-0 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
        <StatCard icon={FileText} label="Total" value={counts.total} tone="blue" />
        <StatCard icon={Clock} label="Pending" value={counts.pending} tone={counts.pending ? "amber" : "slate"} />
        <StatCard icon={CheckCircle2} label="Approved" value={counts.approved} tone="green" />
        <StatCard icon={XCircle} label="Rejected" value={counts.rejected} tone={counts.rejected ? "red" : "slate"} />
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col gap-3 sm:flex-row opacity-0 animate-fade-in-up" style={{ animationDelay: "150ms" }}>
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
          <input
            className={`${inputCls} pl-12`}
            placeholder="Search borrower, product, purpose..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`rounded-xl px-4 py-3 text-sm font-semibold capitalize transition-all ${
                statusFilter === f
                  ? "bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-glow"
                  : "border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
              }`}
            >
              {f} {f !== "all" ? `(${counts[f] ?? 0})` : `(${counts.total})`}
            </button>
          ))}
        </div>
      </div>

      {/* Split Layout */}
      <div className="flex gap-5 opacity-0 animate-fade-in-up" style={{ animationDelay: "200ms" }}>

        {/* List */}
        <div className={`flex flex-col gap-2 ${selected ? "w-full lg:w-80 xl:w-96 shrink-0" : "w-full"}`}>
          {filtered.length === 0 ? (
            <EmptyState title="No applications match" message="Try changing the filter or search term." />
          ) : filtered.map((app) => {
            const isActive = selected?.id === app.id;
            return (
              <button
                key={app.id}
                onClick={() => setSelected(app)}
                className={`w-full text-left rounded-2xl border border-white/10 border-l-4 ${borderColor[app.applicationStatus] || "border-l-white/10"} p-4 transition-all duration-300 ${
                  isActive ? "bg-primary-500/10 border-primary-500/40 ring-1 ring-primary-500/20" : "bg-surfaceHighlight/30 hover:bg-white/5"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-white truncate">{app.borrower?.fullName}</div>
                    <div className="text-xs text-slate-400 mt-0.5 truncate">{app.loanProduct?.productName}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge value={app.applicationStatus} />
                    <ChevronRight className={`h-4 w-4 text-slate-500 transition-transform ${isActive ? "rotate-90 text-primary-400" : ""}`} />
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-bold text-primary-400">{currency(app.requestedAmount)}</span>
                  <span>{date(app.createdAt)}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="flex-1 min-w-0">
            <div className="glass-panel rounded-2xl p-6 space-y-6 sticky top-6">
              {/* Header */}
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-extrabold text-white">{selected.borrower?.fullName}</h2>
                  <StatusBadge value={selected.applicationStatus} />
                </div>
                <p className="mt-1 text-sm text-slate-400">{selected.borrower?.phone}</p>
                {selected.reviewedBy && (
                  <p className="mt-1 text-xs text-slate-500">
                    Reviewed by <span className="text-slate-300 font-medium">{selected.reviewedBy?.fullName || "System"}</span> on {date(selected.reviewedAt)}
                  </p>
                )}
              </div>

              {message ? <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-400">{message}</div> : null}
              {error ? <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400">{error}</div> : null}

              {/* Loan Product Details */}
              <div>
                <h3 className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-3">Loan Product</h3>
                <div className="rounded-xl border border-primary-500/20 bg-primary-500/5 p-4">
                  <div className="font-bold text-white text-lg">{selected.loanProduct?.productName}</div>
                  <p className="mt-1 text-sm text-slate-400">{selected.loanProduct?.description}</p>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                    <div><span className="text-slate-500">Range: </span><span className="text-slate-200 font-semibold">{currency(selected.loanProduct?.minAmount)} – {currency(selected.loanProduct?.maxAmount)}</span></div>
                    <div><span className="text-slate-500">Service charge: </span><span className="text-slate-200 font-semibold">{selected.loanProduct?.serviceChargeRate}%</span></div>
                    <div><span className="text-slate-500">Duration: </span><span className="text-slate-200 font-semibold">{selected.loanProduct?.durationMonths} months</span></div>
                    <div><span className="text-slate-500">Installments: </span><span className="text-slate-200 font-semibold">{selected.loanProduct?.numberOfInstallments} × {selected.loanProduct?.installmentFrequency}</span></div>
                  </div>
                </div>
              </div>

              {/* Application Info */}
              <div>
                <h3 className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-3">Application Details</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <InfoTile label="Requested Amount" value={currency(selected.requestedAmount)} accent="text-primary-400 text-lg font-bold" />
                  <InfoTile label="Applied On" value={date(selected.createdAt)} />
                </div>
                <div className="mt-3 rounded-xl border border-white/5 bg-surfaceHighlight/40 p-4">
                  <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Stated Purpose</div>
                  <div className="text-sm text-slate-200 leading-relaxed">{selected.purpose}</div>
                </div>
              </div>

              {/* Rejection reason if already rejected */}
              {selected.applicationStatus === "rejected" && selected.rejectionReason && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
                  <div className="text-xs uppercase tracking-wider text-red-400 mb-2">Rejection Reason</div>
                  <div className="text-sm text-red-300">{selected.rejectionReason}</div>
                </div>
              )}

              {/* Action area — only for pending */}
              {selected.applicationStatus === "pending" && (
                <>
                  <div>
                    <label className="block">
                      <span className="text-sm font-semibold text-slate-300 mb-2 block">
                        Rejection reason <span className="text-slate-500 font-normal">(required only if rejecting)</span>
                      </span>
                      <textarea
                        className={`${inputCls} min-h-24`}
                        placeholder="State reason for rejection if applicable..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                      />
                    </label>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => act("approved")}
                      disabled={actionLoading}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-5 py-3.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Approve Application
                    </button>
                    <button
                      onClick={() => act("rejected")}
                      disabled={actionLoading}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-3.5 text-sm font-bold text-red-400 hover:bg-red-500/20 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject Application
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
