"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Trip } from "@/lib/types";
import { useAuth } from "@/lib/useAuth";

export default function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, loading } = useAuth();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [missing, setMissing] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch(`/api/trips/${id}`, { cache: "no-store" });
    if (r.status === 404) setMissing(true);
    if (r.ok) {
      const d = await r.json();
      setTrip(d.trip);
    }
  }, [id]);

  useEffect(() => {
    if (!loading && !user) window.location.href = "/login";
    if (user) load();
  }, [user, loading, load]);

  async function toggleDone(itemId: number, done: boolean) {
    setTrip((t) =>
      t ? { ...t, items: t.items.map((i) => (i.id === itemId ? { ...i, done: done ? 1 : 0 } : i)) } : t
    );
    await fetch(`/api/trip-items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done }),
    });
  }

  async function removeItem(itemId: number) {
    setTrip((t) => (t ? { ...t, items: t.items.filter((i) => i.id !== itemId) } : t));
    await fetch(`/api/trip-items/${itemId}`, { method: "DELETE" });
  }

  async function deleteTrip() {
    if (!confirm("Delete this trip?")) return;
    await fetch(`/api/trips/${id}`, { method: "DELETE" });
    router.push("/trips");
  }

  if (missing) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-4xl">🕳️</p>
        <p className="mt-3 font-bold text-slate-700">Trip not found</p>
        <Link href="/trips" className="btn-primary mt-5 inline-flex">Back to My Trips</Link>
      </div>
    );
  }

  if (!trip) {
    return <div className="mx-auto max-w-3xl px-4 py-16"><div className="h-64 animate-pulse rounded-3xl bg-slate-100" /></div>;
  }

  const days: Record<number, typeof trip.items> = {};
  for (const it of trip.items) (days[it.day] ||= []).push(it);
  const total = trip.items.reduce((s, i) => s + i.cost, 0);
  const doneCount = trip.items.filter((i) => i.done).length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link href="/trips" className="btn-ghost mb-4">← My Trips</Link>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{trip.name}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {trip.start_date && `${new Date(trip.start_date + "T00:00").toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} · `}
            {trip.items.length} stops · {doneCount}/{trip.items.length} done
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
          trip.status === "upcoming" ? "bg-teal-50 text-teal-700" : "bg-slate-100 text-slate-500"
        }`}>
          {trip.status}
        </span>
      </div>

      {trip.interests.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {trip.interests.map((i) => <span key={i} className="tag">{i}</span>)}
        </div>
      )}

      <div className="card mt-6 p-6">
        <div className="space-y-6">
          {Object.entries(days).map(([day, list]) => (
            <div key={day}>
              <p className="mb-2 flex items-center gap-2 text-sm font-bold text-teal-800">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-teal-700 text-[11px] text-white">{day}</span>
                Day {day}
              </p>
              <div className="ml-3 space-y-2 border-l-2 border-teal-100 pl-4">
                {list.map((it) => (
                  <div
                    key={it.id}
                    className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 transition ${
                      it.done ? "bg-teal-50/60" : "bg-slate-50"
                    }`}
                  >
                    <button
                      onClick={() => toggleDone(it.id, !it.done)}
                      className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 text-[10px] transition ${
                        it.done ? "border-teal-600 bg-teal-600 text-white" : "border-slate-300 bg-white text-transparent hover:border-teal-500"
                      }`}
                      aria-label="Toggle done"
                    >
                      ✓
                    </button>
                    <span className="text-xs font-bold text-slate-400">{it.time}</span>
                    <span className={`flex-1 text-sm ${it.done ? "text-slate-400 line-through" : "text-slate-700"}`}>
                      {it.kind === "travel" ? "🛬 " : "📍 "}{it.title}
                    </span>
                    <button onClick={() => removeItem(it.id)} className="text-slate-300 transition hover:text-rose-500" aria-label="Remove">✕</button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {trip.items.length === 0 && <p className="text-sm text-slate-400">No itinerary items yet.</p>}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <button onClick={deleteTrip} className="btn-ghost !text-rose-600 hover:!bg-rose-50">🗑 Delete trip</button>
        <span className="text-sm text-slate-500">est. activity cost <b className="text-slate-700">₹{total.toLocaleString("en-IN")}</b></span>
      </div>
    </div>
  );
}
