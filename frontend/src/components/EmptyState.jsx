export default function EmptyState({ title, message }) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 bg-white/5 p-8 text-center">
      <h3 className="text-base font-semibold text-slate-300">{title}</h3>
      {message ? <p className="mt-2 text-sm text-slate-500">{message}</p> : null}
    </div>
  );
}
