"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Destination } from "@/lib/types";
import DestinationCard from "@/components/DestinationCard";
import IndiaMap, { MapPoint } from "@/components/IndiaMap";

const CATEGORIES = ["All", "Mountains", "Beaches", "Heritage", "Nature", "Adventure", "Spiritual", "Culture", "Food", "Wellness"];

function ExploreInner() {
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");
  const [category, setCategory] = useState(params.get("category") || "All");
  const [state, setState] = useState(params.get("state") || "");
  const [dests, setDests] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const ps = new URLSearchParams();
    if (q) ps.set("q", q);
    if (category !== "All") ps.set("category", category);
    if (state) ps.set("state", state);
    const r = await fetch(`/api/destinations?${ps.toString()}`);
    const d = await r.json();
    setDests(d.destinations || []);
    setLoading(false);
  }, [q, category, state]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const states = useMemo(() => [...new Set(dests.map((d) => d.state))].sort(), [dests]);
  const points: MapPoint[] = useMemo(
    () =>
      dests.map((d) => ({
        slug: d.slug,
        name: d.name,
        lat: d.lat,
        lng: d.lng,
        img: d.images[0],
        subtitle: `${d.state} · ⭐ ${d.rating.toFixed(1)}`,
      })),
    [dests]
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Explore Destinations</h1>
      <p className="mt-1 text-sm text-slate-500">Find the perfect place for your next adventure — through a local&apos;s eyes.</p>

      <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_auto]">
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input
            className="input !pl-11"
            placeholder="Search destinations, state or category…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <button className="btn-outline !py-3" onClick={() => setShowMap((v) => !v)}>
          {showMap ? "☰ Grid view" : "🗺️ Map view"}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            className={`chip cursor-pointer !px-4 !py-1.5 ${category === c ? "chip-active" : "hover:border-teal-600 hover:text-teal-700"}`}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
        {states.length > 1 && (
          <select className="chip cursor-pointer !px-4 !py-1.5" value={state} onChange={(e) => setState(e.target.value)}>
            <option value="">All states</option>
            {states.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        )}
      </div>

      {showMap ? (
        <div className="mt-6 grid gap-5 lg:grid-cols-[380px_1fr]">
          <div className="rail max-h-[560px] space-y-3 overflow-y-auto pr-1">
            {dests.map((d) => (
              <DestinationCard key={d.slug} d={d} />
            ))}
          </div>
          <div className="card sticky top-20 h-[560px] p-2">
            <IndiaMap points={points} height="100%" />
          </div>
        </div>
      ) : loading ? (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card h-72 animate-pulse bg-slate-100" />
          ))}
        </div>
      ) : dests.length === 0 ? (
        <div className="card mt-6 p-12 text-center">
          <p className="text-4xl">🧭</p>
          <p className="mt-3 font-bold text-slate-700">No destinations match</p>
          <p className="text-sm text-slate-500">Try a different search or category.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {dests.map((d) => (
            <DestinationCard key={d.slug} d={d} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400">Loading…</div>}>
      <ExploreInner />
    </Suspense>
  );
}
