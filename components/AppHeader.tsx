"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale } from "@/contexts/LocaleContext";

export default function AppHeader() {
  const { t } = useLocale();
  const [hasUser, setHasUser] = useState(false);

  useEffect(() => {
    setHasUser(!!localStorage.getItem("userId"));
  }, []);

  return (
    <div className="bg-amber-500 py-6 px-4 text-center shadow-md relative">
      <h1 className="text-3xl font-extrabold text-white tracking-tight">{t.lbTitle}</h1>
      <p className="text-amber-100 text-sm mt-1">{t.lbSubtitle}</p>
      {hasUser && (
        <Link
          href="/profile"
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white transition-colors p-1"
          aria-label="Profile"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
            <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
          </svg>
        </Link>
      )}
    </div>
  );
}
