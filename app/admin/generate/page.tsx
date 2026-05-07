"use client";

import { useState, useEffect, useRef } from "react";
import Modal from "@/components/Modal";
import QRCode from "qrcode";

const SESSION_ADMIN_KEY = "adminAuthed";
const SESSION_PIN_KEY = "adminPin";
const BASE_URL = "https://burgerhamburger.com";

interface QREntry {
  id: string;
  dataUrl: string;
}

export default function AdminGeneratePage() {
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

    if (res.status === 401) { setPinError("Wrong PIN."); return; }
    if (!res.ok) { setPinError("Something went wrong."); return; }

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
        width: 200,
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
            <p className="text-sm text-gray-600">Enter your admin PIN to access QR generation.</p>
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
              {isVerifying ? "Checking..." : "Enter"}
            </button>
          </form>
        </Modal>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Header — hidden when printing */}
      <div className="print:hidden bg-amber-500 py-5 px-4 shadow-md">
        <h1 className="text-2xl font-extrabold text-white">🍔 QR Code Generator</h1>
        <p className="text-amber-100 text-sm mt-1">Generate printable burger flags</p>
      </div>

      {/* Controls — hidden when printing */}
      <div className="print:hidden max-w-md mx-auto px-4 py-8 space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Number of QR codes</span>
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
          {generating ? "Generating..." : `Generate ${count} QR Codes`}
        </button>

        {entries.length > 0 && (
          <button
            onClick={() => window.print()}
            className="w-full rounded-lg bg-gray-800 py-3 font-bold text-white hover:bg-gray-900 transition-colors"
          >
            🖨 Print QR Codes
          </button>
        )}
      </div>

      {/* QR Grid */}
      {entries.length > 0 && (
        <div className="qr-grid max-w-5xl mx-auto px-4 pb-8">
          <div className="grid grid-cols-4 gap-4 print:grid-cols-5 print:gap-2">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex flex-col items-center bg-white rounded-xl p-3 shadow-sm print:rounded-none print:shadow-none print:border print:border-gray-200"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={entry.dataUrl} alt={`QR for ${entry.id}`} className="w-full max-w-[160px]" />
                <p className="mt-1 text-[9px] font-mono text-gray-400 break-all text-center leading-tight">
                  {entry.id}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Print-only styles */}
      <style jsx global>{`
        @media print {
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}
