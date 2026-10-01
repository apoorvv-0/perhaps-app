"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";

interface LeaderboardEntry {
  id: string;
  userId: string;
  gender: "MALE" | "FEMALE";
  college: string;
  batch: string;
  pickerCount: number;
  rank: number;
  slice: string;
  user: {
    profile: {
      firstName: string;
      lastName: string;
      instagramHandle: string;
    };
  };
}

export default function LeaderboardPage() {
  const { session, isLoading } = useAuth();
  const router = useRouter();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      if (!session) router.push("/");
      else fetchLeaderboard();
    }
  }, [session, isLoading, router]);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch("/api/leaderboard");
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  if (isLoading || !session) return null;

  const renderTop3 = (slice: string, gender: "MALE" | "FEMALE", title: string) => {
    const list = entries.filter(e => e.slice === slice && e.gender === gender).sort((a, b) => a.rank - b.rank);
    if (list.length === 0) return null;

    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-accent/20">
        <h3 className="text-xl font-sans font-bold text-brand-dark mb-4 pb-2 border-b border-brand-light">{title}</h3>
        <div className="space-y-4">
          {list.map(e => (
            <div key={e.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-brand-light/30 transition">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg
                ${e.rank === 1 ? "bg-amber-100 text-amber-600 border border-amber-200" : 
                  e.rank === 2 ? "bg-slate-100 text-slate-500 border border-slate-200" : 
                                 "bg-orange-50 text-orange-800 border border-orange-200"}`}>
                #{e.rank}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{e.user.profile.firstName} {e.user.profile.lastName}</p>
                <p className="text-xs text-gray-500">{e.college} • {e.batch}</p>
              </div>
              <div className="text-brand-primary text-sm font-medium">
                @{e.user.profile.instagramHandle}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-brand-light/20">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/dashboard" className="text-xl font-bold font-sans text-brand-dark">Perhaps</Link>
            <Link href="/dashboard" className="text-sm text-brand-accent hover:text-brand-primary">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-brand-dark font-sans tracking-tight">The Most Wanted</h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            These are the most highly requested participants of the season. Did you make the cut?
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">Calculating hype...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
            <span className="text-4xl">👑</span>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Leaderboard is under wraps</h3>
            <p className="text-gray-500 mt-2">Check back after the Choosing phase is closed!</p>
          </div>
        ) : (
          <div className="space-y-12">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 px-2 border-l-4 border-brand-primary">Overall Top 3</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {renderTop3("overall", "FEMALE", "Most Wanted Girls")}
                {renderTop3("overall", "MALE", "Most Wanted Boys")}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
