import { NextResponse } from "next/server";
import { getDb } from "@/lib/db.mjs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").toLowerCase().trim();
  const category = searchParams.get("category") || "All";
  const state = searchParams.get("state") || "";

  let rows = getDb().prepare("SELECT * FROM destinations ORDER BY popular DESC, rating DESC").all() as any[];
  if (q) {
    rows = rows.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.state.toLowerCase().includes(q) ||
        d.tagline.toLowerCase().includes(q) ||
        d.desc.toLowerCase().includes(q)
    );
  }
  if (category && category !== "All") {
    rows = rows.filter((d) => {
      try { return JSON.parse(d.categories).includes(category); } catch { return false; }
    });
  }
  if (state) rows = rows.filter((d) => d.state === state);

  const data = rows.map((d) => ({ ...d, categories: JSON.parse(d.categories), images: JSON.parse(d.images) }));
  return NextResponse.json({ destinations: data });
}
