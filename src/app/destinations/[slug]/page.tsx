"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { DestinationDetail } from "@/lib/types";
import { useAuth } from "@/lib/useAuth";
import BookingModal, { BookableItem } from "@/components/BookingModal";
import IndiaMap from "@/components/IndiaMap";

const CAT_ICON: Record<string, string> = {
  Mountains: "🏔️", Beaches: "🏖️", Heritage: "🏛️", Nature: "🌿",
  Adventure: "🧭", Spiritual: "🕉️", Culture: "🎭", Food: "🍛", Wellness: "🧘",
};

export default function DestinationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { user } = useAuth();
  const [data, setData] = useState<DestinationDetail | null>(null);
  const [saved, setSaved] = useState(false);
  const [book, setBook] = useState<BookableItem | null>(null);
  const [tab, setTab] = useState<"exp" | "guides" | "stays" | "places">("exp");
  const [stayPhoto, setStayPhoto] = useState<Record<number, number>>({});
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewMsg, setReviewMsg] = useState("");

  const load = useCallback(async () => {
    const r = await fetch(`/api/destinations/${slug}`, { cache: "no-store" });
    if (r.ok) {
      const d: DestinationDetail = await r.json();
      setData(d);
      setSaved(d.saved);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleSave() {
    if (!user) {
      window.location.href = "/login";
      return;
    }
    const r = await fetch("/api/saved", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dest_slug: slug }),
    });
    if (r.ok) {
      const d = await r.json();
      setSaved(d.saved);
    }
  }

  async function submitReview() {
    if (!reviewText.trim()) return;
    if (!user) {
      window.location.href = "/login";
      return;
    }
    const r = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dest_slug: slug, rating: reviewRating, text: reviewText }),
    });
    if (r.ok) {
      const d = await r.json();
      setData((prev) => (prev ? { ...prev, reviews: d.reviews } : prev));
      setReviewText("");
      setReviewMsg("Thanks for sharing! ♥");
      setTimeout(() => setReviewMsg(""), 2500);
    }
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16">
        <div className="h-72 animate-pulse rounded-3xl bg-slate-200" />
        <div className="mt-6 h-8 w-1/3 animate-pulse rounded bg-slate-200" />
      </div>
    );
  }

  const d = data.destination;
  const infoTiles = [
    { icon: "📅", label: "Best time", value: d.best_time },
    { icon: "💰", label: "Avg. budget", value: d.budget },
    { icon: "🚌", label: "Travel mode", value: d.travel_mode },
  ];

  return (
    <div>
      {/* ---------- HERO ---------- */}
      <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <div className="relative h-[340px] overflow-hidden rounded-3xl shadow-lg sm:h-[420px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={d.images[0]} alt={d.name} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/75 via-slate-900/10 to-slate-900/20" />
          <Link
            href="/explore"
            className="absolute left-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-slate-700 shadow transition hover:bg-white"
            aria-label="Back to explore"
          >
            ←
          </Link>
          <button
            onClick={toggleSave}
            aria-label="Save destination"
            className={`absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full shadow transition ${
              saved ? "bg-rose-500 text-white" : "bg-white/90 text-slate-600 hover:bg-white"
            }`}
          >
            {saved ? "♥" : "♡"}
          </button>
          <div className="absolute bottom-0 p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-teal-200">
              {d.state} · {d.tagline}
            </p>
            <h1 className="mt-1.5 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">{d.name}</h1>
            <p className="mt-2 flex items-center gap-2 text-sm text-slate-100">
              <span className="rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-bold text-amber-900">
                ⭐ {d.rating.toFixed(1)}
              </span>
              <span className="text-slate-300">({d.reviews_count.toLocaleString("en-IN")} reviews)</span>
            </p>
          </div>
        </div>

        {/* info tiles */}
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {infoTiles.map((t) => (
            <div key={t.label} className="card flex items-center gap-3 p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-50 text-lg">{t.icon}</span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{t.label}</p>
                <p className="text-sm font-bold text-slate-800">{t.value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- BODY ---------- */}
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_380px]">
        <div>
          <div className="card p-6">
            <h2 className="text-lg font-bold text-slate-900">About {d.name}</h2>
            <p className="mt-2 leading-relaxed text-slate-600">{d.desc}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {d.categories.map((c) => (
                <span key={c} className="tag">{CAT_ICON[c] || "📍"} {c}</span>
              ))}
            </div>
          </div>

          {/* tabs: experiences / guides / homestays */}
          <div className="mt-6 flex gap-2">
            {            (
              [
                ["exp", "Experiences"],
                ["guides", "Local Guides"],
                ["stays", "Homestays"],
                ["places", "Guide's Picks"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  tab === key ? "bg-teal-700 text-white shadow" : "bg-white text-slate-600 hover:bg-slate-100"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === "exp" && (
            <div className="mt-4 space-y-3">
              {data.experiences.map((e) => (
                <div key={e.id} className="card flex items-center gap-4 p-3.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={e.img} alt={e.title} className="h-16 w-24 shrink-0 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-slate-800">{e.title}</p>
                    <p className="truncate text-xs text-slate-500">{e.desc}</p>
                    <p className="mt-1 text-xs font-semibold text-teal-700">
                      {e.price_label} · {e.dur}
                    </p>
                  </div>
                  <button
                    className="btn-outline hidden !px-4 !py-2 text-xs sm:inline-flex"
                    onClick={() =>
                      setBook({ kind: "experience", ref_id: e.id, title: e.title, dest_slug: slug, amount: e.price, unit: "per person" })
                    }
                  >
                    Book
                  </button>
                </div>
              ))}
            </div>
          )}

          {tab === "guides" && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {data.guides.map((g) => (
                <div key={g.id} className="card p-4">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={g.img} alt={g.name} className="h-14 w-14 rounded-full object-cover ring-2 ring-teal-100" />
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-1.5 font-bold text-slate-800">
                        {g.name}
                        {g.verified ? (
                          <span
                            className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700"
                            title="Identity verified via government ID"
                          >
                            Verified Guide ✓
                          </span>
                        ) : null}
                      </p>
                      <p className="text-xs text-slate-500">{g.langs} · {g.years}+ yrs</p>
                      <p className="text-xs font-semibold text-amber-600">⭐ {g.rating.toFixed(1)}</p>
                    </div>
                  </div>
                  <p className="mt-2.5 text-xs leading-relaxed text-slate-500">{g.tagline}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm font-bold text-teal-800">₹{g.fee.toLocaleString("en-IN")}<span className="text-xs font-medium text-slate-400">/day</span></span>
                    <button
                      className="btn-primary !px-4 !py-2 text-xs"
                      onClick={() =>
                        setBook({ kind: "guide", ref_id: g.id, title: `Guide: ${g.name}`, dest_slug: slug, amount: g.fee, host_user_id: g.host_user_id || null, unit: "/day" })
                      }
                    >
                      Request
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "stays" && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {data.homestays.map((h) => {
                const gallery = h.images?.length ? h.images : [h.img];
                const active = stayPhoto[h.id] || 0;
                return (
                  <div key={h.id} className="card overflow-hidden">
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={gallery[active]} alt={h.name} className="h-36 w-full object-cover" />
                      {gallery.length > 1 && (
                        <span className="absolute bottom-2 right-2 rounded-full bg-slate-900/60 px-2 py-0.5 text-[10px] font-bold text-white">
                          📷 {gallery.length} photos
                        </span>
                      )}
                    </div>
                    {gallery.length > 1 && (
                      <div className="flex gap-1.5 px-3 pt-2">
                        {gallery.map((src, i) => (
                          <button key={i} onClick={() => setStayPhoto((p) => ({ ...p, [h.id]: i }))} className="overflow-hidden rounded-md transition">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={src}
                              alt=""
                              className={`h-10 w-14 object-cover ${i === active ? "ring-2 ring-teal-600" : "opacity-60 hover:opacity-100"}`}
                            />
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="p-4">
                      <p className="font-bold text-slate-800">{h.name}</p>
                      <p className="text-xs text-slate-500">Hosted by {h.host} · ⭐ {h.rating.toFixed(1)}</p>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{h.tagline}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-sm font-bold text-teal-800">₹{h.price.toLocaleString("en-IN")}<span className="text-xs font-medium text-slate-400">/night</span></span>
                        <button
                          className="btn-primary !px-4 !py-2 text-xs"
                          onClick={() =>
                            setBook({ kind: "homestay", ref_id: h.id, title: h.name, dest_slug: slug, amount: h.price, host_user_id: h.host_user_id || null, unit: "/night" })
                          }
                        >
                          Book
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === "places" && (
            <div className="mt-4 space-y-3">
              <p className="rounded-xl bg-teal-50/70 px-4 py-3 text-xs leading-relaxed text-teal-800">
                📍 Hidden gems contributed by local guides — save them into your itinerary from the
                <Link href={`/plan?dest=${slug}`} className="font-bold underline"> trip planner</Link>.
              </p>
              {data.guide_places.length === 0 && (
                <p className="text-sm text-slate-400">No guide-listed places here yet.</p>
              )}
              {data.guide_places.map((p) => (
                <div key={p.id} className="card flex items-center gap-4 p-3.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.img} alt={p.title} className="h-16 w-24 shrink-0 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-slate-800">{p.title}</p>
                    <p className="truncate text-xs text-slate-500">{p.desc}</p>
                    <p className="mt-1 text-xs font-semibold text-teal-700">
                      with {p.host_name}{p.dur ? ` · ${p.dur}` : ""} · {p.price ? `₹${p.price.toLocaleString("en-IN")}` : "Free"}
                    </p>
                  </div>
                  <Link href={`/plan?dest=${slug}`} className="btn-outline hidden !px-4 !py-2 text-xs sm:inline-flex">
                    + Itinerary
                  </Link>
                </div>
              ))}
            </div>
          )}

          {/* reviews */}
          <div className="card mt-6 p-6">
            <h2 className="text-lg font-bold text-slate-900">Traveller stories</h2>
            <div className="mt-4 space-y-4">
              {data.reviews.length === 0 && <p className="text-sm text-slate-400">No reviews yet — be the first!</p>}
              {data.reviews.map((r) => (
                <div key={r.id} className="flex gap-3 border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-teal-50 text-sm font-bold text-teal-700">
                    {r.name.slice(0, 1)}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      {r.name} <span className="ml-1 text-amber-500">{"★".repeat(r.rating)}</span>
                    </p>
                    <p className="mt-0.5 text-sm leading-relaxed text-slate-600">{r.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 border-t border-slate-100 pt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-600">Your rating:</span>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setReviewRating(n)}
                    className={`text-lg transition ${n <= reviewRating ? "text-amber-400" : "text-slate-300"}`}
                    aria-label={`${n} star`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <input
                  className="input"
                  placeholder={user ? "Share a one-line story…" : "Log in to write a review"}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                />
                <button className="btn-primary !px-5" onClick={submitReview}>Post</button>
              </div>
              {reviewMsg && <p className="mt-2 text-xs font-semibold text-teal-600">{reviewMsg}</p>}
            </div>
          </div>
        </div>

        {/* ---------- SIDEBAR ---------- */}
        <aside className="space-y-5">
          <div className="card h-64 overflow-hidden p-2">
            <IndiaMap
              points={[{ slug: d.slug, name: d.name, lat: d.lat, lng: d.lng, img: d.images[0], subtitle: d.state }]}
              focus={{ lat: d.lat, lng: d.lng, zoom: 7 }}
              height="100%"
            />
          </div>
          <div className="card sticky top-20 p-5">
            <p className="text-sm font-bold text-slate-800">Plan {d.name} in minutes</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Add {d.name} to a day-by-day itinerary with local experiences auto-mapped to each day.
            </p>
            <Link href={`/plan?dest=${d.slug}`} className="btn-primary mt-4 w-full">
              🗓️ Plan Your Trip
            </Link>
            <Link href={`/explore?q=${encodeURIComponent(d.state)}`} className="btn-ghost mt-2 w-full">
              More in {d.state}
            </Link>
          </div>
        </aside>
      </section>

      {book && <BookingModal item={book} onClose={() => setBook(null)} />}
    </div>
  );
}
