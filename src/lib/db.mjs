// SQLite database layer using node:sqlite (built into Node 22+, zero native deps).
// The DB file lives in .data/ (gitignored) so a fresh checkout seeds itself on first run.

import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { DESTINATIONS, GUIDES, HOMESTAYS, REVIEWS, DEMO_USERS, TRIP_TEMPLATES } from "./seed-data.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.YATRA_DATA_DIR || path.join(__dirname, "..", "..", ".data");
fs.mkdirSync(DATA_DIR, { recursive: true });
const DB_PATH = path.join(DATA_DIR, "yatra.db");

let db;

function init() {
  db = new DatabaseSync(DB_PATH);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT DEFAULT '',
      city TEXT DEFAULT '',
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'traveler',
      avatar TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS destinations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      state TEXT NOT NULL,
      tagline TEXT,
      categories TEXT DEFAULT '[]',
      lat REAL, lng REAL,
      rating REAL DEFAULT 4.5,
      reviews_count INTEGER DEFAULT 0,
      desc TEXT,
      best_time TEXT, budget TEXT, travel_mode TEXT,
      images TEXT DEFAULT '[]',
      popular INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS experiences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dest_slug TEXT NOT NULL,
      title TEXT NOT NULL,
      type TEXT, price INTEGER DEFAULT 0, price_label TEXT,
      dur TEXT, desc TEXT, img TEXT
    );
    CREATE TABLE IF NOT EXISTS guides (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dest_slug TEXT NOT NULL,
      name TEXT NOT NULL,
      img TEXT, langs TEXT, years INTEGER DEFAULT 1,
      fee INTEGER DEFAULT 1000, rating REAL DEFAULT 4.5,
      verified INTEGER DEFAULT 0, tagline TEXT,
      host_user_id INTEGER
    );
    CREATE TABLE IF NOT EXISTS homestays (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dest_slug TEXT NOT NULL,
      name TEXT NOT NULL, host TEXT, img TEXT,
      price INTEGER DEFAULT 1500, rating REAL DEFAULT 4.5,
      tagline TEXT,
      host_user_id INTEGER
    );
    CREATE TABLE IF NOT EXISTS trips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      start_date TEXT, end_date TEXT,
      interests TEXT DEFAULT '[]',
      budget INTEGER DEFAULT 20000,
      pace TEXT DEFAULT 'relaxed',
      status TEXT DEFAULT 'upcoming',
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS trip_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL,
      day INTEGER NOT NULL DEFAULT 1,
      time TEXT DEFAULT '09:00',
      title TEXT NOT NULL,
      dest_slug TEXT,
      kind TEXT DEFAULT 'activity',
      cost INTEGER DEFAULT 0,
      done INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      kind TEXT NOT NULL,             -- 'guide' | 'homestay' | 'experience'
      ref_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      dest_slug TEXT,
      host_user_id INTEGER,           -- host who fulfils it
      date TEXT,
      guests INTEGER DEFAULT 2,
      amount INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',  -- pending | confirmed | declined
      note TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS saved_places (
      user_id INTEGER NOT NULL,
      dest_slug TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, dest_slug)
    );
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dest_slug TEXT NOT NULL,
      user_id INTEGER,
      name TEXT NOT NULL,
      rating INTEGER NOT NULL,
      text TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS host_listings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      kind TEXT NOT NULL,             -- 'guide' | 'homestay' | 'experience'
      title TEXT NOT NULL,
      dest_slug TEXT NOT NULL,
      price INTEGER DEFAULT 1000,
      langs TEXT DEFAULT '',
      tagline TEXT DEFAULT '',
      img TEXT DEFAULT '',
      status TEXT DEFAULT 'pending',  -- pending | approved
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS activity (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      icon TEXT DEFAULT '📍',
      text TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
  seedIfEmpty();
}

function hashPassword(pw, salt) {
  return crypto.scryptSync(pw, salt, 32).toString("hex");
}

function seedIfEmpty() {
  const row = db.prepare("SELECT COUNT(*) AS c FROM destinations").get();
  if (row.c > 0) return;

  const insUser = db.prepare(
    "INSERT INTO users (name,email,phone,city,password_hash,salt,role,avatar) VALUES (?,?,?,?,?,?,?,?)"
  );
  for (const u of DEMO_USERS) {
    const salt = crypto.randomBytes(8).toString("hex");
    insUser.run(u.name, u.email, u.phone || "", u.city || "", hashPassword(u.password, salt), salt, u.role, "");
  }

  const insDest = db.prepare(`INSERT INTO destinations
    (slug,name,state,tagline,categories,lat,lng,rating,reviews_count,desc,best_time,budget,travel_mode,images,popular)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  const insExp = db.prepare(
    "INSERT INTO experiences (dest_slug,title,type,price,price_label,dur,desc,img) VALUES (?,?,?,?,?,?,?,?)"
  );
  const insGuide = db.prepare(
    "INSERT INTO guides (dest_slug,name,img,langs,years,fee,rating,verified,tagline) VALUES (?,?,?,?,?,?,?,?,?)"
  );
  const insHome = db.prepare(
    "INSERT INTO homestays (dest_slug,name,host,img,price,rating,tagline) VALUES (?,?,?,?,?,?,?)"
  );
  const insReview = db.prepare(
    "INSERT INTO reviews (dest_slug,user_id,name,rating,text) VALUES (?,?,?,?,?)"
  );

  const popularSlugs = ["rishikesh", "jaipur", "goa", "ladakh"];
  for (const d of DESTINATIONS) {
    insDest.run(
      d.slug, d.name, d.state, d.tagline,
      JSON.stringify(d.categories),
      d.lat, d.lng, d.rating, d.reviews, d.desc,
      d.best_time, d.budget, d.travel_mode,
      JSON.stringify(d.images),
      popularSlugs.includes(d.slug) ? 1 : 0
    );
    for (const e of d.experiences) {
      insExp.run(d.slug, e.title, e.type, e.price, e.price_label, e.dur, e.desc, e.img);
    }
  }
  for (const g of GUIDES) {
    insGuide.run(g.dest, g.name, g.img, g.langs, g.years, g.fee, g.rating, g.verified ? 1 : 0, g.tagline);
  }
  for (const h of HOMESTAYS) {
    insHome.run(h.dest, h.name, h.host, h.img, h.price, h.rating, h.tagline);
  }
  for (const r of REVIEWS) {
    const u = db.prepare("SELECT id FROM users WHERE email = 'aarav@demo.in'").get();
    insReview.run(r.dest, r.name === "Aarav Sharma" ? u.id : null, r.name, r.rating, r.text);
  }

  // Demo trips + bookings for the traveler demo account so the dashboard isn't empty
  const aarav = db.prepare("SELECT id FROM users WHERE email = 'aarav@demo.in'").get();
  const t1 = db.prepare(
    "INSERT INTO trips (user_id,name,start_date,end_date,interests,budget,pace,status) VALUES (?,?,?,?,?,?,?,?)"
  ).run(aarav.id, "Himachal & Rishikesh Escape", "2026-10-16", "2026-10-20",
    JSON.stringify(["Adventure", "Spiritual"]), 22000, "relaxed", "upcoming");
  const t1id = t1.lastInsertRowid;
  const insItem = db.prepare(
    "INSERT INTO trip_items (trip_id,day,time,title,dest_slug,kind,cost) VALUES (?,?,?,?,?,?,?)"
  );
  let day = 1;
  for (const t of TRIP_TEMPLATES.rishikesh) {
    insItem.run(t1id, day, day === 1 ? "17:00" : "09:00", t, "rishikesh", "activity", day === 2 ? 1200 : 0);
    day++;
  }
  const t2 = db.prepare(
    "INSERT INTO trips (user_id,name,start_date,end_date,interests,budget,pace,status) VALUES (?,?,?,?,?,?,?,?)"
  ).run(aarav.id, "Rajasthan Heritage Loop", "2026-11-05", "2026-11-09",
    JSON.stringify(["Heritage", "Food"]), 30000, "packed", "upcoming");
  day = 1;
  for (const t of TRIP_TEMPLATES.jaipur) {
    insItem.run(t2.lastInsertRowid, day, "09:00", t, "jaipur", "activity", day === 1 ? 700 : 900);
    day++;
  }

  const insBooking = db.prepare(
    "INSERT INTO bookings (user_id,kind,ref_id,title,dest_slug,host_user_id,date,guests,amount,status,note) VALUES (?,?,?,?,?,?,?,?,?,?,?)"
  );
  const meera = db.prepare("SELECT id FROM users WHERE email = 'meera@demo.in'").get();
  const tsering = db.prepare("SELECT id FROM users WHERE email = 'tsering@demo.in'").get();
  insBooking.run(aarav.id, "homestay", 8, "Backwater Bread & Breakfast", "kerala", meera.id,
    "2026-10-02", 2, 2400, "confirmed", "Arriving by evening, need canoe pickup");
  insBooking.run(aarav.id, "guide", 7, "Tsering Angmo", "ladakh", tsering.id,
    "2026-10-18", 3, 2000, "pending", "Two days: Thiksey + Pangong");

  db.prepare(
    "INSERT INTO activity (user_id,icon,text) VALUES (?,?,?)"
  ).run(aarav.id, "👀", "You viewed Goa");
  db.prepare(
    "INSERT INTO activity (user_id,icon,text) VALUES (?,?,?)"
  ).run(aarav.id, "❤️", "You added Jaipur to your wishlist");
  db.prepare(
    "INSERT INTO activity (user_id,icon,text) VALUES (?,?,?)"
  ).run(aarav.id, "⭐", "You reviewed Rishikesh");
}

export function getDb() {
  if (!db) init();
  return db;
}

export { hashPassword };

// ---------- helpers ----------

export function addActivity(userId, icon, text) {
  getDb().prepare("INSERT INTO activity (user_id,icon,text) VALUES (?,?,?)").run(userId, icon, text);
}

export function userFromToken(token) {
  if (!token) return null;
  const row = getDb().prepare(
    `SELECT u.id, u.name, u.email, u.role, u.city, u.phone, u.avatar
     FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?`
  ).get(token);
  return row || null;
}
