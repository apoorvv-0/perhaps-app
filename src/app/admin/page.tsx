"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import BottomTabBar from "@/components/BottomTabBar";

type EventPhase =
  | "DRAFT" | "REGISTRATION_OPEN" | "REGISTRATION_CLOSED"
  | "CHOOSING_OPEN" | "CHOOSING_CLOSED" | "MATCHING"
  | "RESULTS_OPEN" | "CLOSED" | "ARCHIVED";

const TRANSITION_META: Record<string, { label: string; bg: string; color: string; isRollback?: boolean }> = {
  REGISTRATION_OPEN:   { label: "Open Registration",             bg: "#1a3a6e", color: "#60a5fa" },
  REGISTRATION_CLOSED: { label: "Close Registration",            bg: "#3a2a0a", color: "#fbbf24" },
  CHOOSING_OPEN:       { label: "Open Choosing Phase",           bg: "#3a1a6e", color: "#a78bfa" },
  CHOOSING_CLOSED:     { label: "Close Choosing (Lock)",         bg: "#3a2a0a", color: "#fbbf24" },
  MATCHING:            { label: "Move to Matching Phase",        bg: "#1a3a2a", color: "#34d399" },
  RESULTS_OPEN:        { label: "Publish Results",               bg: "#1a3a1a", color: "#4ade80" },
  CLOSED:              { label: "Close Event",                   bg: "#1e1e1e", color: "#7a6b6b" },
  ARCHIVED:            { label: "Archive Event",                 bg: "#f5f0ee", color: "#7a6b6b" },
  DRAFT:               { label: "Revert to DRAFT",               bg: "#2a0a0a", color: "#dc2626", isRollback: true },
};

const VALID_NEXT: Record<EventPhase, EventPhase[]> = {
  DRAFT:               ["REGISTRATION_OPEN"],
  REGISTRATION_OPEN:   ["REGISTRATION_CLOSED"],
  REGISTRATION_CLOSED: ["CHOOSING_OPEN", "REGISTRATION_OPEN", "DRAFT"],
  CHOOSING_OPEN:       ["CHOOSING_CLOSED"],
  CHOOSING_CLOSED:     ["MATCHING", "CHOOSING_OPEN"],
  MATCHING:            ["RESULTS_OPEN", "CHOOSING_CLOSED"],
  RESULTS_OPEN:        ["CLOSED", "MATCHING"],
  CLOSED:              ["ARCHIVED", "RESULTS_OPEN"],
  ARCHIVED:            [],
};

export default function AdminDashboardPage() {
  const { session, isLoading, logout } = useAuth();
  const router = useRouter();
  
  const [eventData, setEventData] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [registrationEndAt, setRegistrationEndAt] = useState<string>("");

  useEffect(() => {
    if (!isLoading) {
      if (!session) router.push("/");
      else if (session.globalRole !== "SUPER_ADMIN" && !session.eventRoles?.includes("ADMIN")) {
        router.push("/dashboard");
      } else {
        fetchAdminData();
      }
    }
  }, [session, isLoading, router]);

  const fetchAdminData = async () => {
    try {
      const res = await fetch("/api/admin/event-status");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load event data");
      setEventData(data.event);
      if (data.event?.registrationEndAt) {
        const d = new Date(data.event.registrationEndAt);
        const localISO = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        setRegistrationEndAt(localISO);
      } else {
        setRegistrationEndAt("");
      }
      
      const statsRes = await fetch("/api/admin/stats");
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateTimer = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/event-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "UPDATE_TIMER", eventId: eventData.id, registrationEndAt: registrationEndAt ? new Date(registrationEndAt).toISOString() : null }),
      });
      if (!res.ok) throw new Error("Failed to update timer");
      await fetchAdminData();
      alert("Timer updated successfully!");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePhaseChange = async (newPhase: string) => {
    if (!confirm(`Are you sure you want to move to ${newPhase}?`)) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/event-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "UPDATE_PHASE", eventId: eventData.id, nextPhase: newPhase }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await fetchAdminData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand-rose border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!eventData) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-brand-taupe">
        <h1 className="text-2xl font-bold mb-4">No Active Event</h1>
        <p className="mb-8">There are currently no active events in the database.</p>
        <button onClick={logout} className="text-brand-rose underline">Log Out</button>
      </div>
    );
  }

  const phase: EventPhase = eventData.status;
  const nextOptions = VALID_NEXT[phase] || [];

  return (
    <div className="min-h-screen bg-[#050505] font-inter relative pb-32 text-brand-blush selection:bg-brand-rose/30">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-wine/10 via-[#050505] to-[#050505]" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-12 pb-12">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          <div>
            <h1 className="font-playfair text-4xl font-bold text-brand-blush tracking-tight mb-3">Command Center</h1>
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs font-mono text-brand-taupe">{eventData.name}</span>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full">
                 <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                 <span className="text-xs font-mono font-bold text-blue-400">{phase}</span>
              </div>
            </div>
          </div>
          
          <button onClick={() => router.push("/dashboard")} className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 flex items-center gap-2 text-sm text-brand-taupe hover:text-brand-blush hover:bg-white/10 transition-all active:scale-95">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"></path></svg>
            Exit Admin
          </button>
        </header>

        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl mb-8 font-mono text-sm">{error}</div>}

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-brand-charcoal/50 backdrop-blur-md border border-brand-burgundy/40 rounded-2xl p-5 hover:border-brand-burgundy transition-colors">
              <p className="text-brand-taupe text-xs font-bold uppercase tracking-wider mb-2">Total Users</p>
              <p className="text-3xl font-mono font-bold text-brand-blush">{stats.totalUsers}</p>
            </div>
            <div className="bg-brand-charcoal/50 backdrop-blur-md border border-brand-burgundy/40 rounded-2xl p-5 hover:border-brand-burgundy transition-colors">
              <p className="text-brand-taupe text-xs font-bold uppercase tracking-wider mb-2">Choices Made</p>
              <p className="text-3xl font-mono font-bold text-brand-blush">{stats.totalChoices}</p>
            </div>
            <div className="bg-brand-charcoal/50 backdrop-blur-md border border-brand-burgundy/40 rounded-2xl p-5 hover:border-brand-burgundy transition-colors">
              <p className="text-brand-taupe text-xs font-bold uppercase tracking-wider mb-2">Coupons</p>
              <p className="text-3xl font-mono font-bold text-brand-blush">{stats.totalCoupons}</p>
            </div>
            <div className="bg-brand-charcoal/50 backdrop-blur-md border border-brand-burgundy/40 rounded-2xl p-5 hover:border-green-500/30 transition-colors">
              <p className="text-brand-taupe text-xs font-bold uppercase tracking-wider mb-2">Revenue</p>
              <p className="text-3xl font-mono font-bold text-green-400">â‚¹{stats.totalRevenueRupees}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
           {/* Left Column: Phase Controls & Timer */}
           <div className="lg:col-span-2 space-y-6">
              {/* Phase Controls */}
              <section className="bg-brand-charcoal/40 backdrop-blur-xl border border-brand-burgundy/40 rounded-[28px] p-6 sm:p-8">
                 <h2 className="text-xl font-playfair font-bold text-brand-blush mb-2">Phase Controls</h2>
                 <p className="text-sm text-brand-taupe mb-6">Transition the event through its lifecycle.</p>
                 
                 {nextOptions.length === 0 ? (
                   <div className="px-4 py-8 rounded-2xl border border-brand-burgundy/20 bg-black/20 text-center text-brand-taupe text-sm">
                     No further transitions available.
                   </div>
                 ) : (
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {nextOptions.map((opt) => {
                        const meta = TRANSITION_META[opt] || { label: opt, bg: "#222", color: "#fff" };
                        return (
                          <button
                            key={opt}
                            onClick={() => handlePhaseChange(opt)}
                            disabled={actionLoading}
                            className="p-4 rounded-xl border flex items-center justify-between transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100"
                            style={{ backgroundColor: meta.bg, borderColor: `${meta.bg}40`, color: meta.color }}
                          >
                            <span className="font-medium text-sm">{meta.label}</span>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                          </button>
                        );
                      })}
                   </div>
                 )}
              </section>

              {/* Timer Config */}
              <section className="bg-brand-charcoal/40 backdrop-blur-xl border border-brand-burgundy/40 rounded-[28px] p-6 sm:p-8">
                 <h2 className="text-xl font-playfair font-bold text-brand-blush mb-2">Registration Soft Close</h2>
                 <p className="text-sm text-brand-taupe mb-6">Automatically block users from joining after this time, while keeping the phase Open.</p>
                 <div className="flex flex-col sm:flex-row gap-3">
                    <input 
                      type="datetime-local" 
                      value={registrationEndAt} 
                      onChange={(e) => setRegistrationEndAt(e.target.value)} 
                      className="flex-1 bg-black/40 border border-brand-burgundy/50 text-brand-blush px-4 py-3 rounded-xl outline-none focus:border-blue-500 font-mono text-sm transition-colors" 
                    />
                    <button onClick={handleUpdateTimer} disabled={actionLoading} className="px-8 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-500 transition-colors disabled:opacity-50">
                      Save
                    </button>
                 </div>
              </section>
           </div>

           {/* Right Column: Utilities */}
           <div className="space-y-6">
              <section className="bg-brand-charcoal/40 backdrop-blur-xl border border-brand-burgundy/40 rounded-[28px] p-6 sm:p-8">
                 <h2 className="text-xl font-playfair font-bold text-brand-blush mb-4">Core Utilities</h2>
                 <div className="flex flex-col gap-3">
                    <Link href="/admin/users" className="bg-black/20 border border-brand-burgundy/30 rounded-xl p-4 flex items-center gap-4 transition-all hover:bg-white/5 hover:border-brand-burgundy active:scale-[0.98]">
                      <div className="w-10 h-10 rounded-full bg-brand-wine/50 flex items-center justify-center text-brand-rose">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-brand-blush text-sm">User Management</h3>
                        <p className="text-xs text-brand-taupe">Profiles & roles</p>
                      </div>
                    </Link>

                    <Link href="/admin/matches" className="bg-black/20 border border-brand-burgundy/30 rounded-xl p-4 flex items-center gap-4 transition-all hover:bg-white/5 hover:border-brand-burgundy active:scale-[0.98]">
                      <div className="w-10 h-10 rounded-full bg-brand-wine/50 flex items-center justify-center text-brand-rose">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-brand-blush text-sm">View Matches</h3>
                        <p className="text-xs text-brand-taupe">All generated mutuals</p>
                      </div>
                    </Link>
                 </div>
              </section>

              <section className="bg-brand-charcoal/40 backdrop-blur-xl border border-brand-burgundy/40 rounded-[28px] p-6 sm:p-8">
                 <h2 className="text-xl font-playfair font-bold text-brand-blush mb-4">Algorithm</h2>
                 <div className="flex flex-col gap-3">
                    <button 
                      disabled={actionLoading}
                      onClick={async () => {
                        if (confirm("Run dry run?")) {
                          setActionLoading(true);
                          try {
                            const r = await fetch("/api/admin/matching/dry-run", { method: "POST" });
                            const d = await r.json();
                            alert(`Found ${d.stats?.mutualMatches || 0} mutual matches!`);
                          } finally { setActionLoading(false); }
                        }
                      }} 
                      className="bg-brand-rose/10 border border-brand-rose/20 rounded-xl p-4 flex items-center gap-4 transition-all hover:bg-brand-rose/20 active:scale-[0.98] text-left disabled:opacity-50"
                    >
                      <div className="w-10 h-10 rounded-full bg-brand-rose/20 flex items-center justify-center text-brand-rose">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20"></path><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-brand-rose text-sm">Matching Dry Run</h3>
                        <p className="text-xs text-brand-rose/70">Run simulation</p>
                      </div>
                    </button>

                    <button 
                      disabled={actionLoading}
                      onClick={async () => {
                        if (confirm("Commit matches permanently? This cannot be undone and will move phase to MATCHING.")) {
                          setActionLoading(true);
                          try {
                            const r = await fetch("/api/admin/matching/commit", { 
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ confirmation: "COMMIT MATCHING" })
                            });
                            const text = await r.text();
                            let d;
                            try { d = JSON.parse(text); } catch { throw new Error("Invalid response"); }
                            if (!r.ok) throw new Error(d.error || "Failed to commit");
                            alert(`Committed successfully! Found ${d.stats?.mutualMatches || 0} matches.`);
                            window.location.reload();
                          } catch (e: any) {
                            alert("Error: " + e.message);
                          } finally { setActionLoading(false); }
                        }
                      }} 
                      className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-4 transition-all hover:bg-green-500/20 active:scale-[0.98] text-left disabled:opacity-50"
                    >
                      <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-green-400 text-sm">Commit Matches</h3>
                        <p className="text-xs text-green-400/70">Finalize & Generate</p>
                      </div>
                    </button>
                 </div>
              </section>
           </div>
        </div>

        {/* Verification Queue */}
        <VerificationQueue />

      </div>
      <BottomTabBar />
    </div>
  );
}

function VerificationQueue() {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchQueue = async () => {
    try {
      const res = await fetch("/api/admin/verification-queue");
      const data = await res.json();
      if (res.ok) setQueue(data.queue || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleAction = async (userId: string, action: string) => {
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;
    try {
      const res = await fetch("/api/admin/verification-queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action })
      });
      if (res.ok) {
        setQueue(q => q.filter(u => u.id !== userId));
      } else {
        alert("Action failed");
      }
    } catch (e) {
      alert("Error occurred");
    }
  };

  if (loading) return <div className="mt-8 text-center text-brand-taupe animate-pulse">Loading queue...</div>;
  if (fetchError) return <div className="mt-8 text-center text-red-400">Error: {fetchError}</div>;

  return (
    <section className="bg-brand-charcoal/40 backdrop-blur-xl border border-brand-burgundy/40 rounded-[28px] p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-xl font-playfair font-bold text-brand-blush">Verification Queue</h2>
        <span className="px-2.5 py-0.5 rounded-full bg-brand-wine/50 border border-brand-burgundy/50 text-xs font-mono text-brand-taupe">{queue.length} Pending</span>
      </div>
      
      {queue.length === 0 ? (
        <div className="p-8 bg-black/20 rounded-2xl border border-brand-burgundy/20 text-center flex flex-col items-center">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-brand-taupe/30 mb-3"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          <p className="text-brand-taupe text-sm">No pending users to verify.</p>
          <p className="text-xs text-brand-taupe/50 mt-1">You're all caught up!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {queue.map(user => (
            <div key={user.id} className="p-4 bg-black/20 rounded-2xl flex flex-col gap-4 border border-brand-burgundy/30 hover:border-brand-burgundy/50 transition-colors">
              {user.idCardUrl ? (
                <img src={user.idCardUrl} alt="ID Card" className="w-full h-40 sm:h-48 object-cover rounded-xl bg-black border border-brand-burgundy/50" />
              ) : (
                <div className="w-full h-40 sm:h-48 bg-black/50 rounded-xl border border-brand-burgundy/50 flex flex-col items-center justify-center text-brand-taupe/50 gap-2">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                  <span className="text-xs">No Image Provided</span>
                </div>
              )}
              
              <div className="flex-1 flex flex-col justify-between">
                <div className="mb-4">
                  <h3 className="font-bold text-lg text-brand-blush leading-tight">{user.firstName} {user.lastName}</h3>
                  <p className="text-brand-taupe text-sm mt-1">{user.college} - {user.batch}</p>
                  <p className="text-brand-rose text-xs font-mono mt-2 bg-brand-wine/30 inline-block px-2 py-1 rounded">{user.phone}</p>
                </div>
                
                <div className="flex flex-wrap sm:flex-nowrap gap-2">
                  <button onClick={() => handleAction(user.id, "APPROVE")} className="flex-1 bg-green-500/10 text-green-400 border border-green-500/20 py-2 rounded-xl text-xs font-bold hover:bg-green-500/20 active:scale-95 transition-all">APPROVE</button>
                  <button onClick={() => handleAction(user.id, "REJECT")} className="flex-1 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 py-2 rounded-xl text-xs font-bold hover:bg-yellow-500/20 active:scale-95 transition-all">REJECT</button>
                  <button onClick={() => handleAction(user.id, "SUSPEND")} className="flex-1 bg-red-500/10 text-red-400 border border-red-500/20 py-2 rounded-xl text-xs font-bold hover:bg-red-500/20 active:scale-95 transition-all">SUSPEND</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
