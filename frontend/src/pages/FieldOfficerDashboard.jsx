import { AlertTriangle, CalendarPlus, CheckCircle2, ClipboardCheck, UserRoundCheck, History } from "lucide-react";
import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../api/client";
import EmptyState from "../components/EmptyState";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import { currency, date, daysPastDue } from "../utils/format";

export default function FieldOfficerDashboard() {
  const [cases, setCases] = useState([]);
  const [selected, setSelected] = useState(null);
  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState({
    visitDate: new Date().toISOString().slice(0, 10),
    visitOutcome: "",
    borrowerResponse: "",
    nextFollowUpDate: "",
    notes: "",
    caseStatus: "visited"
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadCases() {
    const { data } = await api.get("/cases/assigned-to-me");
    setCases(data);
    if (!selected && data.length) setSelected(data[0]);
  }

  async function loadLogs(caseId) {
    if (!caseId) return setLogs([]);
    const { data } = await api.get(`/visit-logs/case/${caseId}`);
    setLogs(data);
  }

  useEffect(() => {
    loadCases()
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadLogs(selected?._id).catch((err) => setError(getErrorMessage(err)));
  }, [selected?._id]);

  async function submitVisitLog(event) {
    event.preventDefault();
    setError(""); setMessage("");
    try {
      await api.post("/visit-logs", { ...form, caseId: selected._id, nextFollowUpDate: form.nextFollowUpDate || undefined });
      setMessage("Visit log submitted successfully.");
      setForm({ visitDate: new Date().toISOString().slice(0, 10), visitOutcome: "", borrowerResponse: "", nextFollowUpDate: "", notes: "", caseStatus: "visited" });
      await loadCases();
      await loadLogs(selected._id);
    } catch (err) { setError(getErrorMessage(err)); }
  }

  async function updateStatus(caseStatus) {
    setError(""); setMessage("");
    try {
      const { data } = await api.patch(`/cases/${selected._id}/status`, { caseStatus, notes: selected.notes });
      setSelected(data);
      await loadCases();
      setMessage(`Case status updated to ${caseStatus.replaceAll('_', ' ')}.`);
    } catch (err) { setError(getErrorMessage(err)); }
  }

  if (loading) return <div className="glass-panel rounded-2xl p-8 text-center text-slate-400 animate-scale-in">Loading assignments...</div>;

  const urgent = cases.filter((item) => item.priority === "urgent").length;
  const unresolved = cases.filter((item) => item.caseStatus !== "resolved").length;

  const inputCls = "w-full rounded-2xl border border-white/10 bg-surfaceHighlight/40 px-5 py-3.5 text-slate-200 placeholder-slate-500 outline-none transition-all duration-300 focus:border-primary-500 focus:bg-white/5 focus:ring-4 focus:ring-primary-500/10 hover:border-white/20";
  const btnPrimary = "rounded-2xl bg-gradient-to-r from-primary-600 to-primary-500 px-6 py-3.5 text-sm font-bold text-white shadow-glow hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300";

  return (
    <div className="space-y-8 pb-10 flex flex-col h-full min-h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between opacity-0 animate-fade-in-up shrink-0">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs font-semibold text-slate-300 mb-3">
            <ClipboardCheck className="h-3.5 w-3.5 text-primary-400" /> Field Operations
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Assigned Cases</h1>
          <p className="mt-2 text-base text-slate-400">Manage overdue borrowers, log field visits, and update case statuses.</p>
        </div>
      </div>

      {message ? <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-sm font-bold text-emerald-400 flex items-center gap-3 shadow-[0_0_20px_rgba(16,185,129,0.15)] opacity-0 animate-fade-in-up shrink-0"><CheckCircle2 className="h-5 w-5" /> {message}</div> : null}
      {error ? <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm font-bold text-red-400 flex items-center gap-3 shadow-[0_0_20px_rgba(239,68,68,0.15)] opacity-0 animate-fade-in-up shrink-0"><AlertTriangle className="h-5 w-5" /> {error}</div> : null}

      {/* Widget Bar */}
      <div className="glass-panel rounded-3xl p-6 opacity-0 animate-fade-in-up shrink-0" style={{ animationDelay: '100ms' }}>
        <div className="grid gap-6 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10">
          <div className="px-4"><StatCard icon={ClipboardCheck} label="Total Assignments" value={cases.length} tone="blue" /></div>
          <div className="px-4"><StatCard icon={UserRoundCheck} label="Open Cases" value={unresolved} tone={unresolved ? "amber" : "green"} /></div>
          <div className="px-4"><StatCard icon={CalendarPlus} label="Urgent Priority" value={urgent} tone={urgent ? "red" : "slate"} /></div>
        </div>
      </div>

      {!cases.length ? (
        <div className="flex-1 flex flex-col justify-center animate-scale-in">
          <EmptyState title="No assigned cases" message="You have no pending assignments from supervisors." />
        </div>
      ) : (
        <div className="flex-1 grid gap-6 xl:grid-cols-[380px_1fr] min-h-[600px] opacity-0 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          
          {/* Inbox-Style Master List */}
          <section className="glass-panel rounded-3xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-white/10 bg-surfaceHighlight/30 flex justify-between items-center shrink-0">
              <h2 className="font-bold text-white text-lg">Inbox ({cases.length})</h2>
            </div>
            <div className="overflow-y-auto flex-1 p-3 space-y-2 custom-scrollbar">
              {cases.map((item) => {
                const isSelected = selected?._id === item._id;
                return (
                  <button
                    key={item._id}
                    onClick={() => setSelected(item)}
                    className={`w-full text-left transition-all duration-300 rounded-2xl p-4 border ${
                      isSelected
                        ? "border-primary-500/50 bg-primary-500/10 shadow-glow ring-1 ring-primary-500/20"
                        : "border-transparent hover:border-white/10 hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className={`font-bold truncate ${isSelected ? 'text-white' : 'text-slate-200'}`}>{item.borrowerId?.fullName}</h3>
                      {item.priority === 'urgent' && <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] shrink-0 mt-1.5"></div>}
                    </div>
                    <div className="text-xs text-slate-400 font-mono mb-3">{item.borrowerId?.phone}</div>
                    <div className="flex flex-wrap gap-2 items-center">
                      <StatusBadge value={item.caseStatus} />
                      {item.installmentId && (
                        <span className="text-[10px] uppercase tracking-wider font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded flex items-center gap-1 border border-red-500/20">
                          <AlertTriangle className="h-3 w-3" /> {daysPastDue(item.installmentId.dueDate)}d overdue
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Dossier Detail Pane */}
          {selected ? (
            <section className="glass-panel rounded-3xl overflow-hidden flex flex-col opacity-0 animate-scale-in" style={{ animationDelay: '300ms' }}>
              
              {/* Dossier Header */}
              <div className="p-6 md:p-8 border-b border-white/10 bg-gradient-to-br from-surfaceHighlight/50 to-transparent relative shrink-0">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 blur-[80px] rounded-full pointer-events-none"></div>
                
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between relative z-10 mb-6">
                  <div>
                    <h2 className="text-3xl font-extrabold text-white tracking-tight">{selected.borrowerId?.fullName}</h2>
                    <p className="mt-1 text-slate-400 font-mono text-sm tracking-widest">{selected.borrowerId?.phone}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StatusBadge value={selected.caseStatus} />
                    <StatusBadge value={selected.priority} />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3 relative z-10">
                  <div className="rounded-2xl border border-white/5 bg-white/5 p-4 backdrop-blur-md">
                    <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Loan Principal</div>
                    <div className="font-extrabold text-white text-xl">{currency(selected.loanId?.principalAmount)}</div>
                  </div>
                  <div className="rounded-2xl border border-primary-500/20 bg-primary-500/10 p-4 backdrop-blur-md shadow-glow">
                    <div className="text-xs text-primary-400 font-bold uppercase tracking-widest mb-1">Installment Due</div>
                    <div className="font-extrabold text-white text-xl">{currency(selected.installmentId?.amountDue)}</div>
                  </div>
                  <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 backdrop-blur-md">
                    <div className="text-xs text-red-400 font-bold uppercase tracking-widest mb-1">Due Date</div>
                    <div className="font-extrabold text-white text-xl">{date(selected.installmentId?.dueDate)}</div>
                  </div>
                </div>
              </div>

              <div className="p-6 md:p-8 flex-1 overflow-y-auto custom-scrollbar">
                
                {/* Quick Actions */}
                <div className="mb-8">
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Update Case Status</h3>
                  <div className="flex flex-wrap gap-3">
                    {["assigned", "visited", "follow_up_required", "resolved"].map((status) => (
                      <button
                        key={status}
                        onClick={() => updateStatus(status)}
                        className={`rounded-xl border px-5 py-2.5 text-sm font-bold transition-all ${
                          selected.caseStatus === status 
                          ? 'bg-primary-500/20 border-primary-500/50 text-white shadow-glow' 
                          : 'border-white/10 bg-surfaceHighlight/30 text-slate-300 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {status.replaceAll("_", " ").toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Visit Log Form */}
                <form onSubmit={submitVisitLog} className="mb-10 rounded-3xl border border-white/10 bg-surfaceHighlight/20 p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                    <div className="bg-primary-500/20 p-2 rounded-xl border border-primary-500/30">
                      <ClipboardCheck className="h-5 w-5 text-primary-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Log Field Visit</h3>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2 mb-5">
                    <div>
                      <label className="mb-2 block text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Visit Date</label>
                      <input type="date" className={inputCls} value={form.visitDate} onChange={(e) => setForm({ ...form, visitDate: e.target.value })} required />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Resulting Status</label>
                      <select className={inputCls} value={form.caseStatus} onChange={(e) => setForm({ ...form, caseStatus: e.target.value })}>
                        <option value="visited" className="bg-surfaceHighlight">Visited</option>
                        <option value="follow_up_required" className="bg-surfaceHighlight">Follow-up Required</option>
                        <option value="resolved" className="bg-surfaceHighlight">Resolved</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mb-5">
                    <label className="mb-2 block text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Visit Outcome Summary</label>
                    <input className={inputCls} placeholder="e.g., Borrower promised to pay tomorrow" value={form.visitOutcome} onChange={(e) => setForm({ ...form, visitOutcome: e.target.value })} required />
                  </div>
                  
                  <div className="mb-5">
                    <label className="mb-2 block text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Borrower's Direct Response</label>
                    <textarea className={`${inputCls} min-h-[100px]`} placeholder="Quote or describe the borrower's exact response..." value={form.borrowerResponse} onChange={(e) => setForm({ ...form, borrowerResponse: e.target.value })} required />
                  </div>

                  <div className="grid gap-5 md:grid-cols-2 mb-8">
                    <div>
                      <label className="mb-2 block text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Next Follow-up Date (Optional)</label>
                      <input type="date" className={inputCls} value={form.nextFollowUpDate} onChange={(e) => setForm({ ...form, nextFollowUpDate: e.target.value })} />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Internal Notes (Optional)</label>
                      <input className={inputCls} placeholder="Any private notes..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                    </div>
                  </div>

                  <button className={`${btnPrimary} w-full`}>Submit Visit Log</button>
                </form>

                {/* Visit History Timeline */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <History className="h-5 w-5 text-slate-400" />
                    <h3 className="text-lg font-bold text-white">Visit History</h3>
                  </div>
                  
                  <div className="relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-primary-500/50 before:via-white/10 before:to-transparent space-y-6">
                    {logs.map((log) => (
                      <div key={log._id} className="relative flex items-start group">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-primary-500/50 bg-surfaceHighlight shadow-glow shrink-0 z-10 mt-1 transition-transform group-hover:scale-110 duration-300">
                          <ClipboardCheck className="h-4 w-4 text-primary-400" />
                        </div>
                        <div className="ml-6 flex-1 rounded-2xl border border-white/5 bg-surfaceHighlight/20 p-5 group-hover:bg-white/5 group-hover:border-white/10 transition-all duration-300">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
                            <span className="text-xs font-bold text-primary-400 bg-primary-500/10 px-3 py-1 rounded-lg border border-primary-500/20 uppercase tracking-wider mb-2 sm:mb-0">{date(log.visitDate)}</span>
                            <strong className="text-white text-base">{log.visitOutcome}</strong>
                          </div>
                          <div className="text-slate-300 text-sm italic border-l-2 border-white/10 pl-4 py-1 mb-3">
                            "{log.borrowerResponse}"
                          </div>
                          {log.notes && (
                            <div className="text-xs text-slate-400 bg-black/20 p-3 rounded-xl mb-3">
                              <span className="font-bold">Notes:</span> {log.notes}
                            </div>
                          )}
                          {log.nextFollowUpDate && (
                            <div className="text-xs font-bold text-amber-400 mt-2">
                              Next Follow-up Scheduled: {date(log.nextFollowUpDate)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {!logs.length && (
                      <div className="ml-12 text-sm text-slate-500 py-4 italic">No previous visits logged for this case.</div>
                    )}
                  </div>
                </div>

              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
