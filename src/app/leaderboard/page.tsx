"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import BottomTabBar from "@/components/BottomTabBar";

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
  const [error, setError] = useState(false);

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
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || !session) return null;

  const renderTop3 = (slicePrefix: string, gender: "MALE" | "FEMALE", title: string) => {
    const list = entries
      .filter(e => e.slice.startsWith(slicePrefix) && e.gender === gender)
      .sort((a, b) => a.rank - b.rank);
      
    if (list.length === 0) return null;

    return (
      <div className="bg-brand-charcoal rounded-[28px] p-7 border border-brand-burgundy/40 shadow-xl mb-6">
        <h3 className="font-playfair text-xl font-bold text-brand-blush mb-6 pb-3 border-b border-brand-burgundy/30">
          {title}
        </h3>
        <div className="flex flex-col gap-4">
          {list.map(e => (
            <div key={e.id} className="flex items-center gap-4 p-3 rounded-2xl bg-brand-wine/40 border border-brand-burgundy/20">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-playfair font-bold text-base shadow-sm ${
                e.rank === 1 ? "bg-brand-blush text-brand-charcoal" :
                e.rank === 2 ? "bg-brand-rose/30 text-brand-rose border border-brand-rose/40" :
                               "bg-brand-wine text-brand-taupe border border-brand-burgundy/50"
              }`}>
                #{e.rank}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-playfair text-base font-semibold text-brand-blush truncate">
                  {e.user.profile.firstName} {e.user.profile.lastName}
                </p>
                <p className="text-xs text-brand-taupe font-light mt-0.5">
                  {e.college} • {e.batch}
                </p>
              </div>
              <div className="text-xs text-brand-rose/80 font-mono">
                @{e.user.profile.instagramHandle}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-brand-wine text-brand-blush font-inter pb-36 selection:bg-brand-burgundy selection:text-brand-blush">
      
      {/* Top Bar */}
      <div className="flex items-center justify-between px-8 pt-16 pb-2 max-w-lg mx-auto">
        <h1 className="font-playfair text-3xl font-bold italic tracking-tight">Perhaps</h1>
        <Link 
          href="/dashboard"
          className="text-xs font-semibold text-brand-taupe uppercase tracking-widest hover:text-brand-blush transition-colors"
        >
          Dashboard
        </Link>
      </div>

      <div className="px-8 mt-8 max-w-lg mx-auto">
        <div className="mb-10">
          <p className="text-[11px] font-bold text-brand-taupe uppercase tracking-widest mb-1">Campus Insights</p>
          <h2 className="font-playfair text-4xl font-bold text-brand-blush">Leaderboard</h2>
          <p className="text-sm text-brand-taupe mt-2 font-light">Most picked students from your college and batch.</p>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-2 border-brand-rose border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-brand-taupe font-light">Loading rankings...</p>
          </div>
        ) : error || entries.length === 0 ? (
          <div className="bg-brand-charcoal rounded-[28px] p-8 text-center border border-brand-burgundy/30">
            <p className="font-playfair text-2xl text-brand-blush mb-2">No Rankings Yet</p>
            <p className="text-sm text-brand-taupe font-light leading-relaxed">
              Leaderboard rankings will be visible after the reveal phase is unlocked.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {renderTop3("overall", "FEMALE", "Top Women — Campus Wide")}
            {renderTop3("overall", "MALE", "Top Men — Campus Wide")}
            {renderTop3("college:", "FEMALE", "Top Women — Your College")}
            {renderTop3("college:", "MALE", "Top Men — Your College")}
          </div>
        )}
      </div>

      <BottomTabBar />
    </div>
  );
}
