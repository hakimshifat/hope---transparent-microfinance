import { Printer } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api, { getErrorMessage } from "../api/client";
import { currency, date } from "../utils/format";

export default function ReceiptDetail() {
  const { id } = useParams();
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/receipts/${id}`)
      .then(({ data }) => setReceipt(data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="glass-panel rounded-2xl p-8 text-center text-slate-400 animate-scale-in">Loading receipt...</div>;
  if (error) return <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400">{error}</div>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="glass-panel rounded-2xl p-8 opacity-0 animate-scale-in">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-primary-400">Hope Microfinance</div>
            <h1 className="mt-2 text-3xl font-extrabold text-white tracking-tight">Payment Receipt</h1>
          </div>
          <button
            onClick={() => window.print()}
            className="no-print inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-slate-300 hover:bg-white/10 hover:text-white transition-all"
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
        </div>

        {/* Details Grid */}
        <div className="mt-8 grid gap-4 border-y border-white/10 py-6 md:grid-cols-2">
          {[
            ["Receipt number", receipt.receiptNumber],
            ["Payment date", date(receipt.paymentDate)],
            ["Borrower", receipt.borrowerId?.fullName],
            ["Borrower phone", receipt.borrowerId?.phone],
            ["Payment method", receipt.paymentMethod],
            ["Transaction ID", receipt.transactionId]
          ].map(([label, value]) => (
            <div key={label}>
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</div>
              <div className="mt-1.5 font-bold text-white">{value}</div>
            </div>
          ))}
        </div>

        {/* Amount */}
        <div className="mt-6 flex items-end justify-between gap-4">
          <div>
            <div className="text-sm text-slate-400">Amount paid</div>
            <div className="mt-1 text-4xl font-extrabold text-primary-400">{currency(receipt.amount)}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500">Installment</div>
            <div className="mt-1 text-sm font-bold text-slate-300">#{receipt.installmentId?.installmentNumber}</div>
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-5 text-xs text-slate-500 text-center">
          This is a computer-generated receipt. No signature is required.
        </div>
      </div>
    </div>
  );
}
