"use client";

import { useEffect, useMemo } from "react";
import type { Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";

export interface MapPoint {
  slug: string;
  name: string;
  lat: number;
  lng: number;
  img?: string;
  subtitle?: string;
}

export default function IndiaMap({
  points,
  route = false,
  height = "100%",
  focus,
}: {
  points: MapPoint[];
  route?: boolean;
  height?: string;
  focus?: { lat: number; lng: number; zoom?: number };
}) {
  const mapId = useMemo(() => `map-${Math.random().toString(36).slice(2, 9)}`, []);
  const key = useMemo(
    () => JSON.stringify(points.map((p) => [p.slug, p.lat, p.lng])) + (route ? "|r" : "") + (focus ? `|${focus.lat},${focus.lng}` : ""),
    [points, route, focus]
  );

  useEffect(() => {
    const el = document.getElementById(mapId);
    if (!el) return;

    let map: LeafletMap | undefined;
    let cancelled = false;

    (async () => {
      // dynamic import keeps Leaflet out of SSR (it needs `window` at import time)
      const L = await import("leaflet");
      if (cancelled || !document.getElementById(mapId)) return;

      map = L.map(el, {
        center: focus ? [focus.lat, focus.lng] : [22.8, 79],
        zoom: focus ? focus.zoom ?? 6 : 5,
        scrollWheelZoom: false,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(map);

      const icon = L.divIcon({
        className: "ys-pin",
        html: `<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#0f766e;border:2.5px solid white;box-shadow:0 2px 6px rgba(15,60,55,.4)"></div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 26],
        popupAnchor: [0, -24],
      });

      const latlngs: [number, number][] = [];
      for (const p of points) {
        const m = L.marker([p.lat, p.lng], { icon }).addTo(map);
        latlngs.push([p.lat, p.lng]);
        const body = `
          <div style="min-width:170px">
            ${p.img ? `<img src="${p.img}" style="width:100%;height:80px;object-fit:cover;border-radius:8px;margin-bottom:6px" />` : ""}
            <b style="font-size:13px;color:#0f172a">${p.name}</b>
            ${p.subtitle ? `<div style="font-size:11px;color:#64748b;margin-top:2px">${p.subtitle}</div>` : ""}
            <a href="/destinations/${p.slug}" style="display:inline-block;margin-top:6px;font-size:12px;font-weight:600;color:#0f766e">Open destination →</a>
          </div>`;
        m.bindPopup(body);
      }
      if (route && latlngs.length >= 2) {
        L.polyline(latlngs, { color: "#0f766e", weight: 2.5, dashArray: "6 8", opacity: 0.8 }).addTo(map);
      }

      if (points.length && !focus) {
        map.fitBounds(L.latLngBounds(latlngs).pad(0.18));
      }
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return <div id={mapId} style={{ width: "100%", height, borderRadius: 12 }} className="overflow-hidden bg-slate-100" />;
}
