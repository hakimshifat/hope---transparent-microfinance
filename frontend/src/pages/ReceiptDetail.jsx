import { Download, Printer } from "lucide-react";
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

  function downloadReceipt() {
    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${receipt.receiptNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #111827; margin: 32px; }
    .receipt { max-width: 720px; margin: 0 auto; border: 1px solid #d1d5db; border-radius: 16px; padding: 28px; }
    h1 { margin: 6px 0 24px; }
    .brand { color: #047857; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; font-size: 12px; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; padding: 20px 0; }
    .label { color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: .08em; }
    .value { margin-top: 6px; font-weight: 700; }
    .amount { margin-top: 24px; font-size: 36px; color: #047857; font-weight: 800; }
    .foot { margin-top: 28px; border-top: 1px solid #e5e7eb; padding-top: 16px; color: #6b7280; font-size: 12px; text-align: center; }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="brand">Hope Microfinance</div>
    <h1>Payment Receipt</h1>
    <div class="grid">
      <div><div class="label">Receipt number</div><div class="value">${receipt.receiptNumber}</div></div>
      <div><div class="label">Payment date</div><div class="value">${date(receipt.paymentDate)}</div></div>
      <div><div class="label">Borrower</div><div class="value">${receipt.borrower?.fullName || ""}</div></div>
      <div><div class="label">Borrower phone</div><div class="value">${receipt.borrower?.phone || ""}</div></div>
      <div><div class="label">Payment method</div><div class="value">${receipt.paymentMethod}</div></div>
      <div><div class="label">Transaction ID</div><div class="value">${receipt.transactionId}</div></div>
    </div>
    <div class="label" style="margin-top: 24px;">Amount paid</div>
    <div class="amount">${currency(receipt.amount)}</div>
    <div class="foot">This is a computer-generated receipt. No signature is required.</div>
  </div>
</body>
</html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${receipt.receiptNumber}.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="receipt-print glass-panel rounded-2xl p-6 sm:p-8 opacity-0 animate-scale-in">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-primary-400">Hope Microfinance</div>
            <h1 className="mt-2 text-3xl font-extrabold text-white tracking-tight">Payment Receipt</h1>
          </div>
          <div className="no-print flex flex-wrap justify-end gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-slate-300 hover:bg-white/10 hover:text-white transition-all"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
            <button
              onClick={downloadReceipt}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-4 py-2.5 text-sm font-bold text-white shadow-glow hover:-translate-y-0.5 transition-all"
            >
              <Download className="h-4 w-4" />
              Download
            </button>
          </div>
        </div>

        {/* Details Grid */}
        <div className="mt-8 grid gap-4 border-y border-white/10 py-6 md:grid-cols-2">
          {[
            ["Receipt number", receipt.receiptNumber],
            ["Payment date", date(receipt.paymentDate)],
            ["Borrower", receipt.borrower?.fullName],
            ["Borrower phone", receipt.borrower?.phone],
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
            <div className="mt-1 text-sm font-bold text-slate-300">#{receipt.installment?.installmentNumber}</div>
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-5 text-xs text-slate-500 text-center">
          This is a computer-generated receipt. No signature is required.
        </div>
      </div>
    </div>
  );
}
