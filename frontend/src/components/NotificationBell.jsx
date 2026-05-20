import { Bell, CheckCheck, ExternalLink } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import { date } from "../utils/format";

const toneClass = {
  info: "border-blue-400/20 bg-blue-400/10 text-blue-300",
  success: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  warning: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  danger: "border-red-400/20 bg-red-400/10 text-red-300"
};

export default function NotificationBell({ compact = false }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  async function loadNotifications() {
    const { data } = await api.get("/notifications/my");
    setNotifications(data);
  }

  useEffect(() => {
    loadNotifications().catch(() => {});
    const timer = window.setInterval(() => loadNotifications().catch(() => {}), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const unread = useMemo(() => notifications.filter((item) => !item.readAt).length, [notifications]);

  async function markAllRead() {
    await api.patch("/notifications/read-all");
    setNotifications((items) => items.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() })));
  }

  async function markRead(id) {
    await api.patch(`/notifications/${id}/read`);
    setNotifications((items) => items.map((item) => item.id === id ? { ...item, readAt: item.readAt || new Date().toISOString() } : item));
    setOpen(false);
  }

  return (
    <div className="relative no-print">
      <button
        onClick={() => setOpen((value) => !value)}
        className={`relative inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition-all hover:bg-white/10 hover:text-white ${compact ? "h-11 w-11" : "h-10 w-10"}`}
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-extrabold text-white shadow-[0_0_16px_rgba(239,68,68,0.55)]">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-white/10 bg-surface/95 shadow-glass-premium backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div>
              <div className="text-sm font-bold text-white">Notifications</div>
              <div className="text-xs text-slate-500">{unread} unread</div>
            </div>
            <button
              onClick={markAllRead}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-white/10"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Read
            </button>
          </div>

          <div className="max-h-[26rem] overflow-y-auto p-2 custom-scrollbar">
            {!notifications.length ? (
              <div className="px-4 py-8 text-center text-sm text-slate-500">No notifications yet.</div>
            ) : notifications.map((item) => {
              const content = (
                <div className={`rounded-xl border p-3 transition-colors hover:bg-white/5 ${item.readAt ? "border-white/5 bg-white/[0.02]" : toneClass[item.type] || toneClass.info}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-bold text-white">{item.title}</div>
                      <p className="mt-1 text-sm leading-snug text-slate-300">{item.message}</p>
                      <div className="mt-2 text-[11px] font-medium uppercase tracking-wider text-slate-500">{date(item.createdAt)}</div>
                    </div>
                    {item.link ? <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-slate-500" /> : null}
                  </div>
                </div>
              );

              return item.link ? (
                <Link key={item.id} to={item.link} onClick={() => markRead(item.id)} className="mb-2 block">
                  {content}
                </Link>
              ) : (
                <button key={item.id} onClick={() => markRead(item.id)} className="mb-2 block w-full text-left">
                  {content}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
