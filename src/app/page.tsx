"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Destination } from "@/lib/types";
import DestinationCard from "@/components/DestinationCard";

const FEATURES = [
  { icon: "🧭", title: "Local Discovery", desc: "Hidden gems, local culture, routes & experiences" },
  { icon: "📅", title: "Smart Planning", desc: "Personalized itineraries built in seconds" },
  { icon: "🤝", title: "Local Guide Connect", desc: "Verified locals for personal guidance" },
  { icon: "🏠", title: "Community Homestays", desc: "Stay with locals, share their stories" },
];

const STEPS = [
  { icon: "🔍", label: "Discover" },
  { icon: "📅", label: "Plan" },
  { icon: "🤝", label: "Connect" },
  { icon: "⛰️", label: "Experience" },
  { icon: "💰", label: "Earn" },
];

export default function HomePage() {
  const router = useRouter();
  const [dest, setDest] = useState("");
  const [date, setDate] = useState("");
  const [popular, setPopular] = useState<Destination[]>([]);

  useEffect(() => {
    fetch("/api/destinations")
      .then((r) => r.json())
      .then((d) => setPopular((d.destinations || []).slice(0, 6)))
      .catch(() => {});
  }, []);

  return (
    <div>
      {/* ---------- HERO ---------- */}
      <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl shadow-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1920&q=80"
            alt="Indian Himalayas"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-900/40 to-transparent" />
          <div className="relative grid gap-8 p-8 sm:p-12 lg:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-teal-200">
                Explore · Plan · Experience
              </p>
              <h1 className="mt-3 text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl">
                Discover India&rsquo;s
                <br />
                Hidden Gems
              </h1>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-slate-200">
                Your personal travel companion for local experiences, authentic culture and sustainable
                journeys — powered by the people who call these places home.
              </p>
            </div>
            <div className="flex items-end">
              <div className="w-full rounded-2xl bg-white/95 p-4 shadow-2xl backdrop-blur">
                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">📍</span>
                      <input
                        className="input !pl-9"
                        placeholder="Where do you want to go?"
                        value={dest}
                        onChange={(e) => setDest(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && router.push(`/explore?q=${encodeURIComponent(dest)}`)}
                      />
                    </div>
                    <input
                      type="date"
                      className="input"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      aria-label="Travel date"
                    />
                  </div>
                  <button
                    className="btn-primary"
                    onClick={() => router.push(`/explore?q=${encodeURIComponent(dest)}`)}
                  >
                    🔍 Search
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-slate-600">Trending:</span>
                  {["kashmir", "ladakh", "kerala"].map((s) => (
                    <Link key={s} href={`/destinations/${s}`} className="chip !py-1 capitalize hover:border-teal-600 hover:text-teal-700">
                      {s}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- FEATURE TILES ---------- */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <Link
              key={f.title}
              href={f.title === "Community Homestays" ? "/host" : "/explore"}
              className="card card-hover flex items-center gap-3.5 p-4"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-teal-50 text-xl">{f.icon}</span>
              <div>
                <p className="text-sm font-bold text-slate-800">{f.title}</p>
                <p className="text-xs leading-snug text-slate-500">{f.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------- POPULAR DESTINATIONS ---------- */}
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="section-title">Popular Destinations</h2>
            <p className="mt-1 text-sm text-slate-500">Handpicked by locals, loved by travellers</p>
          </div>
          <Link href="/explore" className="text-sm font-semibold text-teal-700 hover:text-teal-900">
            View all →
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {popular.map((d) => (
            <DestinationCard key={d.slug} d={d} />
          ))}
        </div>
      </section>

      {/* ---------- HOW IT WORKS ---------- */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="rounded-3xl bg-gradient-to-br from-teal-800 to-teal-600 p-8 text-white sm:p-10">
          <h2 className="text-center text-2xl font-extrabold sm:text-3xl">One ecosystem, five steps</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm text-teal-100">
            Unlike a travel directory or guidebooking app, Yatra Setu combines discovery, planning,
            community connection and income generation in one platform.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {STEPS.map((s, i) => (
              <div key={s.label} className="flex items-center gap-3 sm:gap-4">
                <div className="flex flex-col items-center">
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/15 text-2xl backdrop-blur">
                    {s.icon}
                  </span>
                  <span className="mt-1.5 text-xs font-bold uppercase tracking-wider text-teal-100">{s.label}</span>
                </div>
                {i < STEPS.length - 1 && <span className="text-teal-300">→</span>}
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/plan" className="btn-primary !bg-white !text-teal-800 hover:!bg-teal-50">
              Start planning — it takes 30 seconds
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
