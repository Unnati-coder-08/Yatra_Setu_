"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TRIP_TEMPLATES } from "@/lib/seed-data.mjs";
import { useAuth } from "@/lib/useAuth";

interface DestLite {
  slug: string;
  name: string;
  state: string;
  images: string[];
  tagline: string;
}

interface GuidePlaceLite {
  id: number;
  title: string;
  desc: string;
  img: string;
  price: number;
  dur: string;
  host_name: string;
}

const INTERESTS = ["Adventure", "Culture", "Nature", "Beaches", "Food", "Wellness", "Spiritual", "Heritage"];
const INTEREST_ICON: Record<string, string> = {
  Adventure: "🧭", Culture: "🎭", Nature: "🌿", Beaches: "🏖️",
  Food: "🍛", Wellness: "🧘", Spiritual: "🕉️", Heritage: "🏛️",
};

function PlanInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [allDests, setAllDests] = useState<DestLite[]>([]);
  const [picked, setPicked] = useState<string[]>(params.get("dest") ? [params.get("dest")!] : []);
  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [budget, setBudget] = useState(20000);
  const [pace, setPace] = useState<"relaxed" | "packed">("relaxed");
  const [items, setItems] = useState<{ day: number; time: string; title: string; dest_slug: string; kind: string; cost: number }[]>([]);
  const [removed, setRemoved] = useState<Record<string, string[]>>({});
  const [placeMap, setPlaceMap] = useState<Record<string, GuidePlaceLite[]>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/destinations")
      .then((r) => r.json())
      .then((d) => setAllDests(d.destinations || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (user && !name) setName(`${user.name.split(" ")[0]}'s Yatra`);
  }, [user, name]);

  // Fetch local guides' places for every picked destination — these are bookable
  // itinerary stops contributed by verified locals (feature: guide-listed places).
  useEffect(() => {
    const missing = picked.filter((s) => !placeMap[s]);
    if (!missing.length) return;
    let alive = true;
    Promise.all(
      missing.map((s) =>
        fetch(`/api/destinations/${s}`)
          .then((r) => r.json())
          .then((d) => [s, d.guide_places || []] as const)
          .catch(() => [s, []] as const)
      )
    ).then((entries) => {
      if (alive) setPlaceMap((p) => ({ ...p, ...Object.fromEntries(entries) }));
    });
    return () => {
      alive = false;
    };
  }, [picked, placeMap]);

  const filtered = useMemo(
    () =>
      allDests.filter(
        (d) =>
          !picked.includes(d.slug) &&
          (d.name.toLowerCase().includes(query.toLowerCase()) || d.state.toLowerCase().includes(query.toLowerCase()))
      ),
    [allDests, picked, query]
  );

  // Build itinerary whenever picks / pace / removals / dates change.
  // Guide-listed places are woven in (locally-flagged, with price), and the plan
  // is stretched across the traveller's chosen start → end dates.
  function buildItinerary(
    picks: string[],
    paceMode: "relaxed" | "packed",
    removedMap: Record<string, string[]>,
    placesBySlug: Record<string, GuidePlaceLite[]>
  ) {
    const out: typeof items = [];
    let day = 1;
    for (const slug of picks) {
      const tpl = (TRIP_TEMPLATES as Record<string, string[]>)[slug] || [];
      const gone = new Set(removedMap[slug] || []);
      const kept = tpl.filter((t) => !gone.has(t));
      const places = (placesBySlug[slug] || []).filter((p) => !gone.has(p.title));
      const asActivity = (title: string) => ({ title, kind: "activity", cost: 0 });
      const asPlace = (p: GuidePlaceLite) => ({ title: p.title, kind: "place", cost: p.price || 0 });
      const chunks: { title: string; kind: string; cost: number }[][] = [];
      if (paceMode === "packed") {
        const all = [...kept.map(asActivity), ...places.map(asPlace)];
        if (all.length) chunks.push(all);
      } else {
        const first = kept.slice(0, Math.ceil(kept.length / 2)).map(asActivity);
        const rest = [...kept.slice(Math.ceil(kept.length / 2)).map(asActivity), ...places.map(asPlace)];
        if (first.length) chunks.push(first);
        if (rest.length) chunks.push(rest);
      }
      chunks.forEach((chunk, ci) => {
        if (!chunk.length) return;
        if (ci === 0) {
          out.push({ day, time: "08:00", title: `Arrive in ${slug[0].toUpperCase() + slug.slice(1)} & check in`, dest_slug: slug, kind: "travel", cost: 0 });
        }
        const times = ["10:00", "14:00", "17:30"];
        chunk.forEach((row, i) => {
          out.push({ day, time: times[i % times.length], title: row.title, dest_slug: slug, kind: row.kind, cost: row.cost });
        });
        day++;
      });
    }
    // Stretch the plan across the full date range: pad any leftover days with
    // easy free days so day N of the itinerary always equals date start + N - 1.
    if (startDate && endDate) {
      const total = Math.max(1, Math.round((+new Date(endDate + "T00:00") - +new Date(startDate + "T00:00")) / 86400000) + 1);
      const lastSlug = picks[picks.length - 1] || "";
      while (day <= total) {
        out.push({ day, time: "09:00", title: "Free day — explore at your own pace", dest_slug: lastSlug, kind: "free", cost: 0 });
        day++;
      }
    }
    return out;
  }

  useEffect(() => {
    if (step === 3) setItems(buildItinerary(picked, pace, removed, placeMap));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, picked, pace, removed, placeMap, startDate, endDate]);

  function togglePick(slug: string) {
    setPicked((p) => (p.includes(slug) ? p.filter((s) => s !== slug) : [...p, slug]));
    setRemoved((r) => ({ ...r, [slug]: [] }));
  }

  function removeItem(slug: string, title: string) {
    setRemoved((r) => ({ ...r, [slug]: [...(r[slug] || []), title] }));
  }

  function restoreItem(slug: string, title: string) {
    setRemoved((r) => ({ ...r, [slug]: (r[slug] || []).filter((t) => t !== title) }));
  }

  async function saveTrip() {
    if (!user) {
      router.push("/login");
      return;
    }
    setBusy(true);
    setError("");
    const r = await fetch("/api/trips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name || "My Yatra", start_date: startDate, end_date: endDate, interests, budget, pace }),
    });
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      setError(d.error || "Could not save trip");
      setBusy(false);
      return;
    }
    const { trip } = await r.json();
    if (items.length) {
      const ir = await fetch(`/api/trips/${trip.id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (!ir.ok) {
        setError("Trip saved, but the itinerary could not be added. Please try again.");
        setBusy(false);
        return;
      }
    }
    setBusy(false);
    router.push(`/trips/${trip.id}`);
  }

  const days = useMemo(() => {
    const m: Record<number, typeof items> = {};
    for (const it of items) (m[it.day] ||= []).push(it);
    return m;
  }, [items]);

  const estCost = items.reduce((s, i) => s + i.cost, 0);

  // Real calendar date for itinerary day N (feature: date-range aware itinerary)
  const totalDays =
    startDate && endDate
      ? Math.max(1, Math.round((+new Date(endDate + "T00:00") - +new Date(startDate + "T00:00")) / 86400000) + 1)
      : null;
  function dayDate(day: number): string | null {
    if (!startDate) return null;
    const d = new Date(startDate + "T00:00");
    d.setDate(d.getDate() + (day - 1));
    return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Plan Your Trip</h1>
      <p className="mt-1 text-sm text-slate-500">Create your custom itinerary based on your interests.</p>

      {/* stepper */}
      <div className="mt-8 flex items-center gap-3 sm:gap-6">
        {["Destination", "Preferences", "Itinerary"].map((label, i) => {
          const n = i + 1;
          return (
            <div key={label} className="flex items-center gap-3 sm:gap-6">
              <button onClick={() => n < step && setStep(n)} className="flex items-center gap-2.5">
                <span className={n <= step ? "step-dot" : "step-dot-idle"}>{n}</span>
                <span className={`hidden text-sm font-semibold sm:block ${n <= step ? "text-teal-800" : "text-slate-400"}`}>
                  {label}
                </span>
              </button>
              {n < 3 && <span className="h-px w-8 bg-slate-200 sm:w-16" />}
            </div>
          );
        })}
      </div>

      {/* STEP 1 */}
      {step === 1 && (
        <div className="card mt-6 p-6">
          <p className="label">Select destinations ({picked.length} picked)</p>
          {picked.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {picked.map((slug) => {
                const d = allDests.find((x) => x.slug === slug);
                return (
                  <span key={slug} className="chip !py-1.5 !pl-1.5 !pr-2 font-semibold text-teal-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={d?.images[0]} className="h-6 w-6 rounded-full object-cover" alt="" />
                    {d?.name || slug}
                    <button onClick={() => togglePick(slug)} className="ml-1 text-slate-400 hover:text-rose-500">✕</button>
                  </span>
                );
              })}
            </div>
          )}
          <input className="input" placeholder="Search or choose a destination…" value={query} onChange={(e) => setQuery(e.target.value)} />
          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {filtered.slice(0, 9).map((d) => (
              <button
                key={d.slug}
                onClick={() => togglePick(d.slug)}
                className="group flex items-center gap-3 rounded-xl border border-slate-200 p-2.5 text-left transition hover:border-teal-600 hover:bg-teal-50/50"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={d.images[0]} alt="" className="h-10 w-10 rounded-lg object-cover" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-800">{d.name}</p>
                  <p className="truncate text-[11px] text-slate-400">{d.state}</p>
                </div>
                <span className="ml-auto text-teal-600 opacity-0 transition group-hover:opacity-100">＋</span>
              </button>
            ))}
          </div>
          <div className="mt-6 flex justify-end">
            <button className="btn-primary" disabled={!picked.length} onClick={() => setStep(2)}>
              Next →
            </button>
          </div>
        </div>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div className="card mt-6 space-y-6 p-6">
          <div>
            <p className="label">Trip name</p>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="My Yatra" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="label">Start date</p>
              <input type="date" className="input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <p className="label">End date</p>
              <input type="date" className="input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <div>
            <p className="label">Travel interests (optional)</p>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((t) => (
                <button
                  key={t}
                  onClick={() => setInterests((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]))}
                  className={`chip cursor-pointer !px-4 !py-2 ${interests.includes(t) ? "chip-active" : "hover:border-teal-600"}`}
                >
                  {INTEREST_ICON[t]} {t}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="label">Budget: ₹{budget.toLocaleString("en-IN")}</p>
              <input
                type="range"
                min={5000}
                max={100000}
                step={1000}
                className="w-full accent-teal-700"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
              />
            </div>
            <div>
              <p className="label">Pace</p>
              <div className="flex gap-2">
                {(["relaxed", "packed"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPace(p)}
                    className={`chip cursor-pointer !px-4 !py-2 capitalize ${pace === p ? "chip-active" : "hover:border-teal-600"}`}
                  >
                    {p === "relaxed" ? "🐢" : "⚡"} {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-between">
            <button className="btn-ghost" onClick={() => setStep(1)}>← Back</button>
            <button className="btn-primary" onClick={() => setStep(3)}>Next →</button>
          </div>
        </div>
      )}

      {/* STEP 2b: local guides' places for the picked destinations */}
      {step === 2 && (
        <div className="card mt-4 p-6">
          <p className="flex items-center gap-2 text-lg font-bold text-slate-900">
            📍 Hidden gems from local guides
            <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-700">added by verified locals</span>
          </p>
          <p className="text-xs text-slate-400">Guides in your destinations have listed their signature spots — they&apos;ll appear in your itinerary.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {picked.flatMap((slug) =>
              (placeMap[slug] || []).map((p) => (
                <div key={`${slug}-${p.id}`} className="flex gap-3 rounded-xl border border-slate-100 p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.img} alt="" className="h-16 w-20 shrink-0 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-800">{p.title}</p>
                    <p className="truncate text-[11px] text-slate-400">
                      with {p.host_name}{p.dur ? ` · ${p.dur}` : ""}{p.price ? ` · ₹${p.price.toLocaleString("en-IN")}` : " · free"}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">{p.desc}</p>
                  </div>
                </div>
              ))
            )}
            {picked.every((slug) => !(placeMap[slug] || []).length) && (
              <p className="text-sm text-slate-400">No guide places listed here yet — your itinerary will use classic experiences.</p>
            )}
          </div>
        </div>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <div className="mt-6">
          <div className="card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-lg font-bold text-slate-900">Your day-by-day itinerary</p>
                <p className="text-xs text-slate-500">
                  {items.length} stops{totalDays ? ` · ${totalDays} days (${dayDate(1)} → ${dayDate(totalDays)})` : ""} · est. activity cost ₹{estCost.toLocaleString("en-IN")} · tap ✕ to drop an activity
                </p>
              </div>
              <button className="btn-outline !px-4 !py-2 text-xs" onClick={() => setStep(2)}>⚙︎ Adjust preferences</button>
            </div>
            <div className="mt-5 space-y-5">
              {Object.entries(days).map(([day, list]) => (
                <div key={day}>
                  <p className="mb-2 flex items-center gap-2 text-sm font-bold text-teal-800">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-teal-700 text-[11px] text-white">{day}</span>
                    Day {day}
                    {dayDate(Number(day)) && <span className="text-xs font-medium text-slate-400">· {dayDate(Number(day))}</span>}
                    <span className="text-xs font-medium text-slate-400">
                      {list[0]?.dest_slug && `· ${allDests.find((d) => d.slug === list[0].dest_slug)?.name}`}
                    </span>
                  </p>
                  <div className="ml-3 space-y-2 border-l-2 border-teal-100 pl-4">
                    {list.map((it) => (
                      <div key={it.title} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3.5 py-2.5">
                        <span className="text-xs font-bold text-slate-400">{it.time}</span>
                        <span className="flex-1 text-sm text-slate-700">
                          {it.kind === "travel" ? "🛬 " : "📍 "}{it.title}
                        </span>
                        {it.kind === "activity" || it.kind === "place" ? (
                          <button
                            onClick={() => removeItem(it.dest_slug, it.title)}
                            className="text-slate-300 transition hover:text-rose-500"
                            aria-label="Remove"
                          >
                            ✕
                          </button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                  {(removed[list[0]?.dest_slug]?.length || 0) > 0 && (
                    <div className="ml-4 mt-2 flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-slate-400">Removed:</span>
                      {removed[list[0]?.dest_slug].map((t) => (
                        <button key={t} onClick={() => restoreItem(list[0].dest_slug, t)} className="chip !py-0.5 text-[10px] line-through hover:border-teal-600 hover:no-underline">
                          {t} ↺
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
          <div className="mt-5 flex items-center justify-between">
            <button className="btn-ghost" onClick={() => setStep(2)}>← Back</button>
            <button className="btn-primary !px-8" disabled={busy} onClick={saveTrip}>
              {busy ? "Saving…" : user ? "💾 Save trip" : "Log in & save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PlanPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400">Loading…</div>}>
      <PlanInner />
    </Suspense>
  );
}
