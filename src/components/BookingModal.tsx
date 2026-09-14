"use client";

import { useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/navigation";

export interface BookableItem {
  kind: "guide" | "homestay" | "experience";
  ref_id: number;
  title: string;
  dest_slug: string;
  amount: number;
  host_user_id?: number | null;
  unit?: string;
}

export default function BookingModal({
  item,
  onClose,
  onBooked,
}: {
  item: BookableItem;
  onClose: () => void;
  onBooked?: () => void;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [date, setDate] = useState("");
  const [guests, setGuests] = useState(2);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!user) {
      router.push("/login");
      return;
    }
    setBusy(true);
    setError("");
    const r = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...item, date, guests, note }),
    });
    setBusy(false);
    if (r.ok) {
      onBooked?.();
      onClose();
    } else {
      const d = await r.json().catch(() => ({}));
      setError(d.error || "Could not create booking");
    }
  }

  const total = item.amount * (item.kind === "homestay" ? guests : 1);

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-md overflow-hidden !rounded-3xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-teal-700 to-teal-600 px-6 py-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-100">Booking request</p>
          <h3 className="mt-1 text-lg font-bold">{item.title}</h3>
        </div>
        <div className="space-y-4 p-6">
          {!user && (
            <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
              You&apos;ll be asked to log in first — then your request will be sent.
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="label">Date</span>
              <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <span className="label">Guests</span>
              <input
                type="number"
                min={1}
                max={12}
                className="input"
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
              />
            </div>
          </div>
          <div>
            <span className="label">Note to host (optional)</span>
            <textarea
              className="input h-20 resize-none"
              placeholder="Anything the local should know?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between rounded-xl bg-teal-50 px-4 py-3 text-sm">
            <span className="text-slate-600">
              {item.amount > 0 ? `₹${item.amount.toLocaleString("en-IN")} ${item.unit || ""}` : "Free experience"}
            </span>
            <span className="font-bold text-teal-800">
              Total ≈ ₹{total > 0 ? total.toLocaleString("en-IN") : "0"}
            </span>
          </div>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <div className="flex gap-3">
            <button className="btn-ghost flex-1" onClick={onClose}>Cancel</button>
            <button className="btn-primary flex-1" disabled={busy} onClick={submit}>
              {busy ? "Sending…" : user ? "Send request" : "Log in & book"}
            </button>
          </div>
          <p className="text-center text-xs text-slate-400">
            No payment now — the local host confirms directly.
          </p>
        </div>
      </div>
    </div>
  );
}
