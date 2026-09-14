"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Booking, Destination, Trip } from "@/lib/types";
import { useAuth } from "@/lib/useAuth";
import DestinationCard from "@/components/DestinationCard";

interface Activity {
  id: number;
  icon: string;
  text: string;
  created_at: string;
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [saved, setSaved] = useState<Destination[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = "/login";
      return;
    }
    if (!user) return;
    Promise.all([
      fetch("/api/trips").then((r) => r.json()),
      fetch("/api/saved").then((r) => r.json()),
      fetch("/api/bookings").then((r) => r.json()),
      fetch("/api/dashboard/activity").then((r) => r.json()),
    ]).then(([t, s, b, a]) => {
      setTrips(t.trips || []);
      setSaved(s.saved || []);
      setBookings(b.bookings || []);
      setActivity(a.activity || []);
      setReady(true);
    });
  }, [user, loading]);

  if (!ready) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="h-10 w-64 animate-pulse rounded-xl bg-slate-200" />
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />)}
        </div>
      </div>
    );
  }

  const upcoming = trips.filter((t) => t.status === "upcoming");
  const recentActivity = activity.slice(0, 5);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <p className="text-sm font-semibold text-teal-700">Namaste, {user?.name.split(" ")[0]}! 👋</p>
      <h1 className="mt-0.5 text-3xl font-extrabold tracking-tight text-slate-900">Your journey, at a glance</h1>
      <p className="mt-1 text-sm text-slate-500">Explore. Experience. Make an impact on local communities.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Trips planned", value: trips.length, icon: "🧭", href: "/trips" },
          { label: "Places saved", value: saved.length, icon: "❤️", href: "/explore" },
          { label: "Booking requests", value: bookings.length, icon: "🧾", href: "/dashboard#bookings" },
        ].map((s) => (
          <Link key={s.label} href={s.href} className="card card-hover flex items-center gap-4 p-5">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-2xl">{s.icon}</span>
            <div>
              <p className="text-2xl font-extrabold text-slate-900">{s.value}</p>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{s.label}</p>
            </div>
            <span className="ml-auto text-slate-300">→</span>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {/* upcoming trips */}
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Upcoming trips</h2>
              <Link href="/trips" className="text-sm font-semibold text-teal-700 hover:text-teal-900">View all →</Link>
            </div>
            <div className="mt-4 space-y-3">
              {upcoming.length === 0 && (
                <p className="text-sm text-slate-400">
                  Nothing planned yet. <Link href="/plan" className="font-semibold text-teal-700">Plan a trip →</Link>
                </p>
              )}
              {upcoming.slice(0, 3).map((t) => (
                <Link key={t.id} href={`/trips/${t.id}`} className="flex items-center gap-3.5 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 transition hover:border-teal-300 hover:bg-teal-50/40">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-lg shadow-sm">🧭</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-800">{t.name}</p>
                    <p className="text-xs text-slate-500">
                      {t.start_date
                        ? new Date(t.start_date + "T00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                        : "Dates flexible"}{" "}
                      · {t.items.length} stops
                    </p>
                  </div>
                  <span className="chip !bg-teal-700 !text-white">Upcoming</span>
                </Link>
              ))}
            </div>
          </div>

          {/* bookings */}
          <div className="card p-6" id="bookings">
            <h2 className="text-lg font-bold text-slate-900">My booking requests</h2>
            <div className="mt-4 space-y-3">
              {bookings.length === 0 && <p className="text-sm text-slate-400">No bookings yet — request a guide or homestay from any destination page.</p>}
              {bookings.map((b) => (
                <div key={b.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-lg shadow-sm">
                    {b.kind === "guide" ? "🤝" : b.kind === "homestay" ? "🏠" : "🎟️"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-800">{b.title}</p>
                    <p className="text-xs text-slate-500">
                      {b.date || "date flexible"} · {b.guests} guests · ₹{b.amount.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${
                    b.status === "confirmed" ? "bg-emerald-100 text-emerald-700"
                    : b.status === "declined" ? "bg-rose-100 text-rose-600"
                    : "bg-amber-100 text-amber-700"
                  }`}>
                    {b.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* saved places */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Saved places</h2>
              <Link href="/explore" className="text-sm font-semibold text-teal-700 hover:text-teal-900">Explore more →</Link>
            </div>
            {saved.length === 0 ? (
              <div className="card p-8 text-center">
                <p className="text-3xl">♡</p>
                <p className="mt-2 text-sm text-slate-500">Tap the heart on any destination to save it here.</p>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2">
                {saved.map((d) => (
                  <DestinationCard key={d.slug} d={d} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* activity rail */}
        <aside className="space-y-5">
          <div className="card p-6">
            <h2 className="text-lg font-bold text-slate-900">Recent activity</h2>
            <div className="mt-4 space-y-3.5">
              {recentActivity.length === 0 && <p className="text-sm text-slate-400">Your story starts here.</p>}
              {recentActivity.map((a) => (
                <div key={a.id} className="flex gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-teal-50">{a.icon}</span>
                  <div>
                    <p className="text-sm text-slate-700">{a.text}</p>
                    <p className="text-[11px] text-slate-400">{new Date(a.created_at + "Z").toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-teal-700 to-teal-500 p-6 text-white">
            <p className="text-lg font-bold">Travel that gives back</p>
            <p className="mt-1.5 text-sm leading-relaxed text-teal-50">
              Every guide you hire and homestay you book puts income directly into local hands.
            </p>
            <Link href="/host" className="btn-primary mt-4 w-full !bg-white !text-teal-800 hover:!bg-teal-50">
              🤝 Meet our hosts
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
