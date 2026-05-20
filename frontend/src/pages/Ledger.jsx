import { ClipboardList } from "lucide-react";
import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../api/client";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import { currency, date } from "../utils/format";

export default function Ledger() {
  const [ledger, setLedger] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/ledger/my")
      .then(({ data }) => setLedger(data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="glass-panel rounded-2xl p-8 text-center text-slate-400 animate-scale-in">Loading ledger...</div>;
  if (error) return <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400">{error}</div>;
  if (!ledger) return null;

  return (
    <div className="space-y-6">
      <div className="opacity-0 animate-fade-in-up">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Borrower Ledger</h1>
        <p className="mt-1 text-base text-slate-400">Read-only calculation from approved payments and installment records.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <StatCard icon={ClipboardList} label="Loan Amount" value={currency(ledger.summary.loanAmount)} tone="blue" />
        <StatCard label="Service Charge" value={currency(ledger.summary.serviceCharge)} tone="slate" />
        <StatCard label="Total Paid" value={currency(ledger.summary.totalPaid)} tone="green" />
        <StatCard label="Remaining" value={currency(ledger.summary.totalRemaining)} tone={ledger.summary.overdueAmount ? "red" : "amber"} />
      </div>

      <section className="glass-panel rounded-2xl p-6 opacity-0 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <h2 className="text-xl font-bold text-white mb-5">Due Summary</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-white/5 bg-white/5 p-4">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Due amount</div>
            <div className="mt-2 text-2xl font-bold text-white">{currency(ledger.summary.dueAmount)}</div>
          </div>
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
            <div className="text-xs font-medium text-red-400 uppercase tracking-wider">Overdue amount</div>
            <div className="mt-2 text-2xl font-bold text-red-400">{currency(ledger.summary.overdueAmount)}</div>
          </div>
          <div className="rounded-xl border border-primary-500/20 bg-primary-500/10 p-4">
            <div className="text-xs font-medium text-primary-400 uppercase tracking-wider">Next due date</div>
            <div className="mt-2 text-2xl font-bold text-primary-300">{date(ledger.summary.nextDueDate)}</div>
          </div>
        </div>
      </section>

      <section className="glass-panel rounded-2xl overflow-hidden opacity-0 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
        <div className="border-b border-white/10 px-6 py-5 bg-surfaceHighlight/30">
          <h2 className="text-xl font-bold text-white">Installment Ledger</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/5 text-sm">
            <thead className="bg-surfaceHighlight/50 text-left text-xs uppercase tracking-wider text-slate-400">
              <tr>
                {["Installment", "Due date", "Due", "Paid", "Remaining", "Status"].map((h) => (
                  <th key={h} className="px-6 py-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {ledger.installments.map((item) => (
                <tr key={item.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-200">#{item.installmentNumber}</td>
                  <td className="px-6 py-4 text-slate-300">{date(item.dueDate)}</td>
                  <td className="px-6 py-4 text-slate-200">{currency(item.amountDue)}</td>
                  <td className="px-6 py-4 text-primary-400 font-medium">{currency(item.amountPaid)}</td>
                  <td className="px-6 py-4 text-amber-400 font-medium">{currency(item.amountDue - item.amountPaid)}</td>
                  <td className="px-6 py-4"><StatusBadge value={item.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="glass-panel rounded-2xl overflow-hidden opacity-0 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
        <div className="border-b border-white/10 px-6 py-5 bg-surfaceHighlight/30">
          <h2 className="text-xl font-bold text-white">Payment History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/5 text-sm">
            <thead className="bg-surfaceHighlight/50 text-left text-xs uppercase tracking-wider text-slate-400">
              <tr>
                {["Transaction", "Method", "Amount", "Submitted", "Status"].map((h) => (
                  <th key={h} className="px-6 py-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {ledger.paymentHistory.map((payment) => (
                <tr key={payment.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-mono text-slate-300 text-xs">{payment.transactionId}</td>
                  <td className="px-6 py-4 text-slate-300">{payment.paymentMethod}</td>
                  <td className="px-6 py-4 font-bold text-white">{currency(payment.amount)}</td>
                  <td className="px-6 py-4 text-slate-400">{date(payment.submittedAt)}</td>
                  <td className="px-6 py-4"><StatusBadge value={payment.paymentStatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
