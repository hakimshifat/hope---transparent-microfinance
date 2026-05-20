import { Send } from "lucide-react";
import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../api/client";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";
import { currency, title } from "../utils/format";

export default function LoanProducts() {
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ requestedAmount: "", purpose: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadProducts() {
    const { data } = await api.get("/loan-products");
    setProducts(data);
  }

  useEffect(() => { loadProducts().catch((err) => setError(getErrorMessage(err))).finally(() => setLoading(false)); }, []);

  async function apply(productId) {
    setMessage(""); setError("");
    try {
      await api.post("/loan-applications", { loanProductId: productId, requestedAmount: Number(form.requestedAmount), purpose: form.purpose });
      setMessage("Loan application submitted for review.");
      setSelected(null);
      setForm({ requestedAmount: "", purpose: "" });
    } catch (err) { setError(getErrorMessage(err)); }
  }

  const inputCls = "w-full rounded-xl border border-white/10 bg-surfaceHighlight/50 px-4 py-3 text-slate-200 placeholder-slate-500 outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20";

  return (
    <div className="space-y-6">
      <div className="opacity-0 animate-fade-in-up">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Loan Products</h1>
        <p className="mt-1 text-base text-slate-400">Browse active loan products and submit an application.</p>
      </div>

      {message ? <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-400">{message}</div> : null}
      {error ? <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400">{error}</div> : null}

      {loading ? <div className="glass-panel rounded-2xl p-8 text-center text-slate-400">Loading products...</div> : null}
      {!loading && products.length === 0 ? <EmptyState title="No loan products" message="Active products will appear here." /> : null}

      <div className="grid gap-5 lg:grid-cols-2">
        {products.map((product, i) => (
          <div key={product.id} className="glass-panel rounded-2xl p-6 opacity-0 animate-scale-in" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-white">{product.productName}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">{product.description}</p>
              </div>
              <StatusBadge value={product.status} />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              {[
                ["Amount range", `${currency(product.minAmount)} — ${currency(product.maxAmount)}`],
                ["Service charge", `${product.serviceChargeRate}%`],
                ["Duration", `${product.durationMonths} months`],
                ["Installments", `${product.numberOfInstallments} ${title(product.installmentFrequency)}`]
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-white/5 bg-white/5 p-3">
                  <div className="text-xs text-slate-400 uppercase tracking-wider">{label}</div>
                  <div className="mt-1.5 font-bold text-white">{value}</div>
                </div>
              ))}
            </div>

            {product.eligibilityNote ? <p className="mt-4 text-sm font-medium text-slate-400 italic">{product.eligibilityNote}</p> : null}

            {selected === product.id ? (
              <form onSubmit={(e) => { e.preventDefault(); apply(product.id); }} className="mt-5 grid gap-3">
                <input type="number" min={product.minAmount} max={product.maxAmount} className={inputCls} placeholder={`Amount (${currency(product.minAmount)} – ${currency(product.maxAmount)})`} value={form.requestedAmount} onChange={(e) => setForm({ ...form, requestedAmount: e.target.value })} required />
                <textarea className={`${inputCls} min-h-24`} placeholder="Loan purpose" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} required />
                <div className="flex gap-3">
                  <button className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-4 py-3 text-sm font-bold text-white shadow-glow hover:-translate-y-0.5 transition-all">
                    <Send className="h-4 w-4" /> Submit application
                  </button>
                  <button type="button" onClick={() => setSelected(null)} className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-slate-300 hover:bg-white/10 transition-all">Cancel</button>
                </div>
              </form>
            ) : (
              <button onClick={() => setSelected(product.id)} className="mt-5 w-full rounded-xl border border-primary-500/30 bg-primary-500/10 px-4 py-3 text-sm font-bold text-primary-300 hover:bg-primary-500/20 hover:border-primary-500/50 transition-all">
                Apply for this loan
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
