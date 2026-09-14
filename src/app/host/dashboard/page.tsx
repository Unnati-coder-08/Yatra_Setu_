"use client";

import { useCallback, useEffect, useState } from "react";
import type { Booking } from "@/lib/types";
import { useAuth } from "@/lib/useAuth";

interface Listing {
  id: number;
  kind: string;
  title: string;
  dest_slug: string;
  price: number;
  langs: string;
  tagline: string;
  status: string;
}

interface DestLite {
  slug: string;
  name: string;
  state: string;
}

export default function HostDashboard() {
  const { user, loading } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [hosting, setHosting] = useState<Booking[]>([]);
  const [earnings, setEarnings] = useState({ confirmed_total: 0, pending_total: 0, requests: 0 });
  const [dests, setDests] = useState<DestLite[]>([]);
  const [ready, setReady] = useState(false);

  // form state
  const [kind, setKind] = useState<"guide" | "homestay" | "experience">("guide");
  const [title, setTitle] = useState("");
  const [destSlug, setDestSlug] = useState("");
  const [price, setPrice] = useState(1000);
  const [langs, setLangs] = useState("Hindi, English");
  const [tagline, setTagline] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [l, b, e, d] = await Promise.all([
      fetch("/api/host/listings").then((r) => r.json()),
      fetch("/api/bookings").then((r) => r.json()),
      fetch("/api/host/earnings").then((r) => r.json()),
      fetch("/api/destinations").then((r) => r.json()),
    ]);
    setListings(l.listings || []);
    setHosting(b.hosting || []);
    setEarnings(e.earnings || { confirmed_total: 0, pending_total: 0, requests: 0 });
    setDests(d.destinations || []);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = "/login";
      return;
    }
    if (user) load();
  }, [user, loading, load]);

  async function respond(id: number, status: "confirmed" | "declined") {
    await fetch(`/api/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  async function createListing() {
    if (!title || !destSlug) {
      setMsg("Pick a destination and give your listing a name.");
      return;
    }
    setBusy(true);
    setMsg("");
    const r = await fetch("/api/host/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, title, dest_slug: destSlug, price, langs, tagline }),
    });
    setBusy(false);
    if (r.ok) {
      setTitle("");
      setTagline("");
      setMsg("Listing published! Travellers can now find it on the destination page. ✅");
      load();
    } else {
      const d = await r.json().catch(() => ({}));
      setMsg(d.error || "Could not create listing");
    }
  }

  async function removeListing(id: number) {
    await fetch(`/api/host/listings/${id}`, { method: "DELETE" });
    load();
  }

  if (!ready) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="h-10 w-72 animate-pulse rounded-xl bg-slate-200" />
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <p className="text-sm font-semibold text-teal-700">Host Console</p>
      <h1 className="mt-0.5 text-3xl font-extrabold tracking-tight text-slate-900">
        {user?.name.split(" ")[0]}, your community is waiting
      </h1>

      {/* earnings */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="card bg-gradient-to-br from-teal-700 to-teal-600 !border-0 p-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-100">Confirmed earnings</p>
          <p className="mt-1 text-3xl font-extrabold">₹{earnings.confirmed_total.toLocaleString("en-IN")}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Pending requests value</p>
          <p className="mt-1 text-3xl font-extrabold text-slate-900">₹{earnings.pending_total.toLocaleString("en-IN")}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total requests</p>
          <p className="mt-1 text-3xl font-extrabold text-slate-900">{earnings.requests}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* requests */}
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-bold text-slate-900">Incoming requests</h2>
            <p className="text-xs text-slate-400">Travellers who want your local superpower.</p>
            <div className="mt-4 space-y-3">
              {hosting.length === 0 && (
                <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-400">
                  No requests yet. Publish a listing and travellers will find you.
                </p>
              )}
              {hosting.map((b) => (
                <div key={b.id} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-lg shadow-sm">
                      {b.kind === "guide" ? "🤝" : b.kind === "homestay" ? "🏠" : "🎟️"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-800">{b.title}</p>
                      <p className="text-xs text-slate-500">
                        {b.date || "flexible"} · {b.guests} guests · ₹{b.amount.toLocaleString("en-IN")}
                      </p>
                    </div>
                    {b.status === "pending" ? (
                      <div className="flex gap-2">
                        <button onClick={() => respond(b.id, "confirmed")} className="btn-primary !px-4 !py-2 text-xs">
                          Accept
                        </button>
                        <button onClick={() => respond(b.id, "declined")} className="btn-ghost !text-rose-600 hover:!bg-rose-50">
                          Decline
                        </button>
                      </div>
                    ) : (
                      <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${
                        b.status === "confirmed" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-600"
                      }`}>
                        {b.status}
                      </span>
                    )}
                  </div>
                  {b.note && <p className="mt-2.5 rounded-lg bg-white px-3 py-2 text-xs italic text-slate-500">&ldquo;{b.note}&rdquo;</p>}
                </div>
              ))}
            </div>
          </div>

          {/* my listings */}
          <div className="card p-6">
            <h2 className="text-lg font-bold text-slate-900">My listings</h2>
            <div className="mt-4 space-y-2.5">
              {listings.length === 0 && <p className="text-sm text-slate-400">Nothing listed yet — create your first on the right.</p>}
              {listings.map((l) => (
                <div key={l.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3.5">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-teal-50 text-base">
                    {l.kind === "guide" ? "🤝" : l.kind === "homestay" ? "🏠" : "🎟️"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-800">{l.title}</p>
                    <p className="text-xs text-slate-500 capitalize">
                      {l.kind} · {l.dest_slug} · ₹{l.price.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <span className="tag">{l.status}</span>
                  <button onClick={() => removeListing(l.id)} className="text-slate-300 hover:text-rose-500" aria-label="Delete">✕</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* create listing form */}
        <aside>
          <div className="card sticky top-20 p-6">
            <h2 className="text-lg font-bold text-slate-900">Create a listing</h2>
            <div className="mt-4 space-y-4">
              <div>
                <span className="label">What are you offering?</span>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      ["guide", "🤝 Guide"],
                      ["homestay", "🏠 Stay"],
                      ["experience", "🎟️ Activity"],
                    ] as const
                  ).map(([k, label]) => (
                    <button
                      key={k}
                      onClick={() => { setKind(k); setPrice(k === "homestay" ? 1500 : 1000); }}
                      className={`rounded-xl border-2 px-2 py-2.5 text-xs font-bold transition ${
                        kind === k ? "border-teal-600 bg-teal-50/60 text-teal-800" : "border-slate-200 text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className="label">Listing name</span>
                <input className="input" placeholder="e.g. Old Town Food Walks" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <span className="label">Destination</span>
                <select className="input" value={destSlug} onChange={(e) => setDestSlug(e.target.value)}>
                  <option value="">Choose your town / region</option>
                  {dests.map((d) => (
                    <option key={d.slug} value={d.slug}>{d.name} — {d.state}</option>
                  ))}
                </select>
              </div>
              <div>
                <span className="label">Your price (₹)</span>
                <input type="number" className="input" min={0} step={100} value={price} onChange={(e) => setPrice(Number(e.target.value))} />
              </div>
              {kind === "guide" && (
                <div>
                  <span className="label">Languages you speak</span>
                  <input className="input" value={langs} onChange={(e) => setLangs(e.target.value)} />
                </div>
              )}
              <div>
                <span className="label">One-line pitch</span>
                <textarea className="input h-20 resize-none" placeholder="What makes your offer special?" value={tagline} onChange={(e) => setTagline(e.target.value)} />
              </div>
              {msg && <p className={`text-sm ${msg.includes("✅") ? "text-teal-700" : "text-rose-600"}`}>{msg}</p>}
              <button className="btn-primary w-full" disabled={busy} onClick={createListing}>
                {busy ? "Publishing…" : "🚀 Publish listing"}
              </button>
              <p className="text-center text-[11px] text-slate-400">
                Goes live instantly on the destination page (prototype behaviour).
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
