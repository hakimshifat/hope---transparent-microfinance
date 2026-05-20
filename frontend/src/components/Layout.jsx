import {
  BadgeDollarSign,
  BadgeCheck,
  Banknote,
  ClipboardList,
  CreditCard,
  FileCheck2,
  FileText,
  Home,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  PackagePlus,
  ReceiptText,
  ScrollText,
  ShieldCheck,
  Sun,
  UserCircle,
  UserPlus,
  Users,
  X
} from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { title } from "../utils/format";
import { useTheme } from "../context/ThemeContext";
import NotificationBell from "./NotificationBell";

function publicLinks() {
  return [
    { to: "/", label: "Home", icon: Home },
    { to: "/about", label: "About", icon: FileText }
  ];
}

function roleLinks(role) {
  if (role === "borrower") {
    return [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/profile", label: "Profile", icon: UserCircle },
      { to: "/loan-products", label: "Loan Products", icon: Landmark },
      { to: "/mock-payment", label: "Mock Payment", icon: CreditCard },
      { to: "/ledger", label: "Ledger", icon: ClipboardList },
      { to: "/receipts", label: "Receipts", icon: ReceiptText }
    ];
  }

  if (role === "field_officer") {
    return [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/field/cases", label: "Assigned Cases", icon: Users }
    ];
  }

  const supervisorTabs = [
    { to: "/borrower-verification", label: "Borrower Verification", icon: Users },
    { to: "/loan-applications",     label: "Loan Applications",     icon: ClipboardList },
    { to: "/dashboard?tab=payments",   label: "Pending Payments",      icon: FileCheck2, tab: "payments" },
    { to: "/dashboard?tab=overdue",    label: "Overdue Cases",         icon: BadgeCheck,  tab: "overdue" },
    { to: "/dashboard?tab=field_logs", label: "Field Officer Logs",    icon: ClipboardList, tab: "field_logs" },
    { to: "/dashboard?tab=audit",      label: "Audit Logs",            icon: ScrollText,  tab: "audit" }
  ];

  if (role === "supervisor") return supervisorTabs;

  if (role === "admin") {
    return [
      ...supervisorTabs,
      { to: "/dashboard?tab=users",    label: "User Management", icon: UserPlus,    tab: "users" },
      { to: "/dashboard?tab=products", label: "Loan Products",   icon: PackagePlus, tab: "products" }
    ];
  }

  return [];
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const { dark, toggle: toggleTheme } = useTheme();
  const links = user ? roleLinks(user.role) : publicLinks();
  const currentTab = new URLSearchParams(location.search).get("tab");

  function handleLogout() {
    logout();
    navigate("/");
  }

  const nav = (
    <nav className="flex flex-wrap items-center gap-2">
      {links.map(({ to, label, icon: Icon, tab }, index) => {
        const isActive = tab
          ? currentTab === tab || (!currentTab && index === 0)
          : location.pathname === to.split("?")[0] && !currentTab;
        return (
          <NavLink
            key={to}
            to={to}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300 opacity-0 animate-fade-in-up whitespace-nowrap ${
              isActive
                ? "bg-primary-500/10 text-primary-400 border border-primary-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent"
            }`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        );
      })}
    </nav>
  );

  const isFullScreenRoute = ["/", "/login", "/register"].includes(location.pathname);

  return (
    <div className="min-h-screen bg-background text-slate-200 flex flex-col">
      {/* Dynamic Background Blob */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary-500/10 rounded-full blur-[100px] animate-blob"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-accent-light/10 rounded-full blur-[100px] animate-blob" style={{ animationDelay: '2s' }}></div>
      </div>

      <header className="sticky top-0 z-30 border-b border-white/5 bg-background/60 backdrop-blur-xl no-print">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 lg:px-8 py-4">
          <NavLink to={user ? "/dashboard" : "/"} className="flex items-center gap-4 group opacity-0 animate-fade-in-up">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-glow group-hover:scale-105 transition-transform duration-300">
              <BadgeDollarSign className="h-7 w-7" />
            </div>
            <div>
              <div className="text-xl font-bold text-white tracking-tight">Hope</div>
              <div className="text-xs font-medium text-primary-400 uppercase tracking-wider">Transparent Microfinance</div>
            </div>
          </NavLink>

          <div className="hidden items-center gap-4 md:flex opacity-0 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            {user ? (
              <>
                <div className="glass-panel-light rounded-full px-4 py-2 text-sm flex items-center gap-2">
                  <span className="font-semibold text-white">{user.fullName}</span>
                  <span className="h-1 w-1 bg-primary-500 rounded-full"></span>
                  <span className="text-primary-300">{title(user.role)}</span>
                </div>
                <NotificationBell />
                <button
                  onClick={toggleTheme}
                  className="rounded-full border border-white/10 bg-white/5 p-2.5 text-slate-300 hover:bg-white/10 hover:text-white transition-all duration-300 hover:rotate-180"
                  aria-label="Toggle theme"
                  title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={toggleTheme}
                  className="rounded-full border border-white/10 bg-white/5 p-2.5 text-slate-300 hover:bg-white/10 hover:text-white transition-all duration-300 hover:rotate-180"
                  aria-label="Toggle theme"
                >
                  {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
                <NavLink className="rounded-full px-5 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors" to="/login">
                  Login
                </NavLink>
                <NavLink className="rounded-full bg-gradient-to-r from-primary-600 to-primary-500 px-6 py-2 text-sm font-bold text-white shadow-glow hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300" to="/register">
                  Register
                </NavLink>
              </>
            )}
          </div>

          <button
            className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-300 md:hidden hover:bg-white/10 transition-colors opacity-0 animate-fade-in-up"
            onClick={() => setOpen((value) => !value)}
            aria-label="Toggle navigation"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Nav Absolute Dropdown for Full-Screen Routes */}
      {open && isFullScreenRoute && (
        <div className="absolute top-24 left-4 right-4 z-40 glass-panel rounded-2xl p-4 md:hidden no-print opacity-0 animate-scale-in">
          {nav}
        </div>
      )}

      {isFullScreenRoute ? (
        <main className="flex-1 w-full relative z-10 flex flex-col">
          <Outlet />
        </main>
      ) : (
        <div className="mx-auto w-full max-w-[1600px] px-4 lg:px-8 py-8 relative z-10 flex-1 flex flex-col gap-6">
          <div className="hidden md:block no-print">
            <div className="glass-panel rounded-2xl p-2 opacity-0 animate-fade-in-up overflow-x-auto custom-scrollbar" style={{ animationDelay: '200ms' }}>
              {nav}
            </div>
          </div>

          {open && (
            <div className="glass-panel rounded-2xl p-4 md:hidden no-print mb-6 opacity-0 animate-scale-in">
              {user ? (
                <div className="mb-4 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-white">{user.fullName}</div>
                    <div className="text-xs font-medium text-primary-300">{title(user.role)}</div>
                  </div>
                  <NotificationBell compact />
                </div>
              ) : null}
              {nav}
              <div className="mt-4 border-t border-white/10 pt-4">
                {user ? (
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-colors opacity-0 animate-fade-in-up"
                    style={{ animationDelay: `${links.length * 50}ms` }}
                  >
                    <LogOut className="h-5 w-5" />
                    Logout
                  </button>
                ) : null}
              </div>
            </div>
          )}

          <main className="min-w-0 flex-1">
            <Outlet />
          </main>
        </div>
      )}
    </div>
  );
}
