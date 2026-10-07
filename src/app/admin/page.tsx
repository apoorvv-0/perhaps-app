"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import BottomTabBar from "@/components/BottomTabBar";
import { motion } from "framer-motion";

type EventPhase =
  | "DRAFT" | "REGISTRATION_OPEN" | "REGISTRATION_CLOSED"
  | "CHOOSING_OPEN" | "CHOOSING_CLOSED" | "MATCHING"
  | "RESULTS_OPEN" | "CLOSED" | "ARCHIVED";

const TRANSITION_META: Record<string, { label: string; bg: string; color: string; isRollback?: boolean }> = {
  REGISTRATION_OPEN:   { label: "Open Registration",             bg: "#1a3a6e", color: "#60a5fa" },
  REGISTRATION_CLOSED: { label: "Close Registration",            bg: "#3a2a0a", color: "#fbbf24" },
  CHOOSING_OPEN:       { label: "Open Choosing Phase",           bg: "#3a1a6e", color: "#a78bfa" },
  CHOOSING_CLOSED:     { label: "Close Choosing (Lock Choices)", bg: "#3a2a0a", color: "#fbbf24" },
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
  const { session, isLoading } = useAuth();
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
      const res = await fetch("/api/admin/event");
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
      const res = await fetch("/api/admin/event", {
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
      const res = await fetch("/api/admin/event", {
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

  if (isLoading || !eventData) {
    return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand-rose border-t-transparent rounded-full animate-spin" /></div>;
  }

  const phase: EventPhase = eventData.status;
  const nextOptions = VALID_NEXT[phase] || [];

  return (
    <div className="min-h-screen bg-[#050505] font-inter relative pb-32 text-brand-blush selection:bg-brand-rose/30">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-[#050505] to-[#050505]" />

      <div className="relative z-10 max-w-2xl mx-auto px-6 pt-12 pb-6">
        <div className="flex justify-between items-center mb-8 border-b border-brand-burgundy/50 pb-6">
          <div>
            <h1 className="font-playfair text-[32px] font-bold text-brand-blush mb-1">Super Admin</h1>
            <p className="text-brand-blush/40 text-sm font-mono">{eventData.name}</p>
          </div>
          <button onClick={() => router.push("/dashboard")} className="w-10 h-10 rounded-full bg-brand-charcoal border border-brand-burgundy/50 flex items-center justify-center text-brand-taupe hover:text-brand-blush transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"></path></svg>
          </button>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-2xl mb-8">{error}</div>}

        {/* Global Event State */}
        <div className="bg-brand-charcoal border border-brand-burgundy/50 rounded-3xl p-6 mb-6">
          <p className="text-xs font-bold text-brand-taupe uppercase tracking-widest mb-4">Current Phase</p>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] animate-pulse" />
            <h2 className="text-3xl font-mono font-bold text-blue-400">{phase}</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {nextOptions.map((opt) => {
              const meta = TRANSITION_META[opt] || { label: opt, bg: "#222", color: "#fff" };
              return (
                <button
                  key={opt}
                  onClick={() => handlePhaseChange(opt)}
                  disabled={actionLoading}
                  className="p-4 rounded-2xl border flex items-center justify-between transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                  style={{ backgroundColor: meta.bg, borderColor: `${meta.color}40`, color: meta.color }}
                >
                  <span className="font-medium text-sm">{meta.label}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                </button>
              );
            })}
          </div>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-brand-charcoal border border-brand-burgundy/50 rounded-2xl p-5">
              <p className="text-brand-blush/40 text-xs font-bold uppercase tracking-widest mb-2">Users</p>
              <p className="text-2xl font-mono font-bold">{stats.totalUsers}</p>
            </div>
            <div className="bg-brand-charcoal border border-brand-burgundy/50 rounded-2xl p-5">
              <p className="text-brand-blush/40 text-xs font-bold uppercase tracking-widest mb-2">Choices</p>
              <p className="text-2xl font-mono font-bold">{stats.totalChoices}</p>
            </div>
            <div className="bg-brand-charcoal border border-brand-burgundy/50 rounded-2xl p-5">
              <p className="text-brand-blush/40 text-xs font-bold uppercase tracking-widest mb-2">Coupons</p>
              <p className="text-2xl font-mono font-bold">{stats.totalCoupons}</p>
            </div>
            <div className="bg-brand-charcoal border border-brand-burgundy/50 rounded-2xl p-5">
              <p className="text-brand-blush/40 text-xs font-bold uppercase tracking-widest mb-2">Revenue</p>
              <p className="text-2xl font-mono font-bold text-green-400">₹{stats.totalRevenueRupees}</p>
            </div>
          </div>
        )}

        {/* Utilities */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <Link href="/admin/matches" className="bg-brand-charcoal border border-brand-burgundy/50 rounded-2xl p-6 flex items-center justify-between transition-transform hover:scale-[1.02] active:scale-95 hover:bg-white/10">
            <div className="flex flex-col">
              <span className="font-bold text-brand-blush mb-1">View Matches</span>
              <span className="text-xs text-brand-taupe">See all generated mutuals</span>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B5A57" strokeWidth="2"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
          </Link>
          <Link href="/admin/users" className="bg-brand-charcoal border border-brand-burgundy/50 rounded-2xl p-6 flex items-center justify-between transition-transform hover:scale-[1.02] active:scale-95 hover:bg-white/10">
            <div>
              <h3 className="font-medium mb-1">User Management</h3>
              <p className="text-xs text-brand-blush/40">View profiles and roles</p>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-taupe"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          </Link>

          <button onClick={async () => {
             if (confirm("Run dry run?")) {
               setActionLoading(true);
               try {
                 const r = await fetch("/api/admin/matching/dry-run", { method: "POST" });
                 const d = await r.json();
                 alert(`Found ${d.stats?.matchedCount ?? 0} mutual matches!`);
               } finally { setActionLoading(false); }
             }
          }} className="bg-brand-charcoal border border-brand-rose/20 rounded-2xl p-6 flex items-center justify-between transition-transform hover:scale-[1.02] active:scale-95 hover:bg-brand-rose/10 text-brand-rose">
            <div>
              <h3 className="font-medium mb-1">Matching Algorithm</h3>
              <p className="text-xs opacity-70">Run simulation (Dry Run)</p>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20"></path><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
          </button>

          <button onClick={async () => {
             if (confirm("Commit matches permanently? This cannot be undone and will move phase to MATCHING.")) {
               setActionLoading(true);
               try {
                 const r = await fetch("/api/admin/matching/commit", { method: "POST" });
                 const text = await r.text();
                 let d;
                 try { d = JSON.parse(text); } catch { throw new Error("Invalid response"); }
                 if (!r.ok) throw new Error(d.error || "Failed to commit");
                 alert(`Committed successfully! Found ${d.matchedCount ?? 0} matches.`);
                 window.location.reload();
               } catch (e: any) {
                 alert("Error: " + e.message);
               } finally { setActionLoading(false); }
             }
          }} className="bg-brand-charcoal border border-green-500/20 rounded-2xl p-6 flex items-center justify-between transition-transform hover:scale-[1.02] active:scale-95 hover:bg-green-500/10 text-green-400">
            <div>
              <h3 className="font-medium mb-1">Commit Matches</h3>
              <p className="text-xs opacity-70">Finalize & Generate</p>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </button>
        </div>

        {/* Timer Config */}
        <div className="bg-brand-charcoal border border-brand-burgundy/50 rounded-3xl p-6 mb-6">
          <p className="text-xs font-bold text-brand-taupe uppercase tracking-widest mb-4">Registration Soft Close Timer</p>
          <div className="flex gap-3">
            <input 
              type="datetime-local" 
              value={registrationEndAt} 
              onChange={(e) => setRegistrationEndAt(e.target.value)} 
              className="flex-1 bg-brand-wine border border-brand-burgundy/50 text-brand-blush px-4 py-3 rounded-xl outline-none focus:border-blue-500 font-mono text-sm" 
            />
            <button onClick={handleUpdateTimer} disabled={actionLoading} className="px-6 bg-blue-600 text-brand-blush font-medium rounded-xl hover:bg-blue-500 transition-colors disabled:opacity-50">
              Save
            </button>
          </div>
          <p className="text-[11px] text-brand-taupe mt-3">If set, registrations will automatically block users from joining after this time, while the phase remains Open.</p>
        </div>
      </div>
      <BottomTabBar />
    </div>
  );
}

