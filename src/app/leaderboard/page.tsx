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

  const renderTop3 = (slice: string, gender: "MALE" | "FEMALE", title: string) => {
    const list = entries.filter(e => e.slice === slice && e.gender === gender).sort((a, b) => a.rank - b.rank);
    if (list.length === 0) return null;

    return (
      <div style={{ background: '#151515', border: '1px solid #2a2a2a', borderRadius: 12, padding: 24 }}>
        <h3 style={{ fontSize: 20, fontWeight: 'bold', color: '#f5f0ee', marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid #2a2a2a' }}>{title}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {list.map(e => (
            <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 12, borderRadius: 8 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 18,
                ...(e.rank === 1 ? { background: '#8b1a1a', color: '#f5f0ee' } : 
                    e.rank === 2 ? { background: '#3d1515', color: '#c9a0a0' } : 
                                   { background: '#1e1010', color: '#7a6b6b' })
              }}>
                #{e.rank}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, color: '#f5f0ee' }}>{e.user.profile.firstName} {e.user.profile.lastName}</p>
                <p style={{ fontSize: 12, color: '#7a6b6b' }}>{e.college} • {e.batch}</p>
              </div>
              <div style={{ color: '#7a6b6b', fontSize: 14, fontWeight: 500 }}>
                @{e.user.profile.instagramHandle}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d0d', color: '#f5f0ee', paddingBottom: 80 }}>
      <nav style={{ background: '#151515', borderBottom: '1px solid #2a2a2a' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', height: 64, alignItems: 'center' }}>
            <Link href="/dashboard" style={{ fontSize: 20, fontWeight: 'bold', color: '#f5f0ee' }}>Perhaps</Link>
            <Link href="/dashboard" style={{ fontSize: 14, color: '#7a6b6b' }}>Back to Dashboard</Link>
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 16px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: '#f5f0ee', letterSpacing: '-0.02em' }}>The Most Wanted</h1>
          <p style={{ marginTop: 16, fontSize: 18, color: '#7a6b6b', maxWidth: 600, margin: '16px auto 0' }}>
            These are the most highly requested participants of the season. Did you make the cut?
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <p style={{ color: '#7a6b6b' }}>Calculating hype...</p>
          </div>
        ) : error && entries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', background: '#151515', borderRadius: 12, border: '1px solid #2a2a2a' }}>
             <p style={{ color: '#dc2626' }}>Failed to load leaderboard.</p>
          </div>
        ) : entries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', background: '#151515', borderRadius: 12, border: '1px solid #2a2a2a' }}>
            <span style={{ fontSize: 36 }}>🤫</span>
            <h3 style={{ marginTop: 16, fontSize: 18, fontWeight: 500, color: '#f5f0ee' }}>Leaderboard is under wraps</h3>
            <p style={{ color: '#7a6b6b', marginTop: 8 }}>Check back after the Choosing phase is closed!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
            <section>
              <h2 style={{ fontSize: 24, fontWeight: 'bold', color: '#f5f0ee', marginBottom: 24, paddingLeft: 8, borderLeft: '4px solid #8b1a1a' }}>Overall Top 3</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32 }}>
                {renderTop3("overall", "FEMALE", "Most Wanted Girls")}
                {renderTop3("overall", "MALE", "Most Wanted Boys")}
              </div>
            </section>
          </div>
        )}
      </main>
      <BottomTabBar />
    </div>
  );
}
