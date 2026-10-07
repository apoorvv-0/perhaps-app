"use client";

import { useEffect, useState } from "react";
import LoadingScreen from "@/components/LoadingScreen";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const PHASE_LABELS: Record<string, { title: string; sub: string; color: string; label: string }> = {
  DRAFT:               { title: "Planning Phase", sub: "The event is currently being set up by organizers.", color: "#6B5A57", label: "Hidden" },
  REGISTRATION_OPEN:   { title: "Registrations Live", sub: "Join the event and complete your profile before it closes.", color: "#E8B4A5", label: "Open Now" },
  CHOOSING_OPEN:       { title: "Lock Your Choices", sub: "Browse the directory and pick the people you'd want to date.", color: "#F6D7CF", label: "Active" },
  MATCHING:            { title: "Matching...", sub: "Our algorithm is calculating the mutuals. Please hold on.", color: "#6B5A57", label: "Processing" },
  RESULTS_OPEN:        { title: "Results Are Out", sub: "The wait is over. Find out who matched with you.", color: "#E8B4A5", label: "Live" },
  CLOSED:              { title: "Event Closed", sub: "This event has officially ended.", color: "#6B5A57", label: "Ended" },
  ARCHIVED:            { title: "Archived", sub: "This event is archived.", color: "#6B5A57", label: "Past" },
  UNKNOWN:             { title: "Loading...", sub: "", color: "#6B5A57", label: "" },
};

function WaveUnderline({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 12" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M2 8 C40 2, 80 12, 120 6 C150 2, 175 10, 198 5" stroke="url(#wave-grad)" strokeWidth="1.5" strokeLinecap="round" />
      <defs>
        <linearGradient id="wave-grad" x1="0" y1="0" x2="200" y2="0">
          <stop offset="0%" stopColor="#E8B4A5" stopOpacity="0.3" />
          <stop offset="50%" stopColor="#F6D7CF" />
          <stop offset="100%" stopColor="#E8B4A5" stopOpacity="0.3" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function CountdownTimer({ endTime }: { endTime: number }) {
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    const update = () => {
      const diff = endTime - Date.now();
      if (diff <= 0) return setTimeLeft("00:00:00");
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);
      setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    };
    update();
    const int = setInterval(update, 1000);
    return () => clearInterval(int);
  }, [endTime]);
  return <>{timeLeft}</>;
}

export default function DashboardPage() {
  const { session, isLoading, logout } = useAuth();
  const router = useRouter();
  const [phase, setPhase] = useState("LOADING");
  const [firstName, setFirstName] = useState("");
  const [endTime, setEndTime] = useState<number | null>(null);

  useEffect(() => {
    if (!isLoading) {
      if (!session) router.push("/");
      else fetchData();
    }
  }, [session, isLoading, router]);

  const fetchData = async () => {
    try {
      const [profRes, adminRes] = await Promise.all([
        fetch("/api/profile"),
        fetch("/api/admin/event"),
      ]);
      if (profRes.ok) {
        const p = await profRes.json();
        setFirstName(p.profile?.firstName || "");
      }
      if (adminRes.ok) {
        const a = await adminRes.json();
        const status = a.event?.status || "UNKNOWN";
        setPhase(status);
        if (a.event?.registrationEndAt && status === "REGISTRATION_OPEN") {
          setEndTime(new Date(a.event.registrationEndAt).getTime());
        }
      } else {
        const dirRes = await fetch("/api/directory");
        const d = await dirRes.json();
        setPhase(d.eventPhase || "UNKNOWN");
      }
    } catch {
      setPhase("UNKNOWN");
    }
  };

  if (isLoading || !session || phase === "LOADING") {
    return <LoadingScreen />;
  }

  const isSuperAdmin = session.globalRole === "SUPER_ADMIN";
  const isEventAdmin = session.eventRoles?.includes("ADMIN");
  const isCashier = session.eventRoles?.includes("CASHIER");

  const meta = PHASE_LABELS[phase] || PHASE_LABELS.UNKNOWN;
  const greeting = (() => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; })();

  const isResultsOpen = phase === "RESULTS_OPEN";
  const isChoosingOpen = phase === "CHOOSING_OPEN";

  return (
    <div className="min-h-screen bg-brand-wine text-brand-blush font-inter pb-32 overflow-x-hidden relative selection:bg-brand-burgundy selection:text-brand-blush">
      
      {/* Background glow effects mimicking Roviara's perhaps-hero */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-burgundy/40 rounded-full blur-[140px] mix-blend-screen" />
        <div className="absolute bottom-[20%] right-[-10%] w-[400px] h-[400px] bg-brand-rose/5 rounded-full blur-[120px] mix-blend-screen" />
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-6 pt-16">
        
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-start mb-10">
          <div>
            <p className="text-[11px] font-bold text-brand-taupe tracking-widest uppercase mb-1">{greeting}</p>
            <h1 className="font-playfair text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-blush to-brand-rose tracking-tight leading-tight">
              {firstName ? `${firstName}.` : "Welcome."}
            </h1>
            <WaveUnderline className="w-24 mt-2" />
          </div>
          <button
            onClick={logout}
            className="w-10 h-10 rounded-full bg-brand-charcoal/60 backdrop-blur-md border border-brand-rose/10 flex items-center justify-center text-brand-taupe hover:text-brand-rose hover:border-brand-rose/30 transition-all shadow-sm"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          </button>
        </motion.div>

        {/* Phase Status Glass Card */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-brand-charcoal/40 backdrop-blur-xl border border-brand-rose/15 rounded-[32px] p-8 mb-8 shadow-[0_16px_40px_rgba(0,0,0,0.3)] relative overflow-hidden group hover:border-brand-rose/30 transition-all duration-500">
          <div className="absolute top-0 right-0 w-48 h-48 bg-brand-rose/10 rounded-full blur-[60px] pointer-events-none group-hover:bg-brand-rose/15 transition-all duration-700" />
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-wine/50 border border-brand-burgundy/50 text-[10px] font-bold uppercase tracking-widest mb-6">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: meta.color }} />
              <span style={{ color: meta.color }}>{meta.label}</span>
            </div>
            
            <h2 className="font-playfair text-3xl md:text-4xl font-bold mb-3 italic" style={{ color: meta.color }}>{meta.title}</h2>
            <p className="text-sm text-brand-taupe leading-relaxed max-w-sm">{meta.sub}</p>
            
            {endTime && phase === "REGISTRATION_OPEN" && (
              <div className="mt-8 inline-flex flex-col">
                <span className="text-[10px] text-brand-taupe uppercase tracking-widest font-bold mb-2">Time Remaining</span>
                <div className="inline-flex items-center gap-3 bg-brand-wine/80 border border-brand-rose/20 px-6 py-3 rounded-2xl shadow-inner">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E8B4A5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  <span className="text-lg text-brand-rose font-mono tracking-wider"><CountdownTimer endTime={endTime} /></span>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Primary CTA */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Link
            href="/directory"
            className="flex items-center justify-between bg-gradient-to-r from-brand-blush to-brand-rose text-brand-wine w-full px-8 py-5 rounded-[24px] mb-6 active:scale-[0.98] transition-all shadow-[0_8px_32px_rgba(232,180,165,0.25)] hover:shadow-[0_8px_40px_rgba(232,180,165,0.4)] group"
          >
            <span className="font-bold text-lg">
              {isResultsOpen ? "View Your Match" : isChoosingOpen ? "Choose Your Mutuals" : "Enter Directory"}
            </span>
            <div className="w-10 h-10 rounded-full bg-brand-wine/10 flex items-center justify-center group-hover:bg-brand-wine/20 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
            </div>
          </Link>
        </motion.div>

        {/* Secondary Grid */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="grid grid-cols-2 gap-4 mb-10">
          <Link
            href="/profile"
            className="bg-brand-charcoal/40 backdrop-blur-md border border-brand-rose/10 rounded-[24px] p-6 flex flex-col gap-4 active:scale-[0.98] transition-all hover:border-brand-rose/30 shadow-sm"
          >
            <div className="w-12 h-12 rounded-full bg-brand-wine flex items-center justify-center border border-brand-rose/10 shadow-inner">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F6D7CF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            </div>
            <div>
              <p className="font-playfair text-xl font-bold text-brand-blush mb-1">Profile</p>
              <p className="text-xs text-brand-taupe font-light">Your settings</p>
            </div>
          </Link>

          {isResultsOpen ? (
            <Link
              href="/leaderboard"
              className="bg-brand-charcoal/40 backdrop-blur-md border border-brand-rose/10 rounded-[24px] p-6 flex flex-col gap-4 active:scale-[0.98] transition-all hover:border-brand-rose/30 shadow-sm"
            >
              <div className="w-12 h-12 rounded-full bg-brand-wine flex items-center justify-center border border-brand-rose/10 shadow-inner">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F6D7CF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg>
              </div>
              <div>
                <p className="font-playfair text-xl font-bold text-brand-blush mb-1">Top Picks</p>
                <p className="text-xs text-brand-taupe font-light">Leaderboard</p>
              </div>
            </Link>
          ) : (
            <div className="bg-brand-charcoal/20 backdrop-blur-md border border-brand-burgundy/10 rounded-[24px] p-6 flex flex-col gap-4 opacity-50 grayscale-[50%]">
              <div className="w-12 h-12 rounded-full bg-brand-wine/50 flex items-center justify-center border border-brand-burgundy/20">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B5A57" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              </div>
              <div>
                <p className="font-playfair text-xl font-bold text-brand-taupe mb-1">Top Picks</p>
                <p className="text-xs text-brand-taupe/60 font-light">Locked</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Staff Tools */}
        {(isSuperAdmin || isEventAdmin || isCashier) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="pt-8 border-t border-brand-burgundy/30">
            <p className="text-[10px] text-brand-taupe font-bold uppercase tracking-widest mb-4">Operations Center</p>
            <div className="flex flex-col gap-3">
              {(isSuperAdmin || isEventAdmin) && (
                <Link href="/admin" className="flex items-center justify-between bg-brand-charcoal/40 backdrop-blur-md border border-brand-rose/10 rounded-2xl px-6 py-4 hover:border-brand-rose/30 transition-all shadow-sm group">
                  <span className="text-sm font-semibold text-brand-blush">Event Admin</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B5A57" strokeWidth="2" className="group-hover:text-brand-rose group-hover:translate-x-1 transition-all"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                </Link>
              )}
              {(isSuperAdmin || isCashier) && (
                <Link href="/cashier" className="flex items-center justify-between bg-brand-charcoal/40 backdrop-blur-md border border-brand-rose/10 rounded-2xl px-6 py-4 hover:border-brand-rose/30 transition-all shadow-sm group">
                  <span className="text-sm font-semibold text-brand-blush">Cashier Desk</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B5A57" strokeWidth="2" className="group-hover:text-brand-rose group-hover:translate-x-1 transition-all"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                </Link>
              )}
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
