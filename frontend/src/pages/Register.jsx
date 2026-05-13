import { ArrowRight, UserPlus, FileCheck2, CreditCard, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import heroImg from "../assets/hero-mockup.png";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", phone: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form);
      navigate("/profile");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 flex w-full h-full min-h-[calc(100vh-80px)] overflow-hidden">
      {/* Visual Presentation Section (Hidden on small screens) */}
      <div className="hidden lg:flex flex-1 relative bg-surfaceHighlight/20 items-center justify-center overflow-hidden border-r border-white/5">
        <div className="absolute inset-0 bg-gradient-to-tr from-accent-light/5 to-primary-500/5"></div>
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-accent-light/20 rounded-full blur-[100px] animate-blob pointer-events-none"></div>
        
        <div className="relative z-10 w-full max-w-lg px-12 opacity-0 animate-slide-in-right" style={{ animationDelay: '200ms', transformOrigin: 'left' }}>
          <h2 className="text-4xl font-extrabold text-white mb-6 leading-tight">
            Join the Future of <br/><span className="text-gradient">Microfinance</span>
          </h2>
          <p className="text-lg text-slate-400 mb-12">
            Create your account today and experience a completely transparent, hassle-free loan management system.
          </p>

          <div className="space-y-6">
            {[
              { title: "Apply Instantly", desc: "Browse products and submit loan requests seamlessly.", icon: FileCheck2, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20" },
              { title: "Transparent Ledger", desc: "Track every payment and overdue balance in real-time.", icon: ShieldCheck, color: "text-primary-400", bg: "bg-primary-500/10", border: "border-primary-500/20" },
              { title: "Easy Mock Payments", desc: "Simulate repayments instantly through our mock portal.", icon: CreditCard, color: "text-accent-light", bg: "bg-accent-light/10", border: "border-accent-light/20" }
            ].map((feature, i) => (
              <div key={i} className="glass-panel px-6 py-5 rounded-2xl flex items-center gap-5 transform transition-all duration-300 hover:scale-105 hover:bg-white/10 cursor-default">
                <div className={`p-3 rounded-xl ${feature.bg} ${feature.border} border`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{feature.title}</h3>
                  <p className="text-sm text-slate-400 mt-1">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-24 xl:px-32 relative z-10">
        <div className="w-full max-w-md mx-auto">
          <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-glow mb-6">
              <UserPlus className="h-8 w-8" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">Create Account</h1>
            <p className="text-base text-slate-400">Register as a borrower to start your journey.</p>
          </div>

          {error ? (
            <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400 opacity-0 animate-fade-in-up">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5 opacity-0 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-slate-300 ml-1">Full Name</label>
                <input
                  type="text"
                  className="w-full rounded-2xl border border-white/10 bg-surfaceHighlight/40 px-5 py-3.5 text-slate-200 placeholder-slate-500 outline-none transition-all duration-300 focus:border-primary-500 focus:bg-white/5 focus:ring-4 focus:ring-primary-500/10 hover:border-white/20"
                  value={form.fullName}
                  onChange={(event) => setForm({ ...form, fullName: event.target.value })}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-slate-300 ml-1">Phone</label>
                <input
                  type="tel"
                  className="w-full rounded-2xl border border-white/10 bg-surfaceHighlight/40 px-5 py-3.5 text-slate-200 placeholder-slate-500 outline-none transition-all duration-300 focus:border-primary-500 focus:bg-white/5 focus:ring-4 focus:ring-primary-500/10 hover:border-white/20"
                  value={form.phone}
                  onChange={(event) => setForm({ ...form, phone: event.target.value })}
                  placeholder="+880 1XXX"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-semibold text-slate-300 ml-1">Email <span className="text-slate-500 font-normal">(Optional)</span></label>
              <input
                type="email"
                className="w-full rounded-2xl border border-white/10 bg-surfaceHighlight/40 px-5 py-4 text-slate-200 placeholder-slate-500 outline-none transition-all duration-300 focus:border-primary-500 focus:bg-white/5 focus:ring-4 focus:ring-primary-500/10 hover:border-white/20"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                placeholder="john@example.com"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-semibold text-slate-300 ml-1">Password</label>
              <input
                type="password"
                className="w-full rounded-2xl border border-white/10 bg-surfaceHighlight/40 px-5 py-4 text-slate-200 placeholder-slate-500 outline-none transition-all duration-300 focus:border-primary-500 focus:bg-white/5 focus:ring-4 focus:ring-primary-500/10 hover:border-white/20"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            <button
              disabled={loading}
              className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-primary-600 to-primary-500 px-4 py-4 text-base font-bold text-white shadow-glow transition-all duration-300 hover:shadow-lg hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-60 mt-6 flex items-center justify-center gap-2"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
              <span className="relative z-10">{loading ? "Creating account..." : "Complete Registration"}</span>
              {!loading && <ArrowRight className="h-5 w-5 relative z-10 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <div className="mt-8 text-center text-sm font-medium text-slate-400 opacity-0 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            Already have an account? <Link className="text-primary-400 hover:text-primary-300 transition-colors ml-1 relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-primary-400 hover:after:w-full after:transition-all after:duration-300" to="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
