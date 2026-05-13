import { Download, Printer } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { getErrorMessage } from "../api/client";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";
import { currency, date } from "../utils/format";

export default function Receipts() {
  const [receipts, setReceipts] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/receipts/my")
      .then(({ data }) => setReceipts(data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="glass-panel rounded-2xl p-8 text-center text-slate-400 animate-scale-in">Loading receipts...</div>;

  return (
    <div className="space-y-6">
      <div className="opacity-0 animate-fade-in-up">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Receipts</h1>
        <p className="mt-1 text-base text-slate-400">All approved payment receipts for your loans.</p>
      </div>

      {error ? <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400">{error}</div> : null}
      {!receipts.length ? <EmptyState title="No receipts" message="Approved payments will appear here." /> : null}

      <div className="grid gap-4 md:grid-cols-2">
        {receipts.map((receipt, i) => (
          <Link
            to={`/receipts/${receipt._id}`}
            key={receipt._id}
            className="glass-panel rounded-2xl p-5 transition-all hover:border-primary-500/40 hover:shadow-glow group opacity-0 animate-scale-in"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white group-hover:text-primary-300 transition-colors">{receipt.receiptNumber}</h2>
                <p className="mt-1 text-sm text-slate-400">{date(receipt.paymentDate)}</p>
              </div>
              <div className="flex items-center gap-2 text-slate-500 group-hover:text-primary-400 transition-colors">
                <Download className="h-4 w-4" />
                <Printer className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                <div className="text-xs text-slate-400 uppercase tracking-wider">Amount</div>
                <div className="mt-1.5 font-bold text-white">{currency(receipt.amount)}</div>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                <div className="text-xs text-slate-400 uppercase tracking-wider">Method</div>
                <div className="mt-1.5 font-bold text-white">{receipt.paymentMethod}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
