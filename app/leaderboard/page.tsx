"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

interface LeaderboardUser {
  id: string;
  alias: string;
  total: number;
  count: number;
}

interface LeaderboardData {
  users: LeaderboardUser[];
  stats: { totalBurgers: number; totalRevenue: number };
}

const POLL_INTERVAL = 5000;

function LeaderboardContent() {
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("highlight");

  const [data, setData] = useState<LeaderboardData | null>(null);
  const [myId, setMyId] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    setMyId(localStorage.getItem("userId"));
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch("/api/leaderboard");
      if (!res.ok) return;
      const json: LeaderboardData = await res.json();
      setData(json);
      setLastUpdated(new Date());
    } catch {
      // silent — keep showing last data
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchLeaderboard]);

  const effectiveHighlight = highlightId ?? myId;

  const medal = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Header */}
      <div className="bg-amber-500 py-6 px-4 text-center shadow-md">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">🍔 Burger-Net</h1>
        <p className="text-amber-100 text-sm mt-1">Live Top Spender Leaderboard</p>
      </div>

      {/* Stats strip */}
      {data && (
        <div className="bg-amber-400 flex divide-x divide-amber-300">
          <div className="flex-1 py-3 text-center">
            <div className="text-2xl font-bold text-white">{data.stats.totalBurgers}</div>
            <div className="text-xs text-amber-100 uppercase tracking-wide">Burgers sold</div>
          </div>
          <div className="flex-1 py-3 text-center">
            <div className="text-2xl font-bold text-white">€{data.stats.totalRevenue.toFixed(2)}</div>
            <div className="text-xs text-amber-100 uppercase tracking-wide">Total spent</div>
          </div>
          <div className="flex-1 py-3 text-center">
            <div className="text-2xl font-bold text-white">{data.users.length}</div>
            <div className="text-xs text-amber-100 uppercase tracking-wide">Players</div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {!data ? (
          <div className="text-center py-16">
            <div className="text-5xl animate-bounce mb-4">🍔</div>
            <p className="text-amber-700">Loading leaderboard...</p>
          </div>
        ) : data.users.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🤷</div>
            <p className="text-amber-700 font-medium">No burgers claimed yet.</p>
            <p className="text-amber-500 text-sm mt-1">Be the first!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.users.map((user, idx) => {
              const rank = idx + 1;
              const isMe = user.id === effectiveHighlight;
              return (
                <div
                  key={user.id}
                  className={`flex items-center gap-4 rounded-xl px-4 py-3 shadow-sm transition-all ${
                    isMe
                      ? "bg-amber-500 text-white ring-2 ring-amber-300 scale-[1.02]"
                      : "bg-white text-gray-800"
                  }`}
                >
                  {/* Rank */}
                  <div className={`w-10 text-center font-bold text-lg ${isMe ? "text-white" : "text-amber-500"}`}>
                    {medal(rank)}
                  </div>

                  {/* Alias */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold truncate ${isMe ? "text-white" : "text-gray-900"}`}>
                      {user.alias}
                      {isMe && <span className="ml-2 text-xs font-normal opacity-80">← you</span>}
                    </p>
                    <p className={`text-xs ${isMe ? "text-amber-100" : "text-gray-400"}`}>
                      🍔 × {user.count}
                    </p>
                  </div>

                  {/* Total */}
                  <div className={`text-right font-bold text-lg ${isMe ? "text-white" : "text-amber-600"}`}>
                    €{user.total.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {lastUpdated && (
          <p className="text-center text-xs text-gray-400 mt-6">
            Updated {lastUpdated.toLocaleTimeString()} · refreshes every {POLL_INTERVAL / 1000}s
          </p>
        )}
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-amber-50">
        <div className="text-5xl animate-bounce">🍔</div>
      </div>
    }>
      <LeaderboardContent />
    </Suspense>
  );
}
