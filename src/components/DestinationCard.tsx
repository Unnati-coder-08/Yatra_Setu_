import Link from "next/link";
import type { Destination } from "@/lib/types";

export default function DestinationCard({ d }: { d: Destination }) {
  return (
    <Link
      href={`/destinations/${d.slug}`}
      className="card card-hover group block overflow-hidden"
    >
      <div className="relative h-44 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={d.images[0]}
          alt={d.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute right-2.5 top-2.5 rounded-full bg-white/90 px-2 py-1 text-xs font-bold text-slate-700 shadow">
          ⭐ {d.rating.toFixed(1)}
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-bold text-slate-900 group-hover:text-teal-700">{d.name}</p>
            <p className="text-xs text-slate-400">{d.state}</p>
          </div>
          <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-teal-50 text-sm text-teal-700 transition group-hover:bg-teal-700 group-hover:text-white">
            →
          </span>
        </div>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {d.categories.slice(0, 2).map((c) => (
            <span key={c} className="tag">{c}</span>
          ))}
        </div>
      </div>
    </Link>
  );
}
