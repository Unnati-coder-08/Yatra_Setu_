"use client";

import { useCallback, useEffect, useState } from "react";
import type { Booking } from "@/lib/types";
import { useAuth } from "@/lib/useAuth";
import { fileToShrunkDataUrl } from "@/lib/image";

interface Listing {
  id: number;
  kind: string;
  title: string;
  dest_slug: string;
  price: number;
  langs: string;
  tagline: string;
  img: string;
  images: string[];
  status: string;
}

interface PlaceListing {
  id: number;
  kind: "place";
  title: string;
  dest_slug: string;
  price: number;
  desc: string;
  img: string;
  dur: string;
}

interface DestLite {
  slug: string;
  name: string;
  state: string;
}

const ID_TYPES = [
  ["aadhaar", "Aadhaar"],
  ["pan", "PAN card"],
  ["driving_license", "Driving licence"],
  ["voter_id", "Voter ID"],
  ["passport", "Passport"],
] as const;

export default function HostDashboard() {
  const { user, loading, refresh } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [places, setPlaces] = useState<PlaceListing[]>([]);
  const [hosting, setHosting] = useState<Booking[]>([]);
  const [earnings, setEarnings] = useState({ confirmed_total: 0, pending_total: 0, requests: 0 });
  const [dests, setDests] = useState<DestLite[]>([]);
  const [ready, setReady] = useState(false);

  // form state
  const [kind, setKind] = useState<"guide" | "homestay" | "experience" | "place">("guide");
  const [title, setTitle] = useState("");
  const [destSlug, setDestSlug] = useState("");
  const [price, setPrice] = useState(1000);
  const [langs, setLangs] = useState("Hindi, English");
  const [tagline, setTagline] = useState("");
  const [dur, setDur] = useState("");
  const [imgs, setImgs] = useState<string[]>([]);
  const [imgUrl, setImgUrl] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  // verification state
  const [verStatus, setVerStatus] = useState<string>(user?.verification_status || "none");
  const [idType, setIdType] = useState<string>("aadhaar");
  const [idDoc, setIdDoc] = useState("");
  const [verMsg, setVerMsg] = useState("");
  const [verBusy, setVerBusy] = useState(false);

  const load = useCallback(async () => {
    const [l, b, e, d] = await Promise.all([
      fetch("/api/host/listings").then((r) => r.json()),
      fetch("/api/bookings").then((r) => r.json()),
      fetch("/api/host/earnings").then((r) => r.json()),
      fetch("/api/destinations").then((r) => r.json()),
    ]);
    setListings(l.listings || []);
    setPlaces(l.places || []);
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
    if (user) {
      setVerStatus(user.verification_status || "none");
      load();
    }
  }, [user, loading, load]);

  async function respond(id: number, status: "confirmed" | "declined") {
    await fetch(`/api/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  async function addFiles(files: FileList | null) {
    if (!files?.length) return;
    const next: string[] = [];
    for (const f of Array.from(files).slice(0, 6 - imgs.length)) {
      try {
        next.push(await fileToShrunkDataUrl(f));
      } catch {
        setMsg(`Could not read ${f.name}`);
      }
    }
    setImgs((p) => [...p, ...next].slice(0, 6));
  }

  async function createListing() {
    if (!title || !destSlug) {
      setMsg("Pick a destination and give your listing a name.");
      return;
    }
    if (kind === "place" && !imgs.length && !imgUrl.trim()) {
      setMsg("Add at least one photo of the place — travellers choose with their eyes.");
      return;
    }
    setBusy(true);
    setMsg("");
    const r = await fetch("/api/host/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind,
        title,
        dest_slug: destSlug,
        price,
        langs,
        tagline,
        dur,
        images: imgs,
        img: imgUrl.trim() || undefined,
      }),
    });
    setBusy(false);
    if (r.ok) {
      setTitle("");
      setTagline("");
      setDur("");
      setImgs([]);
      setImgUrl("");
      setMsg(kind === "place" ? "Place published! It's saved and can now be added to travellers' itineraries. ✅" : "Listing published! Travellers can now find it on the destination page. ✅");
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

  async function submitVerification() {
    if (!idDoc) {
      setVerMsg("Attach a photo of your ID document first.");
      return;
    }
    setVerBusy(true);
    setVerMsg("");
    const r = await fetch("/api/guides/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_doc_type: idType, id_doc: idDoc }),
    });
    setVerBusy(false);
    const d = await r.json().catch(() => ({}));
    if (r.ok) {
      setVerStatus("verified");
      setVerMsg("You're verified! The ✓ badge now shows on your guide profile.");
      refresh();
    } else {
      setVerMsg(d.error || "Verification failed");
    }
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

  const verified = verStatus === "verified";

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
        {/* requests + listings */}
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
              {listings.length === 0 && places.length === 0 && (
                <p className="text-sm text-slate-400">Nothing listed yet — create your first on the right.</p>
              )}
              {[...places.map((p) => ({ ...p, images: [p.img], tagline: p.desc, langs: "", status: "approved" })), ...listings].map((l) => (
                <div key={`${l.kind}-${l.id}`} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={l.images?.[0] || l.img}
                    alt=""
                    className="h-12 w-16 shrink-0 rounded-lg bg-slate-100 object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-800">
                      {l.kind === "place" ? "📍 " : ""}{l.title}
                    </p>
                    <p className="truncate text-xs text-slate-500 capitalize">
                      {l.kind} · {l.dest_slug} · ₹{l.price.toLocaleString("en-IN")}
                      {l.images?.length > 1 ? ` · ${l.images.length} photos` : ""}
                    </p>
                  </div>
                  <span className="tag">{l.status}</span>
                  <button onClick={() => removeListing(l.id)} className="text-slate-300 hover:text-rose-500" aria-label="Delete">✕</button>
                </div>
              ))}
            </div>
          </div>

          {/* guide verification */}
          <div className={`card p-6 ${verified ? "border-emerald-200 bg-emerald-50/40" : ""}`} id="verify">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                  Guide verification
                  {verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[11px] font-bold text-white">
                      Verified Guide ✓
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-400">
                  {verified
                    ? "Travellers see the green badge on your profile before they connect."
                    : "Verify your identity with a government ID to earn traveller trust."}
                </p>
              </div>
              <span className="text-2xl">{verified ? "🛡️" : "🪪"}</span>
            </div>
            {!verified && (
              <div className="mt-4 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <span className="label">ID document type</span>
                    <select className="input" value={idType} onChange={(e) => setIdType(e.target.value)}>
                      {ID_TYPES.map(([v, label]) => (
                        <option key={v} value={v}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <span className="label">ID document photo</span>
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
                  <img src={idDoc} alt="ID document preview" className="h-24 rounded-xl border border-slate-200 object-cover" />
                )}
                {verMsg && <p className={`text-sm ${verMsg.includes("badge") ? "text-teal-700" : "text-rose-600"}`}>{verMsg}</p>}
                <button className="btn-primary" disabled={verBusy || !idDoc} onClick={submitVerification}>
                  {verBusy ? "Verifying…" : "🛡️ Verify my identity"}
                </button>
                <p className="text-[11px] text-slate-400">
                  Prototype note: the ID is stored encrypted-at-rest in this demo and approved instantly; production would use a KYC provider.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* create listing form */}
        <aside>
          <div className="card sticky top-20 p-6">
            <h2 className="text-lg font-bold text-slate-900">Create a listing</h2>
            <div className="mt-4 space-y-4">
              <div>
                <span className="label">What are you offering?</span>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      ["guide", "🤝 Guide"],
                      ["homestay", "🏠 Stay"],
                      ["experience", "🎟️ Activity"],
                      ["place", "📍 My place"],
                    ] as const
                  ).map(([k, label]) => (
                    <button
                      key={k}
                      onClick={() => { setKind(k); setPrice(k === "homestay" ? 1500 : k === "place" ? 800 : 1000); }}
                      className={`rounded-xl border-2 px-2 py-2.5 text-xs font-bold transition ${
                        kind === k ? "border-teal-600 bg-teal-50/60 text-teal-800" : "border-slate-200 text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {kind === "place" && (
                  <p className="mt-2 rounded-lg bg-teal-50/70 px-3 py-2 text-[11px] leading-relaxed text-teal-800">
                    A hidden gem in your area — travellers can drop it straight into their day-by-day itinerary.
                  </p>
                )}
              </div>
              <div>
                <span className="label">{kind === "place" ? "Place name" : "Listing name"}</span>
                <input
                  className="input"
                  placeholder={kind === "place" ? "e.g. Secret Sunrise Cliff" : "e.g. Old Town Food Walks"}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
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
                <span className="label">{kind === "place" ? "Visit price (₹, 0 = free)" : "Your price (₹)"}</span>
                <input type="number" className="input" min={0} step={100} value={price} onChange={(e) => setPrice(Number(e.target.value))} />
              </div>
              {kind === "guide" && (
                <div>
                  <span className="label">Languages you speak</span>
                  <input className="input" value={langs} onChange={(e) => setLangs(e.target.value)} />
                </div>
              )}
              {(kind === "place" || kind === "experience") && (
                <div>
                  <span className="label">Duration</span>
                  <input className="input" placeholder="e.g. 2 hrs / Half day / Full day" value={dur} onChange={(e) => setDur(e.target.value)} />
                </div>
              )}
              <div>
                <span className="label">{kind === "place" ? "Why should travellers see it?" : "One-line pitch"}</span>
                <textarea
                  className="input h-20 resize-none"
                  placeholder={kind === "place" ? "What's the story behind this place?" : "What makes your offer special?"}
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                />
              </div>

              {/* photos */}
              <div>
                <span className="label">Photos {kind === "place" ? "(required)" : "(optional, up to 6)"}</span>
                <div className="flex flex-wrap gap-2">
                  {imgs.map((src, i) => (
                    <div key={i} className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" className="h-16 w-20 rounded-lg border border-slate-200 object-cover" />
                      <button
                        onClick={() => setImgs((p) => p.filter((_, j) => j !== i))}
                        className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-slate-800 text-[10px] text-white"
                        aria-label="Remove photo"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {imgs.length < 6 && (
                    <label className="grid h-16 w-20 cursor-pointer place-items-center rounded-lg border-2 border-dashed border-slate-300 text-center text-[10px] font-semibold text-slate-400 transition hover:border-teal-500 hover:text-teal-600">
                      + Add
                      <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
                    </label>
                  )}
                </div>
                <input
                  className="input mt-2 !text-xs"
                  placeholder="…or paste an image URL"
                  value={imgUrl}
                  onChange={(e) => setImgUrl(e.target.value)}
                />
              </div>

              {msg && <p className={`text-sm ${msg.includes("✅") ? "text-teal-700" : "text-rose-600"}`}>{msg}</p>}
              <button className="btn-primary w-full" disabled={busy} onClick={createListing}>
                {busy ? "Publishing…" : kind === "place" ? "📍 Publish place" : "🚀 Publish listing"}
              </button>
              <p className="text-center text-[11px] text-slate-400">
                {kind === "place"
                  ? "Saved to the platform and offered inside the trip planner."
                  : "Goes live instantly on the destination page (prototype behaviour)."}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
