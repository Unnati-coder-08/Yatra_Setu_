import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-700 text-lg text-white">🛶</span>
            <div>
              <p className="text-lg font-extrabold tracking-tight text-teal-900">Yatra Setu</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-600">
                Local-First Travel Ecosystem
              </p>
            </div>
          </div>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-500">
            A bridge between travellers and local communities — discover hidden gems, plan personalized
            itineraries, connect with verified local guides and stay in community homestays.
          </p>
          <p className="mt-4 text-sm font-semibold italic text-teal-700">
            &ldquo;Travel through the eyes of a local, not just the eyes of a tourist.&rdquo;
          </p>
        </div>
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Explore</p>
          <ul className="space-y-2 text-sm text-slate-600">
            <li><Link href="/explore" className="hover:text-teal-700">Destinations</Link></li>
            <li><Link href="/explore?category=Mountains" className="hover:text-teal-700">Mountains</Link></li>
            <li><Link href="/explore?category=Beaches" className="hover:text-teal-700">Beaches</Link></li>
            <li><Link href="/explore?category=Heritage" className="hover:text-teal-700">Heritage</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Platform</p>
          <ul className="space-y-2 text-sm text-slate-600">
            <li><Link href="/plan" className="hover:text-teal-700">Plan a Trip</Link></li>
            <li><Link href="/host" className="hover:text-teal-700">Become a Host</Link></li>
            <li><Link href="/dashboard" className="hover:text-teal-700">Dashboard</Link></li>
            <li><Link href="/about" className="hover:text-teal-700">About &amp; USP</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-100">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-4 py-5 text-sm text-slate-600">
          <span className="font-bold uppercase tracking-wider text-teal-700">Contact us</span>
          <a href="mailto:yatrasetu@gmail.com" className="flex items-center gap-1.5 transition-colors hover:text-teal-700">
            <span aria-hidden>✉️</span> yatrasetu@gmail.com
          </a>
          <a href="tel:+919987230415" className="flex items-center gap-1.5 transition-colors hover:text-teal-700">
            <span aria-hidden>📞</span> +91 9987230415
          </a>
          <a
            href="https://www.instagram.com/yatrasetu_make_travel_personal"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 transition-colors hover:text-teal-700"
          >
            <span aria-hidden>📷</span> @yatrasetu_make_travel_personal
          </a>
        </div>
      </div>
      <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-400">
        Smart India Hackathon 2026 prototype · Yatra Setu · Built with ❤️ for local communities
      </div>
    </footer>
  );
}
