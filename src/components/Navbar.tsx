"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/useAuth";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/explore", label: "Explore" },
  { href: "/plan", label: "Plan Trip" },
  { href: "/host", label: "Become a Host" },
  { href: "/about", label: "About" },
];

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-700 text-lg text-white shadow-md shadow-teal-900/30">
        🛶
      </span>
      <span className="leading-tight">
        <span className="block text-[17px] font-extrabold tracking-tight text-teal-900">Yatra Setu</span>
        <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-600">
          Local-First Travel
        </span>
      </span>
    </Link>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />

        <div className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                pathname === l.href ? "bg-teal-50 text-teal-800" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {!loading && user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1.5 pl-1.5 pr-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-teal-100 text-xs font-bold text-teal-800">
                  {user.name.slice(0, 1).toUpperCase()}
                </span>
                {user.name.split(" ")[0]}
                <span className="text-[10px] text-slate-400">▼</span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
                  <div className="border-b border-slate-100 px-4 py-2.5">
                    <p className="text-sm font-semibold text-slate-800">{user.name}</p>
                    <p className="text-xs text-slate-400">{user.email}</p>
                  </div>
                  <Link href="/dashboard" className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-teal-50 hover:text-teal-800">
                    🏠 Dashboard
                  </Link>
                  <Link href="/trips" className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-teal-50 hover:text-teal-800">
                    🧭 My Trips
                  </Link>
                  <Link href="/host/dashboard" className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-teal-50 hover:text-teal-800">
                    🤝 Host Console
                  </Link>
                  <button
                    onClick={logout}
                    className="block w-full px-4 py-2.5 text-left text-sm text-rose-600 hover:bg-rose-50"
                  >
                    ⎋ Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className="btn-outline hidden !px-5 !py-2 sm:inline-flex">
                Login
              </Link>
              <Link href="/login?tab=signup" className="btn-primary !px-5 !py-2">
                Sign Up
              </Link>
            </>
          )}
          <button
            className="grid h-9 w-9 place-items-center rounded-full text-slate-600 hover:bg-slate-100 lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-slate-100 bg-white px-4 py-3 lg:hidden">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`block rounded-lg px-3 py-2.5 text-sm font-medium ${
                pathname === l.href ? "bg-teal-50 text-teal-800" : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
