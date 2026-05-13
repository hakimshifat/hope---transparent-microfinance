import { ArrowRight, BadgeCheck, ClipboardList, CreditCard, Shield, ShieldCheck, TrendingUp, Users, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import heroImg from "../assets/hero-mockup.png";

export default function Home() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    activeBorrowers: "...",
    loansDisbursed: "...",
    collectionRate: "...",
    auditedLedgers: "..."
  });

  useEffect(() => {
    api.get("/stats/public")
      .then(({ data }) => {
        const compactFormatter = new Intl.NumberFormat("en-BD", { notation: "compact", maximumFractionDigits: 1 });
        setStats({
          activeBorrowers: `${compactFormatter.format(data.activeBorrowers)}+`,
          loansDisbursed: `৳${compactFormatter.format(data.loansDisbursed)}+`,
          collectionRate: `${data.collectionRate}%`,
          auditedLedgers: `${data.auditedLedgers}%`
        });
      })
      .catch((err) => console.error("Failed to load public stats", err));
  }, []);

  return (
    <div className="space-y-20 pb-20 overflow-hidden mx-auto max-w-[1600px] px-4 lg:px-8">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center pt-10">
        {/* Background Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-[120px] mix-blend-screen animate-blob pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-light/20 rounded-full blur-[120px] mix-blend-screen animate-blob pointer-events-none" style={{ animationDelay: '2s' }}></div>

        <div className="grid lg:grid-cols-2 gap-12 items-center w-full relative z-10">
          <div className="flex flex-col justify-center space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-500/30 bg-primary-500/10 px-5 py-2 text-sm font-semibold text-primary-300 w-fit opacity-0 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              <Zap className="h-4 w-4 text-primary-400 animate-pulse" />
              Next-Gen Microfinance Platform
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight text-white opacity-0 animate-slide-in-right" style={{ animationDelay: '200ms' }}>
              Hope: <br />
              <span className="text-gradient">Transparent</span> <br />
              Loan Management
            </h1>
            
            <p className="max-w-xl text-lg sm:text-xl leading-relaxed text-slate-400 opacity-0 animate-slide-in-right" style={{ animationDelay: '300ms' }}>
              Role-based loan applications, schedule generation, mock repayments, borrower ledger transparency, and overdue case follow-up in one unified, aesthetic system.
            </p>
            
            <div className="flex flex-col gap-4 sm:flex-row opacity-0 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
              <Link
                to={user ? "/dashboard" : "/register"}
                className="group relative inline-flex items-center justify-center gap-3 rounded-full bg-gradient-to-r from-primary-600 to-primary-400 px-8 py-4 text-lg font-bold text-white shadow-glow hover:shadow-glow-accent hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                <span className="relative z-10">{user ? "Open Dashboard" : "Register Borrower"}</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform relative z-10" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-8 py-4 text-lg font-bold text-slate-300 hover:bg-white/10 hover:border-white/40 hover:text-white hover:-translate-y-1 transition-all duration-300"
              >
                Login to Account
              </Link>
            </div>
          </div>

          <div className="relative lg:h-[600px] flex items-center justify-center opacity-0 animate-scale-in" style={{ animationDelay: '400ms' }}>
            {/* 3D Floating Mockup */}
            <div className="relative w-full max-w-lg animate-float-slow" style={{ perspective: '1000px' }}>
              <div className="absolute inset-0 bg-gradient-to-tr from-primary-500/20 to-accent-light/20 blur-3xl transform rotate-12 scale-110"></div>
              <img 
                src={heroImg} 
                alt="Hope Platform Dashboard Abstract" 
                className="relative z-10 w-full h-auto rounded-3xl border border-white/10 shadow-glass-premium transition-transform duration-700 hover:scale-105"
                style={{ transform: 'rotateY(-5deg) rotateX(5deg)' }}
              />
              
              {/* Floating badges */}
              <div className="absolute -right-8 top-10 glass-panel-light px-4 py-3 rounded-2xl flex items-center gap-3 animate-float" style={{ animationDelay: '1s' }}>
                <div className="bg-primary-500/20 p-2 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-primary-400" />
                </div>
                <div>
                  <div className="text-xs text-slate-400">Recovery Rate</div>
                  <div className="text-sm font-bold text-white">98.5%</div>
                </div>
              </div>

              <div className="absolute -left-12 bottom-20 glass-panel-light px-4 py-3 rounded-2xl flex items-center gap-3 animate-float" style={{ animationDelay: '2.5s' }}>
                <div className="bg-accent-light/20 p-2 rounded-lg">
                  <Shield className="h-5 w-5 text-accent-light" />
                </div>
                <div>
                  <div className="text-xs text-slate-400">Secure Ledger</div>
                  <div className="text-sm font-bold text-white">Verified</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 pt-10 border-t border-white/5">
        <div className="text-center mb-16 opacity-0 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">A Complete Microfinance Ecosystem</h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">Designed for transparency and efficiency across all roles.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            { title: "Borrower Portal", icon: Users, body: "Apply for loans, pay installments easily, and view your completely transparent ledger and receipt history.", delay: 700, color: "text-blue-400", bg: "bg-blue-400/10", border: "group-hover:border-blue-400/50" },
            { title: "Supervisor Ops", icon: ShieldCheck, body: "Approve loans with confidence, review detailed payments, and strategically assign overdue cases.", delay: 800, color: "text-accent-light", bg: "bg-accent-light/10", border: "group-hover:border-accent-light/50" },
            { title: "Field Officer App", icon: ClipboardList, body: "Handle assigned overdue borrowers, navigate to locations, and seamlessly submit detailed visit logs.", delay: 900, color: "text-purple-400", bg: "bg-purple-400/10", border: "group-hover:border-purple-400/50" }
          ].map((role) => (
            <div key={role.title} className={`glass-panel rounded-3xl p-8 hover-lift group opacity-0 animate-fade-in-up ${role.border}`} style={{ animationDelay: `${role.delay}ms` }}>
              <div className={`h-14 w-14 rounded-2xl ${role.bg} border border-white/5 flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6`}>
                 <role.icon className={`h-7 w-7 ${role.color}`} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 tracking-wide group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-400 transition-colors">{role.title}</h3>
              <p className="text-base leading-relaxed text-slate-400">{role.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="mt-20">
        <div className="glass-panel-light rounded-3xl p-10 relative overflow-hidden opacity-0 animate-scale-in" style={{ animationDelay: '1000ms' }}>
          <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-accent-light/10 pointer-events-none"></div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 relative z-10">
            {[
              { icon: Users, label: "Active Borrowers", value: stats.activeBorrowers, color: "text-blue-400" },
              { icon: ClipboardList, label: "Loans Disbursed", value: stats.loansDisbursed, color: "text-purple-400" },
              { icon: CreditCard, label: "Collection Rate", value: stats.collectionRate, color: "text-primary-400" },
              { icon: BadgeCheck, label: "Audited Ledgers", value: stats.auditedLedgers, color: "text-accent-light" }
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="flex flex-col items-center text-center group">
                <Icon className={`h-10 w-10 ${color} mb-4 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300`} />
                <div className="text-4xl font-extrabold text-white mb-2">{value}</div>
                <div className="text-sm font-medium text-slate-400 uppercase tracking-widest">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
