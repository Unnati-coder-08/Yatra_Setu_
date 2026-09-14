import Link from "next/link";

const FEATURES = [
  { icon: "🧭", title: "Local Discovery", desc: "Local share hidden attractions, food, culture, routes & experiences." },
  { icon: "📅", title: "Personalized Itineraries", desc: "Save local recommendations and build custom travel plans." },
  { icon: "🤝", title: "Local Guide Connect", desc: "Connect with verified locals for personalized guidance." },
  { icon: "📍", title: "Hyperlocal Information", desc: "Nearby transport, food, accommodation & essential services." },
  { icon: "🌍", title: "Two-Sided Ecosystem", desc: "Locals earn as guides; travellers get authentic, personalized experiences." },
  { icon: "🏠", title: "Local Homestay Network", desc: "Immersive, community-driven stays — not hotels." },
];

const STEPS = [
  { icon: "🔍", label: "Discover" },
  { icon: "📅", label: "Plan" },
  { icon: "🤝", label: "Connect" },
  { icon: "⛰️", label: "Experience" },
  { icon: "💰", label: "Earn" },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-[0.28em] text-teal-700">Proposed Solution</p>
      <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-900">
        A Local-First Tourism Ecosystem
      </h1>
      <p className="mt-4 max-w-3xl leading-relaxed text-slate-600">
        Yatra Setu connects travellers with local residents to discover authentic, lesser-known places,
        experiences and essential services beyond conventional tourist destinations — reducing dependence
        on generic guides and over-crowded spots while creating income for local communities.
      </p>

      {/* problem it solves */}
      <div className="mt-8 rounded-3xl border-l-4 border-teal-600 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">How it addresses the problem</h2>
        <ul className="mt-3 grid gap-2.5 text-sm text-slate-600 sm:grid-cols-2">
          {[
            "Reduces dependence on generic tourist guides & overcrowded destinations",
            "Provides reliable, real-time hyperlocal knowledge from residents",
            "Makes trip planning more personalised & convenient",
            "Creates income opportunities for local communities",
            "Promotes responsible & community-driven tourism",
          ].map((t) => (
            <li key={t} className="flex gap-2">
              <span className="text-teal-600">✓</span> {t}
            </li>
          ))}
        </ul>
      </div>

      {/* key features */}
      <h2 className="section-title mt-12">Key Features</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="card card-hover p-5">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-teal-50 text-xl">{f.icon}</span>
            <p className="mt-3 font-bold text-slate-900">{f.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-500">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* innovation loop */}
      <div className="mt-12 rounded-3xl bg-gradient-to-br from-teal-800 to-teal-600 p-8 text-white sm:p-10">
        <h2 className="text-center text-2xl font-extrabold">Innovation & Uniqueness</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-teal-100">
          Not a directory. Not a guide-booking app. One ecosystem that combines local discovery, itinerary
          planning, guide services and community income generation.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          {STEPS.map((s, i) => (
            <div key={s.label} className="flex items-center gap-3 sm:gap-4">
              <div className="flex flex-col items-center">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/15 text-2xl backdrop-blur">{s.icon}</span>
                <span className="mt-1.5 text-xs font-bold uppercase tracking-wider text-teal-100">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && <span className="text-teal-300">→</span>}
            </div>
          ))}
        </div>
      </div>

      {/* USP */}
      <div className="mt-12 text-center">
        <p className="text-3xl font-extrabold italic text-teal-800 sm:text-4xl">
          &ldquo;Travel through the eyes of a local,<br />not just the eyes of a tourist.&rdquo;
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/explore" className="btn-primary">Start exploring</Link>
          <Link href="/host" className="btn-outline">Become a host</Link>
        </div>
      </div>
    </div>
  );
}
