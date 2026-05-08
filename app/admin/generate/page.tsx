"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/Modal";
import QRCode from "qrcode";
import { useLocale } from "@/contexts/LocaleContext";

const SESSION_ADMIN_KEY = "adminAuthed";
const SESSION_PIN_KEY = "adminPin";
const BASE_URL = "https://burgerhamburgertest.pilasystem.com";

interface QREntry {
  id: string;
  dataUrl: string;
}

export default function AdminGeneratePage() {
  const { t } = useLocale();
  const [authed, setAuthed] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const [count, setCount] = useState(200);
  const [entries, setEntries] = useState<QREntry[]>([]);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_ADMIN_KEY) === "1") {
      setAuthed(true);
    }
  }, []);

  async function handlePinSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsVerifying(true);
    setPinError("");

    const res = await fetch("/api/admin/verify-pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });

    setIsVerifying(false);

    if (res.status === 401) { setPinError(t.adminWrongPin); return; }
    if (!res.ok) { setPinError(t.somethingWentWrong); return; }

    sessionStorage.setItem(SESSION_ADMIN_KEY, "1");
    sessionStorage.setItem(SESSION_PIN_KEY, pin);
    setAuthed(true);
  }

  async function handleGenerate() {
    setGenerating(true);
    setEntries([]);

    const ids = Array.from({ length: count }, () => crypto.randomUUID());
    const results: QREntry[] = [];

    for (const id of ids) {
      const url = `${BASE_URL}/scan?id=${id}`;
      const dataUrl = await QRCode.toDataURL(url, {
        width: 350,
        margin: 1,
        color: { dark: "#000000", light: "#ffffff" },
      });
      results.push({ id, dataUrl });
    }

    setEntries(results);
    setGenerating(false);
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
        <Modal title="🔐 Admin Access">
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <p className="text-sm text-gray-600">{t.adminPinHint}</p>
            <input
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="PIN"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-center text-2xl tracking-widest focus:border-amber-500 focus:outline-none"
              autoFocus
            />
            {pinError && <p className="text-sm text-red-600">{pinError}</p>}
            <button
              type="submit"
              disabled={isVerifying || !pin}
              className="w-full rounded-lg bg-amber-500 py-3 font-bold text-white hover:bg-amber-600 disabled:opacity-50 transition-colors"
            >
              {isVerifying ? t.adminChecking : t.adminEnter}
            </button>
          </form>
        </Modal>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Header */}
      <div className="print:hidden bg-amber-500 py-5 px-4 shadow-md">
        <h1 className="text-2xl font-extrabold text-white">{t.adminQrTitle}</h1>
        <p className="text-amber-100 text-sm mt-1">{t.adminQrSubtitle}</p>
      </div>

      {/* Controls */}
      <div className="print:hidden max-w-md mx-auto px-4 py-8 space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-gray-700">{t.adminQrCount}</span>
          <input
            type="number"
            min={1}
            max={500}
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value) || 1)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 text-xl focus:border-amber-500 focus:outline-none"
          />
        </label>

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full rounded-lg bg-amber-500 py-3 font-bold text-white hover:bg-amber-600 disabled:opacity-50 transition-colors"
        >
          {generating ? t.adminGenerating : t.adminGenerate(count)}
        </button>

        {entries.length > 0 && (
          <>
            <button
              onClick={() => window.print()}
              className="w-full rounded-lg bg-gray-800 py-3 font-bold text-white hover:bg-gray-900 transition-colors"
            >
              {t.adminPrint}
            </button>
            <p className="text-xs text-center text-gray-400">
              Každá vlajka: 8×3 cm · 2 vedle sebe · QR vlevo, přeložit přes tyčku, text vpravo
            </p>
          </>
        )}
      </div>

      {/* Flag grid */}
      {entries.length > 0 && (
        <div className="flags-wrapper px-4 pb-8">
          <div className="flags-grid">
            {entries.map((entry) => (
              <div key={entry.id} className="flag-strip">
                {/* QR section — 3 cm */}
                <div className="flag-qr">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={entry.dataUrl} alt="" className="flag-qr-img" />
                </div>

                {/* Text section */}
                <div className="flag-text">
                  Skenuj<br />tohle
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx global>{`
        .flags-grid {
          display: grid;
          grid-template-columns: repeat(2, 8cm);
          gap: 0.4cm;
        }

        .flag-strip {
          display: flex;
          flex-direction: row;
          width: 8cm;
          height: 3cm;
          border: 0.5px solid #aaa;
          overflow: hidden;
          break-inside: avoid;
          page-break-inside: avoid;
          background: white;
        }

        .flag-qr {
          width: 4cm;
          height: 3cm;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          border-right: 0.5px solid #aaa;
          padding-left: 2mm;
          box-sizing: border-box;
        }

        .flag-qr-img {
          width: 2.4cm;
          height: 2.4cm;
          display: block;
        }

        .flag-text {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          font-size: 13pt;
          font-weight: bold;
          font-family: Arial, sans-serif;
          color: #111;
          line-height: 1.3;
          margin-left: 5mm;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 1cm;
          }

          body {
            background: white !important;
          }

          .print\\:hidden,
          .print-hidden {
            display: none !important;
          }

          .flags-wrapper {
            padding: 0;
          }

          .flags-grid {
            grid-template-columns: repeat(2, 8cm);
            gap: 0.3cm;
          }

          .flag-strip {
            border: 0.3px solid #999;
          }
        }
      `}</style>
    </div>
  );
}
