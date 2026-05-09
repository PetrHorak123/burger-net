"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import { useLocale } from "@/contexts/LocaleContext";

interface UserProfile {
  id: string;
  alias: string;
  email: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const { t } = useLocale();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) { router.replace("/leaderboard"); return; }

    fetch(`/api/user/${userId}`)
      .then((r) => r.json())
      .then((data: UserProfile) => { setProfile(data); setLoading(false); })
      .catch(() => { router.replace("/leaderboard"); });
  }, [router]);

  async function handleSaveEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || !email.trim()) return;
    setSaving(true);
    setError("");

    const res = await fetch(`/api/user/${profile.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    });

    setSaving(false);
    if (res.ok) {
      setProfile({ ...profile, email: email.trim() });
      setSaved(true);
    } else {
      const json = await res.json().catch(() => ({}));
      setError(json.error === "Email already set" ? t.profileEmailAlreadySet : t.somethingWentWrong);
    }
  }

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col pb-16">
      <AppHeader />
      <div className="flex-1 flex items-start justify-center p-4 pt-10">
        {loading ? (
          <div className="text-5xl animate-bounce">🍔</div>
        ) : profile ? (
          <div className="w-full max-w-sm space-y-6">
            {/* Name */}
            <div className="bg-white rounded-2xl shadow-sm px-6 py-5">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{t.profileAlias}</p>
              <p className="text-2xl font-bold text-amber-700">{profile.alias}</p>
              <p className="text-xs text-gray-300 font-mono mt-3 break-all">{profile.id}</p>
            </div>

            {/* Email */}
            <div className="bg-white rounded-2xl shadow-sm px-6 py-5">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">{t.profileEmail}</p>
              {profile.email ? (
                <p className="text-gray-700 break-all">{profile.email}</p>
              ) : saved ? (
                <p className="text-green-600 font-medium">{t.profileEmailSaved}</p>
              ) : (
                <form onSubmit={handleSaveEmail} className="space-y-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.profileEmailPlaceholder}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-amber-500 focus:outline-none"
                    autoFocus
                  />
                  {error && <p className="text-xs text-red-500">{error}</p>}
                  <button
                    type="submit"
                    disabled={saving || !email.trim()}
                    className="w-full rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-white hover:bg-amber-600 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {saving ? t.profileSaving : t.profileSaveEmail}
                  </button>
                </form>
              )}
            </div>

            <button
              onClick={() => router.push("/leaderboard")}
              className="w-full text-sm text-amber-500 hover:text-amber-700 underline cursor-pointer text-center block"
            >
              {t.profileBack}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
