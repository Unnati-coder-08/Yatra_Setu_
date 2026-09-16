import { NextResponse } from "next/server";
import { getDb, addActivity } from "@/lib/db.mjs";
import { getCurrentUser } from "@/lib/auth";

const KINDS = ["guide", "homestay", "experience", "place"];

// Normalise whatever image payload arrives into a clean array of URLs
function toGallery(img: unknown, images: unknown): string[] {
  let list: string[] = [];
  if (Array.isArray(images)) list = images;
  else if (typeof images === "string" && images.trim()) list = images.split(/[\n,]/);
  if (typeof img === "string" && img.trim()) list.unshift(img);
  return list.map((s) => String(s).trim()).filter(Boolean).slice(0, 8);
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const db = getDb();
  const listings = db
    .prepare("SELECT * FROM host_listings WHERE user_id = ? ORDER BY id DESC")
    .all(user.id) as any[];
  const places = db
    .prepare("SELECT * FROM guide_places WHERE host_user_id = ? ORDER BY id DESC")
    .all(user.id) as any[];
  return NextResponse.json({
    listings: listings.map((l) => ({ ...l, images: JSON.parse(l.images || "[]") })),
    places: places.map((p) => ({ ...p, kind: "place" })),
  });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body?.kind || !body?.title || !body?.dest_slug) {
    return NextResponse.json({ error: "kind, title and dest_slug are required" }, { status: 400 });
  }
  if (!KINDS.includes(body.kind)) {
    return NextResponse.json({ error: "kind must be guide, homestay, experience or place" }, { status: 400 });
  }
  const db = getDb();
  const dest = db.prepare("SELECT name, images FROM destinations WHERE slug = ?").get(body.dest_slug) as any;
  if (!dest) return NextResponse.json({ error: "Unknown destination" }, { status: 400 });
  const fallbackImg = JSON.parse(dest.images || "[]")[0] || "";
  const gallery = toGallery(body.img, body.images);
  const cover = gallery[0] || fallbackImg;
  const tagline = String(body.tagline || "").slice(0, 200);

  // ---- Local place contributed by a guide: lives in guide_places, feeds itineraries ----
  if (body.kind === "place") {
    const guide = db.prepare("SELECT id FROM guides WHERE host_user_id = ? LIMIT 1").get(user.id) as any;
    const info = db.prepare(
      "INSERT INTO guide_places (host_user_id,host_name,guide_id,dest_slug,title,desc,img,price,dur) VALUES (?,?,?,?,?,?,?,?,?)"
    ).run(
      user.id, user.name, guide?.id || null, body.dest_slug,
      String(body.title).slice(0, 120), tagline, cover,
      Number(body.price) || 0, String(body.dur || "").slice(0, 40)
    );
    // keep a host_listings row so it shows in "My listings" and deletes cleanly
    db.prepare(
      "INSERT INTO host_listings (user_id,kind,title,dest_slug,price,langs,tagline,img,images,status) VALUES (?,?,?,?,?,?,?,?,?,'approved')"
    ).run(user.id, "place", String(body.title).slice(0, 120), body.dest_slug, Number(body.price) || 0, "", tagline, cover, JSON.stringify(gallery));
    addActivity(user.id, "📍", `Place added: ${body.title}`);
    const place = db.prepare("SELECT * FROM guide_places WHERE id = ?").get(info.lastInsertRowid);
    return NextResponse.json({ place }, { status: 201 });
  }

  const info = db.prepare(
    "INSERT INTO host_listings (user_id,kind,title,dest_slug,price,langs,tagline,img,images,status) VALUES (?,?,?,?,?,?,?,?,?,'approved')"
  ).run(
    user.id,
    body.kind,
    String(body.title).slice(0, 120),
    body.dest_slug,
    Number(body.price) || 1000,
    body.langs || "",
    tagline,
    cover,
    JSON.stringify(gallery)
  );

  // A host-provided guide listing also shows up in the destination's guide list
  if (body.kind === "guide") {
    const hostVerified = user.verification_status === "verified" ? 1 : 0;
    db.prepare(
      "INSERT INTO guides (dest_slug,name,img,langs,years,fee,rating,verified,tagline,host_user_id) VALUES (?,?,?,?,?,?,4.6,?,?,?)"
    ).run(
      body.dest_slug, user.name,
      user.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80",
      body.langs || "Hindi, English", 1, Number(body.price) || 1000, hostVerified, tagline, user.id
    );
  }
  if (body.kind === "homestay") {
    // Homestays carry the full photo gallery so travellers see every room
    db.prepare(
      "INSERT INTO homestays (dest_slug,name,host,img,price,rating,tagline,images,host_user_id) VALUES (?,?,?,?,?,4.6,?,?,?)"
    ).run(body.dest_slug, body.title, user.name, cover, Number(body.price) || 1500, tagline, JSON.stringify(gallery.length ? gallery : [fallbackImg]), user.id);
  }
  addActivity(user.id, "🏠", `Listing created: ${body.title}`);
  const listing = db.prepare("SELECT * FROM host_listings WHERE id = ?").get(info.lastInsertRowid);
  return NextResponse.json(
    { listing: { ...(listing as any), images: JSON.parse((listing as any).images || "[]") } },
    { status: 201 }
  );
}
