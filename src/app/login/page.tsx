"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import { fileToShrunkDataUrl } from "@/lib/image";

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { login, signup, refresh } = useAuth();
  const [tab, setTab] = useState<"login" | "signup">(params.get("tab") === "signup" ? "signup" : "login");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"traveler" | "host" | "guide">("traveler");
  const [idType, setIdType] = useState("aadhaar");
  const [idDoc, setIdDoc] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function doLogin(demoEmail?: string, demoPw?: string) {
    setBusy(true);
    setError("");
    const r = await login(demoEmail || email, demoPw || password);
    setBusy(false);
    if (r.ok) router.push("/dashboard");
    else setError(r.error || "Login failed");
  }

  async function doSignup() {
    setBusy(true);
    setError("");
    // Guides register through the ID-verification endpoint
    if (role === "guide") {
      if (!idDoc) {
        setBusy(false);
        setError("Please attach a photo of your ID document to verify your guide profile.");
        return;
      }
      const r = await fetch("/api/auth/guide-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, city, password, id_doc_type: idType, id_doc: idDoc }),
      });
      setBusy(false);
      const d = await r.json().catch(() => ({}));
      if (r.ok) {
        await refresh();
        router.push("/host/dashboard");
      } else {
        setError(d.error || "Guide registration failed");
      }
      return;
    }
    const r = await signup({ name, email, phone, city, password, role });
    setBusy(false);
    if (r.ok) router.push(role === "host" ? "/host" : "/dashboard");
    else setError(r.error || "Signup failed");
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-2">
      {/* left visual */}
      <div className="relative hidden overflow-hidden rounded-3xl lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1566837945700-30057527ade0?auto=format&fit=crop&w=1200&q=80"
          alt="Dal Lake, Kashmir"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-teal-950/85 via-teal-900/30 to-transparent" />
        <div className="absolute bottom-0 p-8">
          <p className="text-2xl font-extrabold leading-snug text-white">
            &ldquo;Travel through the eyes of a local,<br />not just the eyes of a tourist.&rdquo;
          </p>
          <p className="mt-3 text-sm text-teal-200">— The Yatra Setu promise</p>
        </div>
      </div>

      {/* right form */}
      <div className="card p-7 sm:p-9">
        <div className="grid grid-cols-2 gap-1 rounded-full bg-slate-100 p-1">
          {(["login", "signup"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full py-2.5 text-sm font-bold transition ${
                tab === t ? "bg-white text-teal-800 shadow" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t === "login" ? "Login" : "Sign Up"}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-4">
          {tab === "signup" && (
            <>
              <div>
                <span className="label">Full name</span>
                <input className="input" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="label">Mobile</span>
                  <input className="input" placeholder="98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div>
                  <span className="label">City</span>
                  <input className="input" placeholder="Delhi" value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
              </div>
            </>
          )}
          <div>
            <span className="label">Email or mobile number</span>
            <input
              className="input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
            />
          </div>
          <div>
            <span className="label">Password</span>
            <input
              className="input"
              placeholder="••••••••"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (tab === "login" ? password && email && doLogin() : null)}
            />
          </div>
          {tab === "signup" && (              <div>
                <span className="label">I am a</span>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      ["traveler", "🧳", "Traveller", "Explore & plan"],
                      ["host", "🏠", "Local Host", "Stay & earn"],
                      ["guide", "🛡️", "Local Guide", "ID-verified ✓"],
                    ] as const
                  ).map(([val, icon, label, sub]) => (
                    <button
                      key={val}
                      onClick={() => setRole(val)}
                      className={`rounded-2xl border-2 p-3 text-left transition ${
                        role === val ? "border-teal-600 bg-teal-50/60" : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <p className="text-xl">{icon}</p>
                      <p className="mt-1 text-sm font-bold text-slate-800">{label}</p>
                      <p className="text-[10px] text-slate-500">{sub}</p>
                    </button>
                  ))}
                </div>
                {role === "guide" && (
                  <p className="mt-2 rounded-lg bg-teal-50/70 px-3 py-2 text-[11px] leading-relaxed text-teal-800">
                    🛡️ Guides verify their identity with a government ID — travellers see a <b>Verified Guide ✓</b> badge on your profile before connecting.
                  </p>
                )}
              </div>
          )}

          {tab === "signup" && role === "guide" && (
            <div className="space-y-3 rounded-2xl border border-teal-100 bg-teal-50/40 p-4">
              <p className="text-sm font-bold text-slate-800">🪪 Identity verification</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="label">ID type</span>
                  <select className="input" value={idType} onChange={(e) => setIdType(e.target.value)}>
                    <option value="aadhaar">Aadhaar</option>
                    <option value="pan">PAN card</option>
                    <option value="driving_license">Driving licence</option>
                    <option value="voter_id">Voter ID</option>
                    <option value="passport">Passport</option>
                  </select>
                </div>
                <div>
                  <span className="label">ID photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="input !py-2 text-xs"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (f) setIdDoc(await fileToShrunkDataUrl(f, 1000));
                    }}
                  />
                </div>
              </div>
              {idDoc && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={idDoc} alt="ID preview" className="h-20 rounded-xl border border-slate-200 object-cover" />
              )}
            </div>
          )}

          {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

          <button
            className="btn-primary w-full"
            disabled={busy}
            onClick={() => (tab === "login" ? doLogin() : doSignup())}
          >
            {busy ? "Please wait…" : tab === "login" ? "Login" : role === "guide" ? "Verify & create guide account" : "Create account"}
          </button>

          <div className="relative py-1 text-center">
            <span className="relative z-10 bg-white px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              or try a demo account
            </span>
            <span className="absolute left-0 top-1/2 h-px w-full bg-slate-200" />
          </div>

          <div className="grid gap-2.5">
            <button className="btn-outline !py-2.5 text-sm" disabled={busy} onClick={() => doLogin("aarav@demo.in", "demo1234")}>
              🧳 Enter as Aarav (Traveller)
            </button>
            <button className="btn-outline !py-2.5 text-sm" disabled={busy} onClick={() => doLogin("meera@demo.in", "demo1234")}>
              🏠 Enter as Meera (Homestay Host)
            </button>
            <button className="btn-outline !py-2.5 text-sm" disabled={busy} onClick={() => doLogin("tsering@demo.in", "demo1234")}>
              🏔️ Enter as Tsering (Guide Host)
            </button>
          </div>
          <p className="text-center text-xs text-slate-400">
            Demo accounts are pre-seeded with trips, bookings and earnings.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400">Loading…</div>}>
      <LoginInner />
    </Suspense>
  );
}
