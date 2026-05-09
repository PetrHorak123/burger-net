"use client";

import { useLocale } from "@/contexts/LocaleContext";
import { LOCALES } from "@/lib/i18n";

export default function Footer() {
  const { locale, setLocale } = useLocale();

  return (
    <footer className="print:hidden fixed bottom-0 w-full z-50 py-4 px-4 bg-amber-100 border-t border-amber-200">
      <div className="max-w-2xl mx-auto flex items-center justify-center gap-2 flex-wrap">
        {LOCALES.map((l) => (
          <button
            key={l.code}
            onClick={() => setLocale(l.code)}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              locale === l.code
                ? "bg-amber-500 text-white"
                : "text-amber-700 hover:bg-amber-200"
            }`}
          >
            <span>{l.flag}</span>
            <span>{l.label}</span>
          </button>
        ))}
      </div>
    </footer>
  );
}
