import { CreditCard, History, Landmark, Send } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import api, { getErrorMessage } from "../api/client";
import EmptyState from "../components/EmptyState";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import { currency, date } from "../utils/format";

const inputCls = "w-full rounded-xl border border-white/10 bg-surfaceHighlight/50 px-4 py-3.5 text-slate-200 placeholder-slate-500 outline-none transition-all focus:border-primary-500 focus:bg-white/5 focus:ring-2 focus:ring-primary-500/20";

export default function MockPayment() {
  const [installments, setInstallments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState({ paymentMethod: "bKash", transactionId: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadData() {
    const [installmentRes, paymentRes] = await Promise.all([
      api.get("/installments/my"),
      api.get("/payments/my")
    ]);

    setInstallments(installmentRes.data);
    setPayments(paymentRes.data);

    const firstUnpaid = installmentRes.data.find((item) => item.status !== "paid" && item.amountPaid < item.amountDue);
    if (firstUnpaid) setSelectedId((current) => current || firstUnpaid.id);
  }

  useEffect(() => {
    loadData()
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const payableInstallments = useMemo(
    () => installments.filter((item) => item.status !== "paid" && item.amountPaid < item.amountDue),
    [installments]
  );
  const selected = payableInstallments.find((item) => item.id === selectedId);
  const pendingCount = payments.filter((payment) => payment.paymentStatus === "pending").length;
  const approvedTotal = payments
    .filter((payment) => payment.paymentStatus === "approved")
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  async function submitPayment(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!selected) {
      setError("Select an unpaid installment first.");
      return;
    }

    try {
      await api.post("/payments", {
        installmentId: selected.id,
        amount: selected.amountDue - selected.amountPaid,
        paymentMethod: form.paymentMethod,
        transactionId: form.transactionId
      });
      setMessage("Mock payment submitted. Admin or supervisor approval is required before the ledger updates.");
      setForm({ paymentMethod: "bKash", transactionId: "" });
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  if (loading) {
    return <div className="glass-panel rounded-2xl p-8 text-center text-slate-400 animate-scale-in">Loading payment page...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between opacity-0 animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Mock Payment</h1>
          <p className="mt-1 text-base text-slate-400">Submit demo installment payments using bKash, Nagad, Rocket, Card, or Cash Assist.</p>
        </div>
        <StatusBadge value={pendingCount ? "pending" : "active"} />
      </div>

      {message ? <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-400">{message}</div> : null}
      {error ? <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400">{error}</div> : null}

      <div className="grid gap-4 md:grid-cols-3 opacity-0 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
        <StatCard icon={Landmark} label="Unpaid Installments" value={payableInstallments.length} tone={payableInstallments.length ? "amber" : "green"} />
        <StatCard icon={CreditCard} label="Pending Review" value={pendingCount} tone={pendingCount ? "amber" : "slate"} />
        <StatCard icon={History} label="Approved Paid" value={currency(approvedTotal)} tone="green" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="glass-panel rounded-2xl p-6 opacity-0 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
          <h2 className="text-xl font-bold text-white tracking-wide">Select Installment</h2>
          <div className="mt-5 space-y-3">
            {payableInstallments.length === 0 ? (
              <EmptyState title="No unpaid installment" message="Approved payments and receipts will appear in your ledger." />
            ) : (
              payableInstallments.map((item) => {
                const remaining = item.amountDue - item.amountPaid;
                const active = item.id === selectedId;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={`w-full rounded-xl border p-4 text-left transition-all ${
                      active
                        ? "border-primary-500/70 bg-primary-500/10 shadow-glow"
                        : "border-white/10 bg-surfaceHighlight/30 hover:border-primary-500/40 hover:bg-primary-500/10"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-bold text-white">Installment #{item.installmentNumber}</div>
                        <div className="mt-1 text-sm text-slate-400">Due {date(item.dueDate)}</div>
                      </div>
                      <StatusBadge value={item.status} />
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <div className="text-slate-500">Due</div>
                        <div className="mt-1 font-bold text-slate-200">{currency(item.amountDue)}</div>
                      </div>
                      <div>
                        <div className="text-slate-500">Paid</div>
                        <div className="mt-1 font-bold text-emerald-400">{currency(item.amountPaid)}</div>
                      </div>
                      <div>
                        <div className="text-slate-500">Pay now</div>
                        <div className="mt-1 font-bold text-primary-400">{currency(remaining)}</div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        <section className="glass-panel rounded-2xl p-6 opacity-0 animate-fade-in-up" style={{ animationDelay: "300ms" }}>
          <h2 className="text-xl font-bold text-white tracking-wide">Submit Demo Payment</h2>
          {selected ? (
            <form onSubmit={submitPayment} className="mt-5 grid gap-4">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                Paying installment #{selected.installmentNumber}
                <strong className="ml-2 text-lg text-primary-400">{currency(selected.amountDue - selected.amountPaid)}</strong>
              </div>
              <label>
                <span className="text-sm font-semibold text-slate-300">Payment method</span>
                <select
                  className={`${inputCls} mt-1`}
                  value={form.paymentMethod}
                  onChange={(event) => setForm({ ...form, paymentMethod: event.target.value })}
                >
                  {["bKash", "Nagad", "Rocket", "Card", "Cash Assist"].map((method) => (
                    <option key={method} className="bg-surfaceHighlight text-white">{method}</option>
                  ))}
                </select>
              </label>
              <label>
                <span className="text-sm font-semibold text-slate-300">Mock transaction ID</span>
                <input
                  className={`${inputCls} mt-1`}
                  placeholder="Example: BKASH-DEMO-2026"
                  value={form.transactionId}
                  onChange={(event) => setForm({ ...form, transactionId: event.target.value })}
                  required
                />
              </label>
              <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-5 py-3.5 text-sm font-bold text-white shadow-glow hover:-translate-y-0.5 hover:shadow-lg transition-all">
                <Send className="h-4 w-4" />
                Submit mock payment
              </button>
            </form>
          ) : (
            <div className="mt-5">
              <EmptyState title="Nothing to pay" message="You need an active loan with unpaid installments." />
            </div>
          )}
        </section>
      </div>

      <section className="glass-panel rounded-2xl overflow-hidden opacity-0 animate-fade-in-up" style={{ animationDelay: "400ms" }}>
        <div className="border-b border-white/10 bg-surfaceHighlight/30 p-6">
          <h2 className="text-xl font-bold text-white tracking-wide">Payment History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/5 text-sm">
            <thead className="bg-surfaceHighlight/60 text-left text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-6 py-4">Transaction</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Submitted</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-mono text-slate-200">{payment.transactionId}</td>
                  <td className="px-6 py-4 text-slate-300">{payment.paymentMethod}</td>
                  <td className="px-6 py-4 font-bold text-white">{currency(payment.amount)}</td>
                  <td className="px-6 py-4 text-slate-300">{date(payment.submittedAt)}</td>
                  <td className="px-6 py-4"><StatusBadge value={payment.paymentStatus} /></td>
                </tr>
              ))}
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">No mock payments submitted yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
