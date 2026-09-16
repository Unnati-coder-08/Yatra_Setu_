"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/useAuth";

const HOTLINES = [
  { num: "112", label: "National Emergency", desc: "Police · Fire · Medical (all-in-one)", icon: "🆘" },
  { num: "100", label: "Police", desc: "Control room, all states", icon: "👮" },
  { num: "108", label: "Ambulance", desc: "Free emergency medical response", icon: "🚑" },
  { num: "101", label: "Fire", desc: "Fire & rescue services", icon: "🚒" },
  { num: "1091", label: "Women Helpline", desc: "24×7 support for women in distress", icon: "🛡️" },
  { num: "1098", label: "Child Helpline", desc: "CHILDLINE — children in emergency", icon: "🧒" },
  { num: "1363", label: "Tourist Helpline", desc: "Ministry of Tourism, multi-language", icon: "🧳" },
  { num: "1078", label: "Disaster Management", desc: "NDMA flood / earthquake helpline", icon: "🌊" },
];

interface NearbyPlace {
  name: string;
  kind: "hospital" | "police";
  distance_m: number;
  lat: number;
  lng: number;
  phone?: string;
}

// Overpass: free OpenStreetMap query API — no key needed
function overpassQuery(lat: number, lng: number, radius: number) {
  return `[out:json][timeout:12];(
    node["amenity"="hospital"](around:${radius},${lat},${lng});
    node["amenity"="clinic"](around:${radius},${lat},${lng});
    node["amenity"="police"](around:${radius},${lat},${lng});
  );out body 24;`;
}

function haversine(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371000;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export default function EmergencyPage() {
  const { user } = useAuth();
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locError, setLocError] = useState("");
  const [nearby, setNearby] = useState<NearbyPlace[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [sosCount, setSosCount] = useState(3);
  const [sosArmed, setSosArmed] = useState(false);
  const [sosMsg, setSosMsg] = useState("");
  const [shareMsg, setShareMsg] = useState("");
  const [shareBusy, setShareBusy] = useState(false);
  const [trustedPhone, setTrustedPhone] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const locate = useCallback((): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported on this device"));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => reject(new Error("Location permission denied — enable it to use SOS & share")),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }, []);

  const loadNearby = useCallback(async (lat: number, lng: number) => {
    setNearbyLoading(true);
    try {
      for (const radius of [4000, 15000, 40000]) {
        const r = await fetch("https://overpass-api.de/api/interpreter", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: "data=" + encodeURIComponent(overpassQuery(lat, lng, radius)),
        });
        if (!r.ok) continue;
        const d = await r.json();
        const places: NearbyPlace[] = (d.elements || [])
          .map((e: any) => ({
            name: e.tags?.name || (e.tags?.amenity === "police" ? "Police station" : "Medical centre"),
            kind: e.tags?.amenity === "police" ? ("police" as const) : ("hospital" as const),
            distance_m: Math.round(haversine(lat, lng, e.lat, e.lon)),
            lat: e.lat,
            lng: e.lon,
            phone: e.tags?.phone || e.tags?.["contact:phone"],
          }))
          .sort((a: NearbyPlace, b: NearbyPlace) => a.distance_m - b.distance_m)
          .slice(0, 12);
        if (places.length >= 3 || radius === 40000) {
          setNearby(places);
          break;
        }
      }
    } catch {
      setNearby([]);
    } finally {
      setNearbyLoading(false);
    }
  }, []);

  useEffect(() => {
    locate()
      .then((c) => {
        setCoords(c);
        loadNearby(c.lat, c.lng);
      })
      .catch((e) => setLocError(e.message));
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [locate, loadNearby]);

  async function triggerSOS() {
    if (!sosArmed) {
      setSosArmed(true);
      setSosMsg("");
      timerRef.current = setInterval(() => {
        setSosCount((c) => {
          if (c <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }
  }

  function cancelSOS() {
    setSosArmed(false);
    setSosCount(3);
    setSosMsg("");
    if (timerRef.current) clearInterval(timerRef.current);
  }

  async function sendAlert(type: "sos" | "location_share") {
    setShareBusy(true);
    try {
      const c = coords || (await locate());
      setCoords(c);
      const r = await fetch("/api/emergency/alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, lat: c.lat, lng: c.lng, contact_phone: trustedPhone || undefined }),
      });
      const d = await r.json();
      if (type === "sos") {
        setSosArmed(false);
        setSosCount(3);
        setSosMsg(d.message || "SOS sent.");
      } else {
        setShareMsg(d.message || "Location shared.");
      }
    } catch (e: any) {
      const m = e?.message || "Could not get your location";
      if (type === "sos") setSosMsg(m);
      else setShareMsg(m);
    } finally {
      setShareBusy(false);
    }
  }

  const mapsUrl = coords
    ? `https://www.google.com/maps/search/hospital+police/@${coords.lat},${coords.lng},14z`
    : "https://www.google.com/maps/search/hospital+police";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <p className="text-sm font-semibold text-rose-600">Safety centre</p>
      <h1 className="mt-0.5 text-3xl font-extrabold tracking-tight text-slate-900">Emergency help</h1>
      <p className="mt-1 text-sm text-slate-500">
        Stuck, scared, or hurt? Everything you need is one tap away — works even if you&apos;re far from home.
      </p>

      {/* SOS */}
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="card flex flex-col items-center justify-center border-rose-100 bg-gradient-to-b from-rose-50 to-white p-8 text-center">
          <button
            onClick={sosArmed && sosCount > 0 ? cancelSOS : triggerSOS}
            className={`grid h-36 w-36 place-items-center rounded-full text-white shadow-2xl transition ${
              sosArmed
                ? "bg-slate-700 hover:bg-slate-800"
                : "animate-pulse bg-gradient-to-br from-rose-600 to-rose-500 hover:from-rose-700 hover:to-rose-600"
            }`}
            style={sosArmed && sosCount > 0 ? { transform: `scale(${1 + (3 - sosCount) * 0.02})` } : undefined}
            aria-label="SOS button"
          >
            <span className="text-center">
              <span className="block text-4xl font-black">
                {sosArmed ? (sosCount > 0 ? sosCount : "…") : "SOS"}
              </span>
              <span className="mt-1 block text-[10px] font-bold uppercase tracking-widest">
                {sosArmed ? (sosCount > 0 ? "tap to cancel" : "sending") : "press for help"}
              </span>
            </span>
          </button>
          <p className="mt-4 text-xs leading-relaxed text-slate-500">
            {sosArmed
              ? "Sending in 3 seconds — tap Cancel if this was a mistake."
              : "Alerts your trusted contact with a map pin of where you are."}
          </p>
          <div className="mt-4 w-full max-w-xs">
            <span className="label">Trusted contact (optional)</span>
            <input
              className="input"
              placeholder="Parent / friend's phone number"
              value={trustedPhone}
              onChange={(e) => setTrustedPhone(e.target.value)}
            />
          </div>
          {sosMsg && (
            <p className={`mt-3 rounded-xl px-4 py-2 text-sm font-semibold ${sosMsg.includes("sent") || sosMsg.includes("alerted") ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600"}`}>
              {sosMsg}
            </p>
          )}
        </div>

        {/* share location */}
        <div className="card p-6">
          <h2 className="text-lg font-bold text-slate-900">📍 Share live location</h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            Send your current position as a map link to someone you trust — ideal when trekking, taking night rides,
            or meeting someone new.
          </p>
          <div className="mt-4 space-y-3">
            <div>
              <span className="label">Send to (phone or email)</span>
              <input
                className="input"
                placeholder="e.g. Mom, 98100 12345"
                value={trustedPhone}
                onChange={(e) => setTrustedPhone(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
              <span>{coords ? `Your position: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : locError || "Locating…"}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="btn-primary flex-1" disabled={shareBusy || !coords} onClick={() => sendAlert("location_share")}>
                {shareBusy ? "Sharing…" : "📤 Share my location"}
              </button>
              <a
                className="btn-outline !px-4 !py-2.5 text-sm"
                href={coords ? `https://maps.google.com/?q=${coords.lat},${coords.lng}` : mapsUrl}
                target="_blank"
                rel="noreferrer"
              >
                🗺️ View on map
              </a>
            </div>
            {shareMsg && (
              <p className={`rounded-xl px-4 py-2 text-sm font-semibold ${shareMsg.includes("sent") || shareMsg.includes("shared") ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600"}`}>
                {shareMsg}
              </p>
            )}
            {user && (
              <p className="text-[11px] text-slate-400">
                Every SOS / share is also logged to your dashboard activity feed.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* hotlines */}
      <div className="card mt-6 p-6">
        <h2 className="text-lg font-bold text-slate-900">☎️ Emergency numbers (India)</h2>
        <p className="text-xs text-slate-400">Tap any card to call directly — free from any phone.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {HOTLINES.map((h) => (
            <a
              key={h.num}
              href={`tel:${h.num}`}
              className="group rounded-2xl border border-slate-100 p-4 transition hover:border-rose-300 hover:bg-rose-50/40"
            >
              <p className="text-2xl">{h.icon}</p>
              <p className="mt-1.5 text-xl font-black text-rose-600">{h.num}</p>
              <p className="text-sm font-bold text-slate-800">{h.label}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-slate-400">{h.desc}</p>
            </a>
          ))}
        </div>
      </div>

      {/* nearby */}
      <div className="card mt-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">🏥 Nearby help</h2>
            <p className="text-xs text-slate-400">
              {nearbyLoading ? "Finding services around you…" : `${nearby.length} hospitals & police stations close to you`}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              className="btn-outline !px-4 !py-2 text-xs"
              onClick={async () => {
                setLocError("");
                try {
                  const c = await locate();
                  setCoords(c);
                  loadNearby(c.lat, c.lng);
                } catch (e: any) {
                  setLocError(e.message);
                }
              }}
            >
              ⟳ Refresh
            </button>
            <a className="btn-primary !px-4 !py-2 text-xs" href={mapsUrl} target="_blank" rel="noreferrer">
              Open in Maps
            </a>
          </div>
        </div>
        {locError && <p className="mt-3 rounded-xl bg-amber-50 px-4 py-2.5 text-xs text-amber-800">{locError} — showing national helplines above instead.</p>}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {nearby.map((p, i) => (
            <a
              key={`${p.kind}-${i}`}
              href={`https://maps.google.com/?q=${p.lat},${p.lng}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-2xl border border-slate-100 p-4 transition hover:border-teal-300 hover:bg-teal-50/30"
            >
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xl ${p.kind === "hospital" ? "bg-rose-50" : "bg-sky-50"}`}>
                {p.kind === "hospital" ? "🏥" : "👮"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-800">{p.name}</p>
                <p className="text-xs text-slate-500">
                  {p.kind === "hospital" ? "Hospital / clinic" : "Police station"} · {(p.distance_m / 1000).toFixed(1)} km away
                  {p.phone ? ` · ☎ ${p.phone}` : ""}
                </p>
              </div>
              <span className="text-xs font-bold text-teal-700">Directions →</span>
            </a>
          ))}
          {!nearbyLoading && nearby.length === 0 && !locError && (
            <p className="text-sm text-slate-400">Could not load nearby services — use the national helplines above.</p>
          )}
        </div>
      </div>

      <p className="mt-6 rounded-2xl bg-slate-50 px-5 py-4 text-center text-xs leading-relaxed text-slate-400">
        Yatra Setu safety note: always share your itinerary with family, keep a power bank on day trips, and save your
        homestay host&apos;s number. For life-threatening emergencies call <b className="text-rose-600">112</b> first.
      </p>
    </div>
  );
}
