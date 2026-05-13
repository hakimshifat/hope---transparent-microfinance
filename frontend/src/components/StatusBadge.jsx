import { title } from "../utils/format";

const colors = {
  paid: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  approved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  verified: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  resolved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  upcoming: "bg-white/5 text-slate-400 border-white/10",
  due: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  overdue: "bg-red-500/15 text-red-400 border-red-500/30",
  rejected: "bg-red-500/15 text-red-400 border-red-500/30",
  inactive: "bg-white/5 text-slate-500 border-white/10",
  partial: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  assigned: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  visited: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
  follow_up_required: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  urgent: "bg-red-500/15 text-red-400 border-red-500/30",
  normal: "bg-white/5 text-slate-400 border-white/10"
};

export default function StatusBadge({ value }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${colors[value] || colors.normal}`}>
      {title(value)}
    </span>
  );
}
