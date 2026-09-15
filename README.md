# 🛶 Yatra Setu

**Local-First Tourism Ecosystem** — Smart India Hackathon 2026 prototype.

> _"Travel through the eyes of a local, not just the eyes of a tourist."_

Yatra Setu connects travellers with local residents to discover authentic, lesser-known places, plan personalized itineraries, book verified local guides and stay in community homestays — reducing dependence on generic guides and over-crowded destinations while creating income for local communities.

---

## 🚀 Quick start

```bash
cd yatra-setu
npm install        # once
npm run dev        # development (Turbopack)
```

Open **http://localhost:3050** (if that port is busy, Next picks the next free one — the URL is printed in the terminal).

Production mode:

```bash
npm run build
npm run start      # serves on port 3050
```

**The database needs no setup.** SQLite (via Node's built-in `node:sqlite`) lives in `.data/yatra.db` and seeds itself automatically on first launch with 12 destinations, 50+ experiences, 18 verified guides, 14 homestays, 15 reviews, demo trips and bookings. Delete `.data/` to reset everything.

**Requirements:** Node.js 22+ (tested on Node 24). No external database, no API keys.

## 👤 Demo accounts (one-click on the login page)

| Account | Email | Password | Seeded with |
|---|---|---|---|
| 🧳 Traveller | `aarav@demo.in` | `demo1234` | 2 trips, 3 bookings (1 pending) |
| 🏠 Homestay Host | `meera@demo.in` | `demo1234` | 1 confirmed booking + ₹2,400 earnings |
| 🏔️ Guide Host | `tsering@demo.in` | `demo1234` | 1 pending guide request |

## 🎬 3-minute demo script

1. **Home** (`/`) — hero search, feature tiles, popular destinations, the Discover→Plan→Connect→Experience→Earn ecosystem strip.
2. **Explore** (`/explore`) — type "kash", filter by **Mountains**, toggle **Map view** (Leaflet pins + photo popups).
3. **Destination page** — click any card. Tabs for **Experiences / Local Guides / Homestays**, info tiles (best time, budget, travel mode), live map, reviews. Click **Book** on an experience → booking modal.
4. **Login** — one click **"Enter as Aarav (Traveller)"**.
5. **Dashboard** (`/dashboard`) — stats, upcoming trips, booking statuses, activity feed, saved places.
6. **Plan Your Trip** (`/plan`) — pick 2 destinations → interests/budget/pace → auto-generated **day-by-day itinerary** (drop activities, switch 🐢/⚡ pace) → **Save trip** → itinerary page with check-off.
7. **The two-sided magic** — log out, **"Enter as Meera (Homestay Host)"** → **Host Console** (`/host/dashboard`): accept Aarav's pending request → watch confirmed earnings update → create a new guide listing → it appears instantly on the destination page.
8. **About** (`/about`) — the problem, the solution, and the USP slide.

## 🧱 What's inside

- **Next.js 15 (App Router) + React 19 + TypeScript** — one app for UI + API
- **Tailwind CSS v4** — teal/emerald design system, Poppins font
- **SQLite via `node:sqlite`** — zero native dependencies, auto-seeding
- **Cookie sessions + scrypt password hashing** (`node:crypto`)
- **Leaflet + CARTO/OpenStreetMap** — destination maps & popups
- **Unsplash photography** — all URLs verified working

### Pages

| Route | What it does |
|---|---|
| `/` | Hero search, features, popular destinations, ecosystem |
| `/explore` | Search + category chips + state filter + map view |
| `/destinations/[slug]` | Detail, experiences, guides, homestays, reviews, map, save ♥ |
| `/plan` | 3-step wizard → editable day-by-day itinerary → saved trip |
| `/trips` & `/trips/[id]` | Trip list, itinerary check-off, delete |
| `/dashboard` | Stats, upcoming trips, bookings, activity, saved places |
| `/login` | Login/Sign-up tabs, role picker, one-click demo accounts |
| `/host` | Host value proposition |
| `/host/dashboard` | Earnings, accept/decline requests, create listings |
| `/about` | Problem, solution, key features, USP |

### API (all real, all used by the UI)

```
POST /api/auth/signup|login|logout   GET /api/auth/me
GET  /api/destinations?q&category&state    GET /api/destinations/[slug]
GET/POST /api/trips    GET/PATCH/DELETE /api/trips/[id]
POST /api/trips/[id]/items    PATCH/DELETE /api/trip-items/[id]
GET/POST /api/bookings    PATCH/DELETE /api/bookings/[id]
GET/POST /api/saved    GET/POST /api/reviews
GET/POST /api/host/listings    DELETE /api/host/listings/[id]
GET /api/host/earnings    GET /api/dashboard/activity
```

### Notes for judges

- Booking = **request → host confirms** flow (no payment gateway in prototype, by design).
- Host-created listings go live instantly on the destination page (prototype behaviour).
- Data persists across restarts in `.data/`; the DB file is gitignored.
- Internet is needed for photos/map tiles/fonts; all app logic runs locally.
