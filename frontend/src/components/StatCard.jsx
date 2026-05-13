export default function StatCard({ icon: Icon, label, value, tone = "slate" }) {
  const tones = {
    slate: "text-slate-200 border-white/10 group-hover:border-slate-500/50 bg-white/5",
    green: "text-emerald-400 border-emerald-500/20 group-hover:border-emerald-500/50 bg-emerald-500/5",
    amber: "text-amber-400 border-amber-500/20 group-hover:border-amber-500/50 bg-amber-500/5",
    red: "text-red-400 border-red-500/20 group-hover:border-red-500/50 bg-red-500/5",
    blue: "text-sky-400 border-sky-500/20 group-hover:border-sky-500/50 bg-sky-500/5"
  };

  const iconTones = {
    slate: "text-slate-400",
    green: "text-emerald-400",
    amber: "text-amber-400",
    red: "text-red-400",
    blue: "text-sky-400"
  };

  return (
    <div className={`group rounded-2xl border p-5 backdrop-blur-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-glow ${tones[tone] || tones.slate}`}>
      <div className="flex items-center gap-3">
        {Icon ? <div className={`p-2 rounded-lg bg-white/5 border border-white/5 ${iconTones[tone] || iconTones.slate}`}>
          <Icon className="h-5 w-5 shrink-0" />
        </div> : null}
        <span className="text-sm font-semibold text-slate-400 tracking-wide uppercase">{label}</span>
      </div>
      <div className="mt-4 text-3xl font-bold tracking-tight">{value}</div>
    </div>
  );
}
