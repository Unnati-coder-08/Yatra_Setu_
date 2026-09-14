import { NextResponse } from "next/server";
import { getDb } from "@/lib/db.mjs";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const db = getDb();
  const dest = db.prepare("SELECT * FROM destinations WHERE slug = ?").get(slug) as any;
  if (!dest) return NextResponse.json({ error: "Destination not found" }, { status: 404 });

  const parse = (r: any, keys: string[]) => {
    const out = { ...r };
    for (const k of keys) out[k] = JSON.parse(out[k] || "[]");
    return out;
  };

  const experiences = db.prepare("SELECT * FROM experiences WHERE dest_slug = ? ORDER BY id").all(slug);
  const guides = db.prepare("SELECT * FROM guides WHERE dest_slug = ? ORDER BY rating DESC").all(slug);
  const homestays = db.prepare("SELECT * FROM homestays WHERE dest_slug = ? ORDER BY rating DESC").all(slug);
  const reviews = db.prepare("SELECT * FROM reviews WHERE dest_slug = ? ORDER BY id DESC").all(slug);

  let saved = false;
  const user = await getCurrentUser();
  if (user) {
    const s = db.prepare("SELECT 1 FROM saved_places WHERE user_id = ? AND dest_slug = ?").get(user.id, slug);
    saved = !!s;
  }

  return NextResponse.json({
    destination: parse(dest, ["categories", "images"]),
    experiences,
    guides,
    homestays,
    reviews,
    saved,
  });
}
