"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { formatCZK } from "@/lib/i18n";
import AppHeader from "@/components/AppHeader";

type ScanState =
  | "loading"
  | "admin_pin"
  | "admin_price"
  | "admin_success"
  | "admin_rescan"
  | "register"
  | "claiming"
  | "rate"
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
  const { t } = useLocale();

  const [state, setState] = useState<ScanState>("loading");
  const [burgerInfo, setBurgerInfo] = useState<BurgerInfo | null>(null);
  const [pin, setPin] = useState("");
  const [price, setPrice] = useState("");
  const [alias, setAlias] = useState("");
  const [email, setEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [settledPrice, setSettledPrice] = useState<number | null>(null);
  const [claimedUserId, setClaimedUserId] = useState<string | null>(null);
  const [hoverRating, setHoverRating] = useState(0);

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
          const authed = localStorage.getItem(SESSION_ADMIN_KEY) === "1";
          setState(authed ? "admin_price" : "admin_pin");
        } else {
          setBurgerInfo(data);
          if (data.claimed) {
            const myId = localStorage.getItem(LOCAL_USER_KEY);
            if (myId && myId === data.userId) {
              setClaimedUserId(myId);
              setState("already_yours");
            } else {
              setState("already_claimed");
            }
          } else {
            const isAdmin = localStorage.getItem(SESSION_ADMIN_KEY) === "1";
            if (isAdmin) {
              setState("admin_rescan");
            } else {
              const existingId = localStorage.getItem(LOCAL_USER_KEY);
              if (existingId) {
                doClaimBurger(existingId);
              } else {
                setState("register");
              }
            }
          }
        }
      })
      .catch(() => setState("error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [burgerId]);

  function handleAdminClaim() {
    const existingId = localStorage.getItem(LOCAL_USER_KEY);
    if (existingId) {
      doClaimBurger(existingId);
    } else {
      setState("register");
    }
  }

  async function doClaimBurger(userId: string) {
    setState("claiming");
    const res = await fetch(`/api/burger/${burgerId}/claim`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    if (res.status === 409) { setState("already_claimed"); return; }
    if (!res.ok) { setState("error"); return; }

    setClaimedUserId(userId);
    setState("rate");
  }

  async function handleRating(stars: number) {
    const userId = claimedUserId ?? localStorage.getItem(LOCAL_USER_KEY);
    if (!userId) { router.push(`/leaderboard`); return; }
    setIsSubmitting(true);
    await fetch(`/api/burger/${burgerId}/rate`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, rating: stars }),
    });
    router.push(`/leaderboard?highlight=${userId}`);
  }

  function skipRating() {
    const userId = claimedUserId ?? localStorage.getItem(LOCAL_USER_KEY);
    router.push(`/leaderboard${userId ? `?highlight=${userId}` : ""}`);
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

    if (res.status === 401) { setErrorMsg(t.wrongPin); return; }
    if (!res.ok) { setErrorMsg(t.somethingWentWrong); return; }

    localStorage.setItem(SESSION_ADMIN_KEY, "1");
    localStorage.setItem(SESSION_PIN_KEY, pin);
    setState("admin_price");
  }

  async function handlePriceSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) {
      setErrorMsg(t.scanValidPrice);
      setIsSubmitting(false);
      return;
    }

    const cachedPin = localStorage.getItem(SESSION_PIN_KEY) ?? pin;

    const res = await fetch("/api/admin/burger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: burgerId, price: numPrice, pin: cachedPin }),
    });

    setIsSubmitting(false);

    if (res.status === 401) { setErrorMsg(t.scanPinRejected); localStorage.removeItem(SESSION_ADMIN_KEY); localStorage.removeItem(SESSION_PIN_KEY); return; }
    if (res.status === 409) { setErrorMsg(t.scanBurgerRegistered); return; }
    if (!res.ok) { setErrorMsg(t.somethingWentWrong); return; }

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
      setErrorMsg(t.scanRegistrationFailed);
      setIsSubmitting(false);
      return;
    }

    localStorage.setItem(LOCAL_USER_KEY, userId);
    await doClaimBurger(userId);
    setIsSubmitting(false);
  }

  if (!burgerId) return (
    <div className="min-h-screen bg-amber-50 flex flex-col pb-16">
      <AppHeader />
      <div className="flex-1 flex items-center justify-center p-4">
        <ErrorScreen title={t.scanInvalidQr} body={t.scanInvalidLink} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col pb-16">
      <AppHeader />
      <div className="flex-1 flex items-center justify-center p-4">
      {state === "loading" && <Spinner text={t.scanLoading} />}

      {state === "admin_pin" && (
        <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden">
          <div className="bg-amber-500 px-6 py-4"><h2 className="text-xl font-bold text-white">🔐 Admin Access</h2></div>
          <div className="px-6 py-5">
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <p className="text-sm text-gray-600">{t.scanAdminPinHint}</p>
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
                {isSubmitting ? t.checking : t.enter}
              </button>
            </form>
          </div>
        </div>
      )}

      {state === "admin_rescan" && (
        <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden">
          <div className="bg-amber-500 px-6 py-4"><h2 className="text-xl font-bold text-white">{t.scanAdminRescanTitle}</h2></div>
          <div className="px-6 py-5 space-y-4">
            <p className="text-sm text-gray-600">{t.scanAdminRescanBody(formatCZK(burgerInfo?.price ?? 0))}</p>
            <button onClick={handleAdminClaim} className={btnClass}>
              {t.scanAdminRescanClaim}
            </button>
            <button onClick={() => router.push("/leaderboard")} className="w-full text-sm text-amber-500 hover:text-amber-700 underline cursor-pointer block text-center">
              {t.scanAdminRescanDismiss}
            </button>
          </div>
        </div>
      )}

      {state === "admin_price" && (
        <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden">
          <div className="bg-amber-500 px-6 py-4"><h2 className="text-xl font-bold text-white">{t.scanSetPrice}</h2></div>
          <div className="px-6 py-5">
            <form onSubmit={handlePriceSubmit} className="space-y-4">
              <p className="text-sm text-gray-600">
                {t.scanIdLabel} <span className="font-mono text-xs text-gray-400">{burgerId?.slice(0, 8)}…</span>
              </p>
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-lg border border-gray-300 px-4 pr-16 py-3 text-xl focus:border-amber-500 focus:outline-none"
                  autoFocus
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">Kč</span>
              </div>
              {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
              <button type="submit" disabled={isSubmitting || !price} className={btnClass}>
                {isSubmitting ? t.scanSaving : t.scanConfirmPrice}
              </button>
            </form>
          </div>
        </div>
      )}

      {state === "admin_success" && (
        <div className="text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-amber-800">{t.scanPriceSet}</h2>
          <p className="mt-2 text-amber-600">
            {t.scanRegisteredAt(formatCZK(settledPrice ?? 0))}
          </p>
          <button onClick={() => router.push("/leaderboard")} className={`mt-6 ${btnClass}`}>
            {t.viewLeaderboard}
          </button>
        </div>
      )}

      {state === "register" && (
        <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden">
          <div className="bg-amber-500 px-6 py-4"><h2 className="text-xl font-bold text-white">{t.scanClaimTitle}</h2></div>
          <div className="px-6 py-5">
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <p className="text-sm text-gray-600">{t.scanClaimHint}</p>
              <input
                type="text"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                placeholder={t.scanAliasPlaceholder}
                maxLength={32}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-amber-500 focus:outline-none"
                autoFocus
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.scanEmailPlaceholder}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-amber-500 focus:outline-none"
              />
              {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
              <button type="submit" disabled={isSubmitting || !alias.trim()} className={btnClass}>
                {isSubmitting ? t.scanClaiming : t.scanClaimButton(formatCZK(burgerInfo?.price ?? 0), priceEmoji(burgerInfo?.price ?? 0))}
              </button>
              <p className="text-xs text-center text-gray-400">{t.scanDeviceHint}</p>
            </form>
          </div>
        </div>
      )}

      {state === "claiming" && <Spinner text={t.scanClaimingBurger} />}

      {state === "rate" && (
        <div className="text-center">
          <div className="text-5xl mb-4">🍔</div>
          <h2 className="text-2xl font-bold text-amber-800">{t.rateTitle}</h2>
          <div className="flex justify-center gap-3 mt-6">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                disabled={isSubmitting}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => handleRating(star)}
                className="text-5xl transition-transform hover:scale-125 disabled:opacity-50 cursor-pointer leading-none"
              >
                {star <= (hoverRating || 0) ? "⭐" : "☆"}
              </button>
            ))}
          </div>
          <button onClick={skipRating} disabled={isSubmitting} className="mt-6 text-sm text-amber-500 hover:text-amber-700 underline cursor-pointer">
            {isSubmitting ? t.rateSubmitting : t.rateSkip}
          </button>
        </div>
      )}

      {state === "already_yours" && (
        <div className="text-center">
          <div className="text-5xl mb-4">🍔</div>
          <h2 className="text-2xl font-bold text-amber-800">{t.scanAlreadyYours}</h2>
          <p className="mt-2 text-amber-600">{t.scanAlreadyYoursBody(formatCZK(burgerInfo?.price ?? 0))}</p>
          <p className="mt-1 text-sm text-amber-500">{t.rateTitle}</p>
          <div className="flex justify-center gap-3 mt-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                disabled={isSubmitting}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => handleRating(star)}
                className="text-5xl transition-transform hover:scale-125 disabled:opacity-50 cursor-pointer leading-none"
              >
                {star <= (hoverRating || 0) ? "⭐" : "☆"}
              </button>
            ))}
          </div>
          <button onClick={skipRating} disabled={isSubmitting} className="mt-4 text-sm text-amber-500 hover:text-amber-700 underline cursor-pointer block mx-auto">
            {isSubmitting ? t.rateSubmitting : t.rateSkip}
          </button>
        </div>
      )}

      {state === "already_claimed" && (
        <div className="text-center">
          <div className="text-6xl mb-4">😅</div>
          <h2 className="text-2xl font-bold text-amber-800">{t.scanAlreadyClaimed}</h2>
          <p className="mt-2 text-amber-600">{t.scanAlreadyClaimedBody}</p>
          <button onClick={() => router.push("/leaderboard")} className={`mt-6 ${btnClass}`}>{t.viewLeaderboard}</button>
        </div>
      )}

      {(state === "invalid" || state === "error") && (
        <ErrorScreen
          title={state === "invalid" ? t.scanInvalidQr : t.somethingWentWrong}
          body={state === "invalid" ? t.scanInvalidBody : t.scanTryAgain}
        />
      )}
      </div>
    </div>
  );
}

function priceEmoji(price: number): string {
  if (price >= 180) return "💸";
  if (price >= 130) return "🤑";
  if (price >= 80) return "😋";
  return "😊";
}

const btnClass =
  "w-full rounded-lg bg-amber-500 px-6 py-3 font-bold text-white hover:bg-amber-600 disabled:opacity-50 transition-colors cursor-pointer";

function Spinner({ text }: { text: string }) {
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
