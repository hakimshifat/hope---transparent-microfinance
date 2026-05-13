import { FileImage, Save, UploadCloud, X } from "lucide-react";
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

  function handleDocumentUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file for the NID document.");
      return;
    }
    if (file.size > 900 * 1024) {
      setError("Document image must be under 900 KB for this MVP upload.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm((current) => ({ ...current, nidImageUrl: reader.result }));
    reader.readAsDataURL(file);
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

          <div className="md:col-span-2 rounded-2xl border border-white/10 bg-surfaceHighlight/30 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <FileImage className="h-4 w-4 text-primary-400" />
                  NID Document Upload
                </div>
                <p className="mt-1 text-sm text-slate-400">Upload a clear NID image for supervisor review. JPG or PNG under 900 KB is recommended.</p>
              </div>
              <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-primary-500/30 bg-primary-500/10 px-4 py-3 text-sm font-bold text-primary-300 transition-all hover:bg-primary-500/20">
                <UploadCloud className="h-4 w-4" />
                Choose document
                <input type="file" accept="image/*" className="sr-only" onChange={handleDocumentUpload} />
              </label>
            </div>

            {form.nidImageUrl ? (
              <div className="mt-5 grid gap-4 lg:grid-cols-[220px_1fr]">
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                  <img src={form.nidImageUrl} alt="Uploaded NID preview" className="h-36 w-full object-cover" />
                </div>
                <div className="flex flex-col justify-center gap-3">
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-300">
                    Document attached for verification.
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, nidImageUrl: "" })}
                    className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-slate-300 hover:bg-white/10"
                  >
                    <X className="h-4 w-4" />
                    Remove document
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-4 py-3.5 text-sm font-bold text-white shadow-glow hover:-translate-y-0.5 hover:shadow-lg transition-all md:col-span-2">
            <Save className="h-4 w-4" />
            Save profile
          </button>
        </form>
      </div>
    </div>
  );
}
