"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Trip } from "@/lib/types";
import { useAuth } from "@/lib/useAuth";

export default function TripsPage() {
  const { user, loading } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = "/login";
      return;
    }
    if (user) {
      fetch("/api/trips")
        .then((r) => r.json())
        .then((d) => setTrips(d.trips || []))
        .finally(() => setReady(true));
    }
  }, [user, loading]);

  function fmt(d: string) {
    if (!d) return "Dates flexible";
    return new Date(d + "T00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">My Trips</h1>
          <p className="mt-1 text-sm text-slate-500">Every journey you&apos;ve planned, in one place.</p>
        </div>
        <Link href="/plan" className="btn-primary !px-5 !py-2.5 text-sm">＋ New trip</Link>
      </div>

      {(!ready || loading) && (
        <div className="mt-8 space-y-3">
          {[0, 1].map((i) => <div key={i} className="card h-28 animate-pulse bg-slate-100" />)}
        </div>
      )}

      {ready && trips.length === 0 && (
        <div className="card mt-8 p-12 text-center">
          <p className="text-4xl">🧭</p>
          <p className="mt-3 font-bold text-slate-700">No trips yet</p>
          <p className="text-sm text-slate-500">Plan your first yatra in under a minute.</p>
          <Link href="/plan" className="btn-primary mt-5 inline-flex">Plan a trip</Link>
        </div>
      )}

      <div className="mt-8 space-y-4">
        {trips.map((t) => {
          const dests = [...new Set(t.items.map((i) => i.dest_slug).filter(Boolean))] as string[];
          const cost = t.items.reduce((s, i) => s + i.cost, 0);
          return (
            <Link key={t.id} href={`/trips/${t.id}`} className="card card-hover block p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-bold text-slate-900">{t.name}</p>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {fmt(t.start_date)} – {fmt(t.end_date)} · {t.items.length} stops · pace: {t.pace}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                  t.status === "upcoming" ? "bg-teal-50 text-teal-700" : "bg-slate-100 text-slate-500"
                }`}>
                  {t.status}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {dests.map((s) => (
                  <span key={s} className="tag capitalize">{s}</span>
                ))}
                {cost > 0 && <span className="ml-auto text-xs font-semibold text-slate-500">est. ₹{cost.toLocaleString("en-IN")}</span>}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
