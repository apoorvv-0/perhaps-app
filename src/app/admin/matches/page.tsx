"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import BottomTabBar from "@/components/BottomTabBar";

export default function AdminMatchesPage() {
  const { session, isLoading } = useAuth();
  const router = useRouter();
  const [matches, setMatches] = useState<any[]>([]);
  const [previewMatches, setPreviewMatches] = useState<any[] | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      if (!session || (session.globalRole !== 'SUPER_ADMIN' && !session.eventRoles?.includes('ADMIN'))) {
        router.push('/dashboard');
      } else {
        fetchMatches();
      }
    }
  }, [session, isLoading, router]);

  
  const fetchPreview = async () => {
    try {
      setLoadingPreview(true);
      const res = await fetch('/api/admin/matching/dry-run', { method: 'POST' });
      const data = await res.json();
      if (data.matches) setPreviewMatches(data.matches);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPreview(false);
    }
  };

  const fetchMatches = async () => {
    try {
      const res = await fetch('/api/admin/matches');
      const data = await res.json();
      if (data.matches) setMatches(data.matches);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || loading) return <div className="min-h-screen bg-[#050505]" />;

  return (
    <div className="min-h-screen bg-[#050505] font-inter relative pb-32 text-brand-blush">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-[#050505] to-[#050505]" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 pt-12 pb-6">
        <button onClick={() => router.push('/admin')} className="text-brand-taupe hover:text-brand-blush mb-6 transition flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"></path></svg>
          Back to Admin
        </button>
        
        <div className="flex justify-between items-end mb-8 border-b border-brand-burgundy/50 pb-6">
          <div>
            <h1 className="font-playfair text-[32px] font-bold text-brand-blush mb-1">Generated Matches</h1>
            <p className="text-brand-blush/40 text-sm font-mono">Total committed mutuals: {matches.length}</p>
          </div>
        </div>
        
        <div className="bg-brand-charcoal border border-brand-burgundy/50 rounded-3xl overflow-hidden">
          {matches.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center">
              <p className="text-brand-taupe mb-4">No committed matches found.</p>
              {previewMatches ? (
                <div className="w-full text-left">
                  <h3 className="text-brand-rose font-bold mb-4 text-center">PREVIEW (DRY RUN) MATCHES ({previewMatches.length})</h3>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-brand-burgundy/50 text-brand-blush/40 text-xs uppercase tracking-wider font-bold">
                        <th className="p-4">User 1</th>
                        <th className="p-4">User 2</th>
                        <th className="p-4">Match Strength</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {previewMatches.map((m, i) => (
                        <tr key={i} className="border-b border-brand-burgundy/20 hover:bg-white/5 transition opacity-70">
                          <td className="p-4">
                            <div className="font-medium text-brand-blush">{m.user1.firstName} {m.user1.lastName}</div>
                            <div className="text-xs text-brand-taupe mt-1">{m.user1.college}</div>
                          </td>
                          <td className="p-4">
                            <div className="font-medium text-brand-blush">{m.user2.firstName} {m.user2.lastName}</div>
                            <div className="text-xs text-brand-taupe mt-1">{m.user2.college}</div>
                          </td>
                          <td className="p-4 font-bold">{m.matchStrength}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <button onClick={fetchPreview} disabled={loadingPreview} className="px-6 py-2 rounded-full bg-brand-wine border border-brand-burgundy text-brand-rose hover:bg-white/5 transition">
                  {loadingPreview ? "Running Algorithm..." : "Preview Algorithm Results"}
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-burgundy/50 text-brand-blush/40 text-xs uppercase tracking-wider font-bold">
                  <th className="p-4">User 1</th>
                  <th className="p-4">User 2</th>
                  <th className="p-4">Match Strength</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {matches.map(m => (
                  <tr key={m.id} className="border-b border-brand-burgundy/20 hover:bg-white/5 transition">
                    <td className="p-4">
                      <div className="font-medium text-brand-blush">{m.user1.firstName} {m.user1.lastName}</div>
                      <div className="text-xs text-brand-taupe mt-1">{m.user1.college} '{m.user1.batch?.slice(-2)}</div>
                      {m.user1.instagramHandle && <div className="text-xs text-brand-rose mt-1">@{m.user1.instagramHandle}</div>}
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-brand-blush">{m.user2.firstName} {m.user2.lastName}</div>
                      <div className="text-xs text-brand-taupe mt-1">{m.user2.college} '{m.user2.batch?.slice(-2)}</div>
                      {m.user2.instagramHandle && <div className="text-xs text-brand-rose mt-1">@{m.user2.instagramHandle}</div>}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-brand-blush">{m.matchStrength}</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#F6D7CF" stroke="none"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <BottomTabBar />
    </div>
  );
}
