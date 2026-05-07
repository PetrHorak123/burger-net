"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import Modal from "@/components/Modal";

type ScanState =
  | "loading"
  | "admin_pin"
  | "admin_price"
  | "admin_success"
  | "register"
  | "claiming"
  | "already_yours"
  | "already_claimed"
  | "invalid"
  | "error";

interface BurgerInfo {
  price: number;
  claimed: boolean;
  userId: string | null;
}

const SESSION_ADMIN_KEY = "adminAuthed";
const SESSION_PIN_KEY = "adminPin";
const LOCAL_USER_KEY = "userId";

function ScanContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const burgerId = searchParams.get("id");

  const [state, setState] = useState<ScanState>("loading");
  const [burgerInfo, setBurgerInfo] = useState<BurgerInfo | null>(null);
  const [pin, setPin] = useState("");
  const [price, setPrice] = useState("");
  const [alias, setAlias] = useState("");
  const [email, setEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [settledPrice, setSettledPrice] = useState<number | null>(null);

  useEffect(() => {
    if (!burgerId) {
      setState("invalid");
      return;
    }

    fetch(`/api/burger/${burgerId}`)
      .then((res) => {
        if (res.status === 404) return null;
        if (!res.ok) throw new Error("Unexpected error");
        return res.json() as Promise<BurgerInfo>;
      })
      .then((data) => {
        if (!data) {
          const authed = sessionStorage.getItem(SESSION_ADMIN_KEY) === "1";
          setState(authed ? "admin_price" : "admin_pin");
        } else {
          setBurgerInfo(data);
          if (data.claimed) {
            const myId = localStorage.getItem(LOCAL_USER_KEY);
            setState(myId && myId === data.userId ? "already_yours" : "already_claimed");
          } else {
            const existingId = localStorage.getItem(LOCAL_USER_KEY);
            if (existingId) {
              doClaimBurger(existingId);
            } else {
              setState("register");
            }
          }
        }
      })
      .catch(() => setState("error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [burgerId]);

  async function doClaimBurger(userId: string) {
    setState("claiming");
    const res = await fetch(`/api/burger/${burgerId}/claim`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    if (res.status === 409) { setState("already_claimed"); return; }
    if (!res.ok) { setState("error"); return; }

    router.push(`/leaderboard?highlight=${userId}`);
  }

  async function handlePinSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    const res = await fetch("/api/admin/verify-pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });

    setIsSubmitting(false);

    if (res.status === 401) { setErrorMsg("Wrong PIN, try again."); return; }
    if (!res.ok) { setErrorMsg("Something went wrong."); return; }

    sessionStorage.setItem(SESSION_ADMIN_KEY, "1");
    sessionStorage.setItem(SESSION_PIN_KEY, pin);
    setState("admin_price");
  }

  async function handlePriceSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) {
      setErrorMsg("Enter a valid price.");
      setIsSubmitting(false);
      return;
    }

    const cachedPin = sessionStorage.getItem(SESSION_PIN_KEY) ?? pin;

    const res = await fetch("/api/admin/burger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: burgerId, price: numPrice, pin: cachedPin }),
    });

    setIsSubmitting(false);

    if (res.status === 401) { setErrorMsg("PIN rejected. Re-enter on next scan."); sessionStorage.removeItem(SESSION_ADMIN_KEY); return; }
    if (res.status === 409) { setErrorMsg("Burger already registered."); return; }
    if (!res.ok) { setErrorMsg("Something went wrong."); return; }

    setSettledPrice(numPrice);
    setState("admin_success");
  }

  async function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!alias.trim()) return;
    setIsSubmitting(true);
    setErrorMsg("");

    const userId = crypto.randomUUID();

    const res = await fetch("/api/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: userId, alias: alias.trim(), email: email.trim() || undefined }),
    });

    if (!res.ok) {
      setErrorMsg("Registration failed. Please try again.");
      setIsSubmitting(false);
      return;
    }

    localStorage.setItem(LOCAL_USER_KEY, userId);
    await doClaimBurger(userId);
  }

  if (!burgerId) return <ErrorScreen title="Invalid QR Code" body="This link is missing a burger ID." />;

  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
      {state === "loading" && <Spinner />}

      {state === "admin_pin" && (
        <Modal title="🔐 Admin Access">
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <p className="text-sm text-gray-600">
              New burger — enter your admin PIN to register it.
            </p>
            <input
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="PIN"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-center text-2xl tracking-widest focus:border-amber-500 focus:outline-none"
              autoFocus
            />
            {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
            <button type="submit" disabled={isSubmitting || !pin} className={btnClass}>
              {isSubmitting ? "Checking..." : "Enter"}
            </button>
          </form>
        </Modal>
      )}

      {state === "admin_price" && (
        <Modal title="💰 Set Burger Price">
          <form onSubmit={handlePriceSubmit} className="space-y-4">
            <p className="text-sm text-gray-600">
              ID: <span className="font-mono text-xs text-gray-400">{burgerId?.slice(0, 8)}…</span>
            </p>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">€</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border border-gray-300 pl-8 pr-4 py-3 text-xl focus:border-amber-500 focus:outline-none"
                autoFocus
              />
            </div>
            {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
            <button type="submit" disabled={isSubmitting || !price} className={btnClass}>
              {isSubmitting ? "Saving..." : "Confirm Price"}
            </button>
          </form>
        </Modal>
      )}

      {state === "admin_success" && (
        <div className="text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-amber-800">Price Set!</h2>
          <p className="mt-2 text-amber-600">
            Registered at <strong>€{settledPrice?.toFixed(2)}</strong>. Hand it over! 🍔
          </p>
          <button onClick={() => router.push("/leaderboard")} className={`mt-6 ${btnClass}`}>
            View Leaderboard
          </button>
        </div>
      )}

      {state === "register" && (
        <Modal title="🍔 Claim Your Burger!">
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <p className="text-sm text-gray-600">You&apos;re on the wheel — set your alias for the leaderboard.</p>
            <input
              type="text"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder="Your alias *"
              maxLength={32}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-amber-500 focus:outline-none"
              autoFocus
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email (optional)"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-amber-500 focus:outline-none"
            />
            {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
            <button type="submit" disabled={isSubmitting || !alias.trim()} className={btnClass}>
              {isSubmitting ? "Claiming..." : "Claim Burger 🍔"}
            </button>
            <p className="text-xs text-center text-gray-400">Your device is remembered — no account needed.</p>
          </form>
        </Modal>
      )}

      {state === "claiming" && <Spinner text="Claiming your burger..." />}

      {state === "already_yours" && (
        <div className="text-center">
          <div className="text-6xl mb-4">😎</div>
          <h2 className="text-2xl font-bold text-amber-800">Already yours!</h2>
          <p className="mt-2 text-amber-600">This burger is already on your tab. €{burgerInfo?.price.toFixed(2)}</p>
          <button
            onClick={() => { const id = localStorage.getItem(LOCAL_USER_KEY); router.push(`/leaderboard${id ? `?highlight=${id}` : ""}`); }}
            className={`mt-6 ${btnClass}`}
          >
            View Leaderboard
          </button>
        </div>
      )}

      {state === "already_claimed" && (
        <div className="text-center">
          <div className="text-6xl mb-4">😅</div>
          <h2 className="text-2xl font-bold text-amber-800">Already claimed</h2>
          <p className="mt-2 text-amber-600">Someone else got this one. Enjoy your burger anyway!</p>
          <button onClick={() => router.push("/leaderboard")} className={`mt-6 ${btnClass}`}>View Leaderboard</button>
        </div>
      )}

      {(state === "invalid" || state === "error") && (
        <ErrorScreen
          title={state === "invalid" ? "Invalid QR Code" : "Something went wrong"}
          body={state === "invalid" ? "This QR code is missing a burger ID." : "Please try scanning again."}
        />
      )}
    </div>
  );
}

const btnClass =
  "w-full rounded-lg bg-amber-500 px-6 py-3 font-bold text-white hover:bg-amber-600 disabled:opacity-50 transition-colors cursor-pointer";

function Spinner({ text = "Loading your burger..." }: { text?: string }) {
  return (
    <div className="text-center">
      <div className="text-5xl animate-bounce mb-4">🍔</div>
      <p className="text-amber-700 font-medium">{text}</p>
    </div>
  );
}

function ErrorScreen({ title, body }: { title: string; body: string }) {
  return (
    <div className="text-center">
      <div className="text-6xl mb-4">❌</div>
      <h2 className="text-2xl font-bold text-amber-800">{title}</h2>
      <p className="mt-2 text-amber-600">{body}</p>
    </div>
  );
}

export default function ScanPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-amber-50"><div className="text-5xl animate-bounce">🍔</div></div>}>
      <ScanContent />
    </Suspense>
  );
}
