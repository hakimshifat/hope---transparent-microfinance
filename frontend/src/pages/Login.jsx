import { ArrowRight, LogIn, ShieldCheck, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import heroImg from "../assets/hero-mockup.png";

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form);
      navigate("/dashboard");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 flex w-full h-full min-h-[calc(100vh-80px)] overflow-hidden">
      {/* Form Section */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-24 xl:px-32 relative z-10">
        <div className="w-full max-w-md mx-auto">
          <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-glow mb-6">
              <LogIn className="h-8 w-8" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">Welcome Back</h1>
            <p className="text-base text-slate-400">Sign in to securely access your Hope account.</p>
          </div>

          {error ? (
            <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400 opacity-0 animate-fade-in-up">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-10 space-y-6 opacity-0 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-slate-300 ml-1">Phone or Email</label>
              <div className="relative group">
                <input
                  className="w-full rounded-2xl border border-white/10 bg-surfaceHighlight/40 px-5 py-4 text-slate-200 placeholder-slate-500 outline-none transition-all duration-300 focus:border-primary-500 focus:bg-white/5 focus:ring-4 focus:ring-primary-500/10 group-hover:border-white/20"
                  value={form.identifier}
                  onChange={(event) => setForm({ ...form, identifier: event.target.value })}
                  placeholder="Enter your credentials"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-semibold text-slate-300 ml-1">Password</label>
              <div className="relative group">
                <input
                  type="password"
                  className="w-full rounded-2xl border border-white/10 bg-surfaceHighlight/40 px-5 py-4 text-slate-200 placeholder-slate-500 outline-none transition-all duration-300 focus:border-primary-500 focus:bg-white/5 focus:ring-4 focus:ring-primary-500/10 group-hover:border-white/20"
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              disabled={loading}
              className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-primary-600 to-primary-500 px-4 py-4 text-base font-bold text-white shadow-glow transition-all duration-300 hover:shadow-lg hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-60 mt-4 flex items-center justify-center gap-2"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
              <span className="relative z-10">{loading ? "Authenticating..." : "Sign In to Dashboard"}</span>
              {!loading && <ArrowRight className="h-5 w-5 relative z-10 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <div className="mt-10 text-center text-sm font-medium text-slate-400 opacity-0 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            New borrower? <Link className="text-primary-400 hover:text-primary-300 transition-colors ml-1 relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-primary-400 hover:after:w-full after:transition-all after:duration-300" to="/register">Create an account</Link>
          </div>
        </div>
      </div>

      {/* Visual Presentation Section (Hidden on small screens) */}
      <div className="hidden lg:flex flex-1 relative bg-surfaceHighlight/20 items-center justify-center overflow-hidden border-l border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-accent-light/5"></div>
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-[100px] animate-blob pointer-events-none"></div>
        
        <div className="relative z-10 w-full max-w-xl p-12 perspective-1000 opacity-0 animate-scale-in" style={{ animationDelay: '200ms' }}>
          <div className="relative animate-float-slow">
            <img 
              src={heroImg} 
              alt="Dashboard Preview" 
              className="w-full rounded-3xl border border-white/10 shadow-glass-premium transform transition-all duration-500 hover:rotate-y-12 hover:scale-105"
            />
            
            {/* Floating Glass Panels */}
            <div className="absolute -left-10 bottom-10 glass-panel px-6 py-4 rounded-2xl flex items-center gap-4 shadow-glass animate-float" style={{ animationDelay: '1s' }}>
              <div className="bg-primary-500/20 p-3 rounded-xl border border-primary-500/30">
                <ShieldCheck className="h-6 w-6 text-primary-400" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">Bank-Grade Security</div>
                <div className="text-xs text-slate-400 mt-0.5">Your data is encrypted</div>
              </div>
            </div>

            <div className="absolute -right-8 top-16 glass-panel px-6 py-4 rounded-2xl flex items-center gap-4 shadow-glass animate-float" style={{ animationDelay: '2s' }}>
              <div className="bg-accent-light/20 p-3 rounded-xl border border-accent-light/30">
                <Zap className="h-6 w-6 text-accent-light" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">Lightning Fast</div>
                <div className="text-xs text-slate-400 mt-0.5">Instant ledger updates</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
