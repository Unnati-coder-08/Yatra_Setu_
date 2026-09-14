import { NextResponse } from "next/server";
import { getDb, addActivity } from "@/lib/db.mjs";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const db = getDb();
  const listings = db.prepare("SELECT * FROM host_listings WHERE user_id = ? ORDER BY id DESC").all(user.id);
  return NextResponse.json({ listings });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body?.kind || !body?.title || !body?.dest_slug) {
    return NextResponse.json({ error: "kind, title and dest_slug are required" }, { status: 400 });
  }
  if (!["guide", "homestay", "experience"].includes(body.kind)) {
    return NextResponse.json({ error: "kind must be guide, homestay or experience" }, { status: 400 });
  }
  const db = getDb();
  const dest = db.prepare("SELECT name, images FROM destinations WHERE slug = ?").get(body.dest_slug) as any;
  if (!dest) return NextResponse.json({ error: "Unknown destination" }, { status: 400 });
  const fallbackImg = JSON.parse(dest.images || "[]")[0] || "";
  const info = db.prepare(
    "INSERT INTO host_listings (user_id,kind,title,dest_slug,price,langs,tagline,img,status) VALUES (?,?,?,?,?,?,?,?, 'approved')"
  ).run(
    user.id,
    body.kind,
    String(body.title).slice(0, 120),
    body.dest_slug,
    Number(body.price) || 1000,
    body.langs || "",
    String(body.tagline || "").slice(0, 200),
    body.img || fallbackImg
  );
  // A host-provided guide listing also shows up in the destination's guide list
  if (body.kind === "guide") {
    db.prepare(
      "INSERT INTO guides (dest_slug,name,img,langs,years,fee,rating,verified,tagline,host_user_id) VALUES (?,?,?,?,?,?,4.6,0,?,?)"
    ).run(body.dest_slug, user.name, user.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80", body.langs || "Hindi, English", 1, Number(body.price) || 1000, String(body.tagline || "").slice(0, 200), user.id);
  }
  if (body.kind === "homestay") {
    db.prepare(
      "INSERT INTO homestays (dest_slug,name,host,img,price,rating,tagline,host_user_id) VALUES (?,?,?,?,?,4.6,?,?)"
    ).run(body.dest_slug, body.title, user.name, body.img || fallbackImg, Number(body.price) || 1500, String(body.tagline || "").slice(0, 200), user.id);
  }
  addActivity(user.id, "🏠", `Listing created: ${body.title}`);
  return NextResponse.json({ listing: db.prepare("SELECT * FROM host_listings WHERE id = ?").get(info.lastInsertRowid) }, { status: 201 });
}
