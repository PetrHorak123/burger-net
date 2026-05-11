"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

function getTimeLeft(eventDate: string): TimeLeft {
  const diff = new Date(eventDate).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  return {
    total: diff,
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export default function CountdownClient({ eventDate }: { eventDate: string }) {
  const router = useRouter();
  // Start as null so the server renders nothing — avoids hydration mismatch
  // on the live-updating seconds value.
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    // Set immediately on mount, then tick every second
    const tick = () => {
      const t = getTimeLeft(eventDate);
      setTimeLeft(t);
      if (t.total <= 0) {
        clearInterval(timer);
        router.push("/leaderboard");
      }
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [eventDate, router]);

  return (
    <div className="flex-1 bg-amber-50 flex flex-col items-center justify-center p-8 text-center">
      <Image
        src="/event-banner.png"
        alt="Burger event"
        width={280}
        height={280}
        className="mb-10 drop-shadow-md"
        priority
      />

      <div className="flex items-start gap-2 sm:gap-4 min-h-[88px]">
        {timeLeft && (
          <>
            <Unit value={timeLeft.days} label="dní" />
            <Sep />
            <Unit value={timeLeft.hours} label="hodin" />
            <Sep />
            <Unit value={timeLeft.minutes} label="minut" />
            <Sep />
            <Unit value={timeLeft.seconds} label="sekund" />
          </>
        )}
      </div>

      <p className="mt-10 text-xl font-bold text-amber-700 tracking-wide">
        Koleje Harcov – Louka
      </p>
    </div>
  );
}

function Unit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-amber-500 text-white rounded-xl w-16 sm:w-20 py-3 text-3xl sm:text-4xl font-extrabold tabular-nums shadow-md">
        {String(value).padStart(2, "0")}
      </div>
      <span className="mt-2 text-xs sm:text-sm font-medium text-amber-600 uppercase tracking-widest">
        {label}
      </span>
    </div>
  );
}

function Sep() {
  return (
    <span className="text-3xl sm:text-4xl font-extrabold text-amber-300 mt-3 select-none">
      :
    </span>
  );
}
