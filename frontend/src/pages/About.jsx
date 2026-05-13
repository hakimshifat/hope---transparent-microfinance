import { CheckCircle2 } from "lucide-react";

export default function About() {
  const items = [
    "Borrower self-registration and manual verification",
    "Predefined microfinance loan products",
    "Supervisor or admin approval of applications and payments",
    "Automatic installment schedule generation",
    "Ledger transparency with paid, due, overdue, and remaining amounts",
    "Overdue case assignment and field officer visit logs",
    "Audit logs for important administrative actions"
  ];

  return (
    <div className="glass-panel rounded-2xl p-8 opacity-0 animate-scale-in">
      <h1 className="text-3xl font-extrabold text-white tracking-tight">Project Overview</h1>
      <p className="mt-4 max-w-3xl leading-7 text-slate-400">
        Hope is a full-stack MVP for demonstrating a practical microfinance workflow without real banking integrations. It keeps financial calculations simple and focuses on transparency, role control, repayment visibility, and overdue follow-up.
      </p>
      <div className="mt-8 grid gap-3 md:grid-cols-2">
        {items.map((item, i) => (
          <div key={item} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4 opacity-0 animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary-400" />
            <span className="text-sm font-medium text-slate-300">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
