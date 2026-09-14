"use client";

import Link from "next/link";
import { useAuth } from "@/lib/useAuth";

const PERKS = [
  { icon: "💰", title: "Earn from your knowledge", desc: "Host travellers, guide them through your streets and forests, set your own price." },
  { icon: "🛡️", title: "Verified & trusted", desc: "Get a verified badge, transparent reviews and direct requests — no middlemen." },
  { icon: "🌍", title: "Fight over-tourism", desc: "Route visitors to hidden gems in your area and keep tourism income in the community." },
];

const STEPS = [
  { n: "1", title: "Tell us about you", desc: "Your village, town or city and what you love showing people." },
  { n: "2", title: "Create your listing", desc: "Guide service, homestay or experience — with your own price." },
  { n: "3", title: "Accept requests", desc: "Travellers request, you confirm. Meet, host, earn, get reviewed." },
];

export default function HostLanding() {
  const { user } = useAuth();

  return (
    <div>
      <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl shadow-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1598887142487-3c854d51eabb?auto=format&fit=crop&w=1920&q=80"
            alt="Living root bridge, Meghalaya"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-teal-950/85 via-teal-900/50 to-transparent" />
          <div className="relative p-8 sm:p-14">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-teal-200">Connect · Experience · Earn</p>
            <h1 className="mt-3 max-w-xl text-4xl font-extrabold leading-tight text-white sm:text-5xl">
              Turn your hometown into a classroom
            </h1>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-teal-50">
              Join the local side of Yatra Setu. Share your streets, food, crafts and stories — and earn a
              sustainable income while fighting over-tourism.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href={user ? "/host/dashboard" : "/login?tab=signup"} className="btn-primary !bg-white !text-teal-800 hover:!bg-teal-50">
                {user ? "Open Host Console →" : " Become a Host — it's free"}
              </Link>
              <Link href="/about" className="btn-outline !border-white/60 !text-white hover:!bg-white/10">
                Why local-first?
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-5 md:grid-cols-3">
          {PERKS.map((p) => (
            <div key={p.title} className="card p-6">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-2xl">{p.icon}</span>
              <p className="mt-4 text-lg font-bold text-slate-900">{p.title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{p.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-12">
          <h2 className="section-title text-center">How earning works</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="card relative p-6">
                <span className="step-dot absolute -top-4 left-6">{s.n}</span>
                <p className="mt-3 text-lg font-bold text-slate-900">{s.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 rounded-3xl bg-gradient-to-br from-teal-800 to-teal-600 p-10 text-center text-white">
          <p className="text-2xl font-extrabold">Real people. Real places. Real stories.</p>
          <p className="mx-auto mt-2 max-w-lg text-sm text-teal-100">
            Local hosts across 12 destinations are already sharing their India. Your neighbourhood is next.
          </p>
          <Link href={user ? "/host/dashboard" : "/login?tab=signup"} className="btn-primary mt-6 !bg-white !text-teal-800 hover:!bg-teal-50">
            {user ? "Go to Host Console" : "Start hosting"}
          </Link>
        </div>
      </section>
    </div>
  );
}
