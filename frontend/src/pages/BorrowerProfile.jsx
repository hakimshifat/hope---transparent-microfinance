import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../api/client";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";

const emptyProfile = { fullName: "", phone: "", address: "", occupation: "", monthlyIncome: "", nidNumber: "", nidImageUrl: "", nomineeName: "", nomineePhone: "" };

export default function BorrowerProfile() {
  const { user } = useAuth();
  const [form, setForm] = useState({ ...emptyProfile, fullName: user.fullName, phone: user.phone });
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    async function loadProfile() {
      try {
        const { data } = await api.get("/borrowers/me");
        if (!ignore) { setProfile(data); setForm({ fullName: data.fullName || user.fullName, phone: data.phone || user.phone, address: data.address || "", occupation: data.occupation || "", monthlyIncome: data.monthlyIncome || "", nidNumber: data.nidNumber || "", nidImageUrl: data.nidImageUrl || "", nomineeName: data.nomineeName || "", nomineePhone: data.nomineePhone || "" }); }
      } catch { if (!ignore) setProfile(null); }
      finally { if (!ignore) setLoading(false); }
    }
    loadProfile();
    return () => { ignore = true; };
  }, [user.fullName, user.phone]);

  async function handleSubmit(event) {
    event.preventDefault(); setMessage(""); setError("");
    try {
      const payload = { ...form, monthlyIncome: Number(form.monthlyIncome) };
      const { data } = profile ? await api.patch("/borrowers/profile", payload) : await api.post("/borrowers/profile", payload);
      setProfile(data);
      setMessage("Profile saved. Verification status is pending until review.");
    } catch (err) { setError(getErrorMessage(err)); }
  }

  if (loading) return <div className="glass-panel rounded-2xl p-8 text-center text-slate-400 animate-scale-in">Loading profile...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between opacity-0 animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Borrower Profile</h1>
          <p className="mt-1 text-base text-slate-400">Profile must be complete before loan application.</p>
        </div>
        <StatusBadge value={profile?.verificationStatus || "pending"} />
      </div>

      <div className="glass-panel rounded-2xl p-6 opacity-0 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        {message ? <div className="mb-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-400">{message}</div> : null}
        {error ? <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400">{error}</div> : null}

        <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
          {[
            ["fullName", "Full name", "text", true, false],
            ["phone", "Phone", "tel", true, false],
            ["address", "Address", "text", true, true],
            ["occupation", "Occupation", "text", true, false],
            ["monthlyIncome", "Monthly income (৳)", "number", true, false],
            ["nidNumber", "NID number", "text", true, false],
            ["nidImageUrl", "NID image URL", "text", false, false],
            ["nomineeName", "Nominee name", "text", false, false],
            ["nomineePhone", "Nominee phone", "tel", false, false]
          ].map(([name, label, type, required, full]) => (
            <label className={full ? "md:col-span-2" : ""} key={name}>
              <span className="mb-2 block text-sm font-medium text-slate-300">{label}</span>
              <input
                type={type}
                className="w-full rounded-xl border border-white/10 bg-surfaceHighlight/50 px-4 py-3 text-slate-200 placeholder-slate-500 outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                value={form[name]}
                onChange={(e) => setForm({ ...form, [name]: e.target.value })}
                required={required}
                min={type === "number" ? 0 : undefined}
              />
            </label>
          ))}
          <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-4 py-3.5 text-sm font-bold text-white shadow-glow hover:-translate-y-0.5 hover:shadow-lg transition-all md:col-span-2">
            <Save className="h-4 w-4" />
            Save profile
          </button>
        </form>
      </div>
    </div>
  );
}
