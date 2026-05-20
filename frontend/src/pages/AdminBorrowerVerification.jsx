import {
  BadgeCheck,
  ChevronRight,
  FileText,
  Search,
  ShieldCheck,
  UserCheck,
  UserX
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import api, { getErrorMessage } from "../api/client";
import EmptyState from "../components/EmptyState";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import { currency, date } from "../utils/format";

const inputCls =
  "w-full rounded-xl border border-white/10 bg-surfaceHighlight/50 px-4 py-3 text-slate-200 placeholder-slate-500 outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20";

const STATUS_FILTERS = ["all", "pending", "verified", "rejected"];

function InfoTile({ label, value, accent }) {
  return (
    <div className="rounded-xl border border-white/5 bg-surfaceHighlight/40 p-4">
      <div className="text-xs uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`mt-2 font-semibold ${accent || "text-slate-200"}`}>{value || "—"}</div>
    </div>
  );
}

export default function BorrowerVerification() {
  const [profiles, setProfiles] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loans, setLoans] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  async function loadProfiles() {
    const { data } = await api.get("/borrowers");
    setProfiles(data);
  }

  useEffect(() => {
    loadProfiles()
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  // Load loans for the selected profile
  useEffect(() => {
    if (!selected) { setLoans([]); return; }
    api.get("/loans")
      .then(({ data }) => setLoans(data.filter((l) => l.borrowerId === selected.userId?.id || l.borrowerId === selected.userId)))
      .catch(() => setLoans([]));
  }, [selected?.id]);

  // Sync note field when selected changes
  useEffect(() => {
    setNotes(selected?.verificationNotes || "");
    setMessage(""); setError("");
  }, [selected?.id]);

  const counts = useMemo(() => ({
    total: profiles.length,
    pending: profiles.filter((p) => p.verificationStatus === "pending").length,
    verified: profiles.filter((p) => p.verificationStatus === "verified").length,
    rejected: profiles.filter((p) => p.verificationStatus === "rejected").length
  }), [profiles]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return profiles.filter((p) => {
      const matchStatus = statusFilter === "all" || p.verificationStatus === statusFilter;
      const matchQuery = !term || [p.fullName, p.phone, p.nidNumber, p.address, p.occupation]
        .filter(Boolean).some((v) => String(v).toLowerCase().includes(term));
      return matchStatus && matchQuery;
    });
  }, [profiles, query, statusFilter]);

  async function verify(status) {
    if (!selected) return;
    setActionLoading(true); setMessage(""); setError("");
    try {
      const updated = await api.patch(`/borrowers/${selected.id}/verify`, {
        verificationStatus: status,
        verificationNotes: notes || (status === "verified" ? "Verified" : "Rejected")
      });
      await loadProfiles();
      setSelected(updated.data);
      setMessage(`${selected.fullName} marked as ${status}.`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) return <div className="glass-panel rounded-2xl p-8 text-center text-slate-400 animate-scale-in">Loading borrower profiles...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between opacity-0 animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Borrower Verification</h1>
          <p className="mt-1 text-base text-slate-400">Review profiles, check income and NID, then approve or reject.</p>
        </div>
        <StatusBadge value={counts.pending ? "pending" : "verified"} />
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-4 opacity-0 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
        <StatCard icon={ShieldCheck} label="Total" value={counts.total} tone="blue" />
        <StatCard icon={BadgeCheck} label="Pending" value={counts.pending} tone={counts.pending ? "amber" : "slate"} />
        <StatCard icon={UserCheck} label="Verified" value={counts.verified} tone="green" />
        <StatCard icon={UserX} label="Rejected" value={counts.rejected} tone={counts.rejected ? "red" : "slate"} />
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col gap-3 sm:flex-row opacity-0 animate-fade-in-up" style={{ animationDelay: "150ms" }}>
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
          <input
            className={`${inputCls} pl-12`}
            placeholder="Search name, phone, NID, address..."
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

      {/* Main Split Layout */}
      <div className="flex flex-col gap-5 lg:flex-row opacity-0 animate-fade-in-up" style={{ animationDelay: "200ms" }}>

        {/* Left: Profile List */}
        <div className={`flex flex-col gap-2 ${selected ? "w-full lg:w-80 xl:w-96 shrink-0" : "w-full"}`}>
          {filtered.length === 0 ? <EmptyState title="No profiles match" /> : filtered.map((profile) => {
            const isActive = selected?.id === profile.id;
            const statusColor = {
              pending: "border-l-amber-500",
              verified: "border-l-emerald-500",
              rejected: "border-l-red-500"
            }[profile.verificationStatus] || "border-l-white/10";

            return (
              <button
                key={profile.id}
                onClick={() => setSelected(profile)}
                className={`w-full text-left rounded-2xl border border-white/10 border-l-4 ${statusColor} p-4 transition-all duration-300 ${
                  isActive
                    ? "bg-primary-500/10 border-primary-500/40 ring-1 ring-primary-500/20"
                    : "bg-surfaceHighlight/30 hover:bg-white/5"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-white truncate">{profile.fullName}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{profile.phone}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge value={profile.verificationStatus} />
                    <ChevronRight className={`h-4 w-4 text-slate-500 transition-transform ${isActive ? "rotate-90 text-primary-400" : ""}`} />
                  </div>
                </div>
                <div className="mt-2 text-xs text-slate-500">{profile.occupation} · {currency(profile.monthlyIncome)}/mo</div>
              </button>
            );
          })}
        </div>

        {/* Right: Detail Panel */}
        {selected && (
          <div className="flex-1 min-w-0">
            <div className="glass-panel rounded-2xl p-6 space-y-6 sticky top-6">
              {/* Profile Header */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-extrabold text-white">{selected.fullName}</h2>
                    <StatusBadge value={selected.verificationStatus} />
                  </div>
                  <p className="mt-1 text-sm text-slate-400">{selected.phone}</p>
                  {selected.verifiedBy && (
                    <p className="mt-1 text-xs text-slate-500">
                      {selected.verificationStatus === "verified" ? "Verified" : "Reviewed"} by{" "}
                      <span className="text-slate-300 font-medium">{selected.verifiedBy?.fullName}</span>{" "}
                      on {date(selected.verifiedAt)}
                    </p>
                  )}
                </div>
              </div>

              {message ? <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-400">{message}</div> : null}
              {error ? <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400">{error}</div> : null}

              {/* Core Info */}
              <div>
                <h3 className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-3">Personal Details</h3>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <InfoTile label="NID Number" value={selected.nidNumber} />
                  <InfoTile label="Occupation" value={selected.occupation} />
                  <InfoTile label="Monthly income" value={currency(selected.monthlyIncome)} accent="text-primary-400 text-lg font-bold" />
                  <InfoTile label="Address" value={selected.address} />
                  <InfoTile label="Nominee" value={selected.nomineeName} />
                  <InfoTile label="Nominee phone" value={selected.nomineePhone} />
                </div>
              </div>

              {/* NID Image (placeholder) */}
              <div>
                <h3 className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-3">NID Document</h3>
                {selected.nidImageUrl ? (
                  <div className="grid gap-4 rounded-xl border border-white/10 bg-white/5 p-4 md:grid-cols-[180px_1fr]">
                    <div className="overflow-hidden rounded-xl border border-white/10 bg-black/20">
                      <img src={selected.nidImageUrl} alt="Borrower uploaded NID" className="h-32 w-full object-cover" />
                    </div>
                    <div className="flex items-center gap-3">
                      <FileText className="h-6 w-6 text-primary-400 shrink-0" />
                      <div>
                        <div className="text-sm font-bold text-white">Document uploaded</div>
                        <div className="mt-1 text-xs text-slate-400">Review the image before approving the borrower profile.</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-white/10 bg-white/5 p-6 text-center text-sm text-slate-500">
                    No NID document uploaded
                  </div>
                )}
              </div>

              {/* Active loans */}
              {loans.length > 0 && (
                <div>
                  <h3 className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-3">Loan History</h3>
                  <div className="space-y-2">
                    {loans.map((loan) => (
                      <div key={loan.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-surfaceHighlight/40 px-4 py-3">
                        <div>
                          <div className="text-sm font-bold text-white">{currency(loan.principalAmount)}</div>
                          <div className="text-xs text-slate-400 mt-0.5">Disbursed {date(loan.disbursedAt || loan.createdAt)}</div>
                        </div>
                        <StatusBadge value={loan.loanStatus} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Verification Note */}
              <div>
                <h3 className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-3">Verification Note</h3>
                <textarea
                  className={`${inputCls} min-h-28`}
                  placeholder="Add a note before approving or rejecting..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => verify("verified")}
                  disabled={actionLoading}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-5 py-3.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <UserCheck className="h-4 w-4" />
                  Approve & Verify
                </button>
                <button
                  onClick={() => verify("rejected")}
                  disabled={actionLoading}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-3.5 text-sm font-bold text-red-400 hover:bg-red-500/20 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <UserX className="h-4 w-4" />
                  Reject Profile
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
