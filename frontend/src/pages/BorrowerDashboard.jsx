import { AlertTriangle, CalendarClock, CreditCard, Landmark, ReceiptText, ShieldCheck, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import api, { getErrorMessage } from "../api/client";
import EmptyState from "../components/EmptyState";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";
import { currency, date } from "../utils/format";

export default function BorrowerDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState({
    profile: null,
    applications: [],
    loans: [],
    installments: [],
    payments: [],
    ledger: null
  });
  const [paying, setPaying] = useState(null);
  const [paymentForm, setPaymentForm] = useState({ paymentMethod: "bKash", transactionId: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadData() {
    const [profile, applications, loans, installments, payments, ledger] = await Promise.allSettled([
      api.get("/borrowers/me"),
      api.get("/loan-applications/my"),
      api.get("/loans/my"),
      api.get("/installments/my"),
      api.get("/payments/my"),
      api.get("/ledger/my")
    ]);

    setData({
      profile: profile.status === "fulfilled" ? profile.value.data : null,
      applications: applications.status === "fulfilled" ? applications.value.data : [],
      loans: loans.status === "fulfilled" ? loans.value.data : [],
      installments: installments.status === "fulfilled" ? installments.value.data : [],
      payments: payments.status === "fulfilled" ? payments.value.data : [],
      ledger: ledger.status === "fulfilled" ? ledger.value.data : null
    });
  }

  useEffect(() => {
    loadData()
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const summary = data.ledger?.summary || {};
  const activeLoan = data.loans.find((loan) => loan.loanStatus === "active");
  const pendingApplication = data.applications.find((item) => item.applicationStatus === "pending");
  const overdueCount = data.installments.filter((item) => item.status === "overdue").length;

  const unpaidInstallments = useMemo(
    () => data.installments.filter((item) => item.status !== "paid" && item.amountPaid < item.amountDue),
    [data.installments]
  );

  const progressPct = summary.totalPayable > 0 ? Math.min(100, Math.round((summary.totalPaid / summary.totalPayable) * 100)) : 0;

  async function submitPayment(event) {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      await api.post("/payments", {
        installmentId: paying._id,
        amount: paying.amountDue - paying.amountPaid,
        paymentMethod: paymentForm.paymentMethod,
        transactionId: paymentForm.transactionId
      });
      setMessage("Payment submitted successfully. Awaiting supervisor approval.");
      setPaying(null);
      setPaymentForm({ paymentMethod: "bKash", transactionId: "" });
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  if (loading) return <div className="glass-panel rounded-2xl p-8 opacity-0 animate-scale-in text-center text-slate-400 font-medium">Loading your dashboard...</div>;

  return (
    <div className="space-y-8 pb-10">
      {/* Personalized Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between opacity-0 animate-fade-in-up">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs font-semibold text-slate-300 mb-3">
            <ShieldCheck className="h-3.5 w-3.5 text-primary-400" /> Secure Session
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Welcome back, {user?.fullName.split(' ')[0]}</h1>
          <p className="mt-2 text-base text-slate-400">Manage your active loan, payments, and transparent ledger.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Profile Status</div>
            <div className="mt-1"><StatusBadge value={data.profile?.verificationStatus || "pending"} /></div>
          </div>
        </div>
      </div>

      {message ? <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-sm font-bold text-emerald-400 flex items-center gap-3 shadow-[0_0_20px_rgba(16,185,129,0.15)] opacity-0 animate-fade-in-up"><ShieldCheck className="h-5 w-5" /> {message}</div> : null}
      {error ? <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm font-bold text-red-400 flex items-center gap-3 shadow-[0_0_20px_rgba(239,68,68,0.15)] opacity-0 animate-fade-in-up"><AlertTriangle className="h-5 w-5" /> {error}</div> : null}
      
      {overdueCount ? (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.15)] opacity-0 animate-fade-in-up relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-[30px]"></div>
          <AlertTriangle className="h-6 w-6 relative z-10" />
          <span className="text-base font-bold tracking-wide relative z-10">Attention: {overdueCount} installment{overdueCount > 1 ? "s are" : " is"} overdue. Please make a payment immediately.</span>
        </div>
      ) : null}

      {/* Progress & Stats Wrapper */}
      <div className="glass-panel rounded-3xl p-6 lg:p-8 opacity-0 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        {activeLoan && (
          <div className="mb-8">
            <div className="flex justify-between items-end mb-3">
              <div className="text-sm font-bold text-white uppercase tracking-wider">Repayment Progress</div>
              <div className="text-lg font-extrabold text-primary-400">{progressPct}%</div>
            </div>
            <div className="w-full h-3 bg-surfaceHighlight/50 rounded-full overflow-hidden border border-white/5 relative">
              <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary-600 to-primary-400 transition-all duration-1000 ease-out shadow-glow" style={{ width: `${progressPct}%` }}></div>
            </div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-4">
          <StatCard icon={Landmark} label="Total Payable" value={currency(summary.totalPayable)} tone="blue" />
          <StatCard icon={CreditCard} label="Total Paid" value={currency(summary.totalPaid)} tone="green" />
          <StatCard icon={ReceiptText} label="Remaining" value={currency(summary.totalRemaining)} tone="amber" />
          <StatCard icon={CalendarClock} label="Next Due" value={summary.nextDueDate ? date(summary.nextDueDate) : "None"} tone={summary.overdueAmount ? "red" : "slate"} />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        {/* Virtual Card for Active Loan */}
        <section className="opacity-0 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <h2 className="text-xl font-bold text-white tracking-wide mb-4 px-2">Active Loan</h2>
          {activeLoan ? (
            <div className="relative rounded-3xl p-8 overflow-hidden shadow-glass-premium transform transition-all hover:scale-[1.02] duration-500 bg-gradient-to-br from-surfaceHighlight/80 to-background border border-white/10 group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-accent-light/10 opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary-500/20 blur-[80px] rounded-full"></div>
              
              <div className="relative z-10 flex flex-col h-full justify-between gap-8">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-slate-400 text-sm font-semibold uppercase tracking-widest mb-1">Principal Amount</div>
                    <div className="text-4xl font-extrabold text-white tracking-tight">{currency(activeLoan.principalAmount)}</div>
                  </div>
                  <div className="p-3 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-md">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-1">Service Charge</div>
                    <div className="text-lg font-bold text-white">{currency(activeLoan.serviceChargeAmount)}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-1">Installment</div>
                    <div className="text-lg font-bold text-primary-400">{currency(activeLoan.installmentAmount)}</div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                  <div className="text-slate-300 font-medium">Hope Digital Microfinance</div>
                  <StatusBadge value={activeLoan.loanStatus} />
                </div>
              </div>
            </div>
          ) : pendingApplication ? (
            <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-8 text-center flex flex-col items-center justify-center h-[280px]">
              <div className="bg-amber-500/20 p-4 rounded-full mb-4">
                <CalendarClock className="h-8 w-8 text-amber-400" />
              </div>
              <h3 className="text-lg font-bold text-amber-400 mb-1">Application Pending</h3>
              <p className="text-sm text-amber-400/80">Your loan application is currently under review by a supervisor.</p>
            </div>
          ) : (
            <div className="h-[280px]"><EmptyState title="No active loan" message="Submit an application from Loan Products after profile completion." /></div>
          )}
        </section>

        {/* Payment Submission */}
        <section className="opacity-0 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <h2 className="text-xl font-bold text-white tracking-wide mb-4 px-2">Make a Payment</h2>
          <div className="glass-panel rounded-3xl p-6 lg:p-8 min-h-[280px] flex flex-col justify-center">
            {paying ? (
              <form onSubmit={submitPayment} className="grid gap-5 animate-scale-in">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-slate-400 font-semibold uppercase tracking-wider mb-1">Installment #{paying.installmentNumber}</div>
                    <div className="text-xs text-slate-500">Due {date(paying.dueDate)}</div>
                  </div>
                  <strong className="text-primary-400 text-3xl font-extrabold">{currency(paying.amountDue - paying.amountPaid)}</strong>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <select
                    className="w-full rounded-2xl border border-white/10 bg-surfaceHighlight/50 px-5 py-4 text-slate-200 outline-none transition-all focus:border-primary-500 focus:bg-white/5 focus:ring-2 focus:ring-primary-500/20 font-medium"
                    value={paymentForm.paymentMethod}
                    onChange={(event) => setPaymentForm({ ...paymentForm, paymentMethod: event.target.value })}
                  >
                    {["bKash", "Nagad", "Rocket", "Card", "Cash Assist"].map((method) => <option key={method} className="bg-surfaceHighlight text-white">{method}</option>)}
                  </select>
                  <input
                    className="w-full rounded-2xl border border-white/10 bg-surfaceHighlight/50 px-5 py-4 text-slate-200 outline-none transition-all focus:border-primary-500 focus:bg-white/5 focus:ring-2 focus:ring-primary-500/20 placeholder-slate-500 font-mono"
                    placeholder="Transaction ID (e.g. TXN123)"
                    value={paymentForm.transactionId}
                    onChange={(event) => setPaymentForm({ ...paymentForm, transactionId: event.target.value })}
                    required
                  />
                </div>

                <div className="flex gap-3 mt-2">
                  <button className="flex-1 rounded-2xl bg-gradient-to-r from-primary-600 to-primary-500 px-4 py-4 text-sm font-bold text-white shadow-glow hover:shadow-lg hover:-translate-y-0.5 transition-all">Submit Secure Payment</button>
                  <button type="button" onClick={() => setPaying(null)} className="rounded-2xl border border-white/20 bg-white/5 px-6 py-4 text-sm font-bold text-slate-300 hover:bg-white/10 transition-all">Cancel</button>
                </div>
              </form>
            ) : unpaidInstallments.length ? (
              <div className="space-y-3">
                {unpaidInstallments.slice(0, 3).map((item) => (
                  <button
                    key={item._id}
                    onClick={() => setPaying(item)}
                    className="flex w-full items-center justify-between gap-4 rounded-2xl border border-white/10 bg-surfaceHighlight/30 p-5 text-left transition-all hover:border-primary-500/50 hover:bg-primary-500/10 group shadow-sm hover:shadow-glow"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-white/5 p-3 rounded-xl border border-white/10 group-hover:bg-primary-500/20 group-hover:border-primary-500/30 transition-colors">
                        <CreditCard className="h-5 w-5 text-slate-400 group-hover:text-primary-400" />
                      </div>
                      <div>
                        <span className="block text-base font-bold text-slate-200 group-hover:text-white transition-colors">Installment #{item.installmentNumber}</span>
                        <span className="block text-xs font-medium text-slate-500 mt-1">Due {date(item.dueDate)}</span>
                      </div>
                    </div>
                    <span className="text-xl font-extrabold text-white">{currency(item.amountDue - item.amountPaid)}</span>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState title="You're all caught up!" message="No unpaid installments at this time." />
            )}
          </div>
        </section>
      </div>

      {/* Repayment Schedule Table */}
      <section className="glass-panel rounded-3xl overflow-hidden opacity-0 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
        <div className="border-b border-white/10 px-8 py-6 bg-surfaceHighlight/30 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white tracking-wide">Ledger & Schedule</h2>
          <div className="text-xs text-slate-400 font-medium bg-white/5 px-3 py-1.5 rounded-full border border-white/10">Full Transparency</div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/5 text-sm">
            <thead className="bg-surfaceHighlight/40 text-left text-xs uppercase tracking-widest text-slate-400 font-semibold">
              <tr>
                <th className="px-8 py-5">Installment</th>
                <th className="px-8 py-5">Due Date</th>
                <th className="px-8 py-5">Amount Due</th>
                <th className="px-8 py-5">Amount Paid</th>
                <th className="px-8 py-5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-surfaceHighlight/10">
              {data.installments.map((item) => (
                <tr key={item._id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-8 py-5 font-bold text-slate-200 group-hover:text-white transition-colors">#{item.installmentNumber}</td>
                  <td className="px-8 py-5 text-slate-400 font-medium">{date(item.dueDate)}</td>
                  <td className="px-8 py-5 text-slate-200 font-bold">{currency(item.amountDue)}</td>
                  <td className="px-8 py-5 text-primary-400 font-bold">{currency(item.amountPaid)}</td>
                  <td className="px-8 py-5"><StatusBadge value={item.status} /></td>
                </tr>
              ))}
              {!data.installments.length && (
                <tr><td colSpan={5} className="px-8 py-10 text-center"><EmptyState title="No ledger records" /></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
