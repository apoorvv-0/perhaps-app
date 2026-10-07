"use client";

import { useEffect, useState } from "react";
import LoadingScreen from "@/components/LoadingScreen";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import BottomTabBar from "@/components/BottomTabBar";

function CountdownTimer({ endTime }: { endTime: number }) {
  const [timeLeft, setTimeLeft] = useState(endTime - Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(endTime - Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  if (timeLeft <= 0) return <span>00:00:00</span>;

  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  return (
    <span>
      {hours.toString().padStart(2, "0")}:
      {minutes.toString().padStart(2, "0")}:
      {seconds.toString().padStart(2, "0")}
    </span>
  );
}

const PHASE_LABELS: Record<string, { label: string; title: string; sub: string; color: string }> = {
  DRAFT:               { label: "Draft", title: "Setup Mode", sub: "The event is being configured.", color: "#6B5A57" },
  REGISTRATION_OPEN:   { label: "Phase 1", title: "Registration Open", sub: "Join the pool of candidates before the timer runs out.", color: "#60a5fa" },
  REGISTRATION_CLOSED: { label: "Phase 1", title: "Registration Closed", sub: "No more new entries are being accepted.", color: "#E8B4A5" },
  CHOOSING_OPEN:       { label: "Phase 2", title: "Choosing Open", sub: "It's time. Submit the names of those you desire.", color: "#a78bfa" },
  CHOOSING_CLOSED:     { label: "Phase 2", title: "Choosing Closed", sub: "The window has closed. The Oracle is preparing.", color: "#fbbf24" },
  MATCHING:            { label: "Phase 3", title: "Matching In Progress", sub: "Destinies are being aligned...", color: "#34d399" },
  RESULTS_OPEN:        { label: "Final", title: "Results Are Live", sub: "The mutuals have been found. Did the stars align?", color: "#4ade80" },
  CLOSED:              { label: "Ended", title: "Event Concluded", sub: "The season has officially ended.", color: "#6B5A57" },
  UNKNOWN:             { label: "Unknown", title: "Checking Status", sub: "Connecting to the server...", color: "#6B5A57" }
};

export default function Dashboard() {
  const { session, isLoading } = useAuth();
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [phase, setPhase] = useState("LOADING");
  const [isRegistered, setIsRegistered] = useState(false);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!session) router.push("/");
      else if (!session.phoneVerified) router.push("/verify-phone");
      else if (!session.profileComplete) router.push("/profile");
      else {
        fetchStatus();
      }
    }
  }, [session, isLoading, router]);

  const fetchStatus = async () => {
    try {
      const [statusRes, profileRes] = await Promise.all([
        fetch("/api/event/status"),
        fetch("/api/profile")
      ]);
      
      if (profileRes.ok) {
        const d = await profileRes.json();
        setFirstName(d.profile?.firstName || "");
      }
      if (statusRes.ok) {
        const s = await statusRes.json();
        setPhase(s.status || "UNKNOWN");
        setIsRegistered(!!s.isRegistered);
        if (s.registrationEndAt && s.status === "REGISTRATION_OPEN") {
          setEndTime(new Date(s.registrationEndAt).getTime());
        }
      }
    } catch {
      setPhase("UNKNOWN");
    }
  };

  const handleRegister = async () => {
    setRegistering(true);
    try {
      const res = await fetch("/api/event/register", { method: "POST" });
      if (res.ok) {
        setIsRegistered(true);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to register");
      }
    } catch {
      alert("Registration failed");
    } finally {
      setRegistering(false);
    }
  };

  if (isLoading || !session || phase === "LOADING") {
    return <LoadingScreen />;
  }

  const meta = PHASE_LABELS[phase] || PHASE_LABELS.UNKNOWN;
  const isResultsOpen = phase === "RESULTS_OPEN" || phase === "CLOSED";
  const isChoosingOpen = phase === "CHOOSING_OPEN";

  return (
    <div className="min-h-screen bg-brand-wine text-brand-blush font-inter pb-36 selection:bg-brand-burgundy selection:text-brand-blush overflow-hidden flex flex-col relative">

      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-burgundy/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[20%] left-[-20%] w-[400px] h-[400px] bg-brand-charcoal/50 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Bar */}
      <div className="relative z-10 w-full max-w-lg mx-auto px-8 pt-12 pb-8 flex items-center justify-between">
        <h1 className="font-playfair text-2xl font-bold tracking-widest uppercase text-brand-taupe/80">Perhaps</h1>
        <button className="w-12 h-12 rounded-full bg-brand-charcoal/40 backdrop-blur-sm flex items-center justify-center border border-brand-burgundy/50 text-brand-blush hover:bg-brand-charcoal/80 transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/>
          </svg>
        </button>
      </div>

      <div className="relative z-10 w-full max-w-lg mx-auto px-6 flex-1 flex flex-col gap-6">

        {/* Greeting Banner */}
        <div className="px-2">
          <p className="text-xs font-mono text-brand-taupe/70 uppercase tracking-[0.2em] mb-2">Welcome back,</p>
          <h2 className="text-5xl font-playfair italic text-brand-blush leading-tight">{firstName || "Student"}</h2>
        </div>

        {/* Phase Card (Main Call to Action) */}
        <div className="w-full bg-gradient-to-b from-brand-charcoal/80 to-brand-charcoal/40 backdrop-blur-xl border border-brand-burgundy/40 rounded-[40px] p-8 shadow-2xl mt-4 relative overflow-hidden group">
          <div className="absolute inset-0 bg-brand-rose/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

          <div className="flex justify-between items-start mb-12">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-brand-wine/50 rounded-full border border-brand-burgundy/30">
              <div className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] animate-pulse" style={{ backgroundColor: meta.color, color: meta.color }} />
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold" style={{ color: meta.color }}>{meta.label}</span>
            </div>
            
            {endTime && phase === "REGISTRATION_OPEN" && (
              <div className="text-right">
                <span className="block text-[9px] text-brand-taupe uppercase tracking-[0.2em] mb-1">Time Remaining</span>
                <span className="font-mono text-sm text-brand-rose tracking-wider bg-brand-rose/10 px-3 py-1 rounded-md border border-brand-rose/20">
                  <CountdownTimer endTime={endTime} />
                </span>
              </div>
            )}
          </div>

          <div className="mb-12">
            <h3 className="font-playfair text-3xl mb-4 text-brand-blush tracking-wide">{meta.title}</h3>
            <p className="text-sm text-brand-taupe/80 leading-relaxed font-light">{meta.sub}</p>
          </div>

          {phase === "REGISTRATION_OPEN" && !isRegistered ? (
            <button
              onClick={handleRegister}
              disabled={registering}
              className="w-full py-5 rounded-[20px] font-bold text-brand-charcoal bg-brand-blush active:scale-[0.98] transition-transform text-sm uppercase tracking-[0.1em] shadow-[0_8px_30px_-10px_rgba(232,180,165,0.4)]"
            >
              {registering ? "Registering..." : "Register Now"}
            </button>
          ) : phase === "REGISTRATION_CLOSED" && !isRegistered ? (
            <button
              disabled
              className="w-full py-5 rounded-[20px] font-bold text-brand-taupe/50 bg-brand-wine/50 border border-brand-burgundy/30 text-sm uppercase tracking-[0.1em] cursor-not-allowed"
            >
              Registrations Closed
            </button>
          ) : (
            <Link
              href={isResultsOpen ? "/results" : "/directory"}
              className="w-full py-5 rounded-[20px] font-bold text-brand-charcoal bg-brand-rose active:scale-[0.98] transition-transform text-sm uppercase tracking-[0.1em] shadow-[0_8px_30px_-10px_rgba(232,180,165,0.4)] flex items-center justify-center gap-3"
            >
              {isResultsOpen ? "View Your Match" : isChoosingOpen ? "Choose Mutuals" : "Choose Your Partner"}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
            </Link>
          )}
        </div>

        {/* Quick-access Row */}
        <div className="flex gap-4">
          <Link href="/profile" className="flex-1 bg-brand-charcoal/30 backdrop-blur-md border border-brand-burgundy/30 rounded-[28px] p-6 flex items-center gap-4 active:scale-[0.98] transition-transform hover:bg-brand-charcoal/60">
            <div className="w-12 h-12 rounded-full bg-brand-wine border border-brand-burgundy/50 flex items-center justify-center shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F6D7CF" strokeWidth="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div>
              <p className="font-playfair text-xl text-brand-blush mb-1">Profile</p>
              <p className="text-[9px] text-brand-taupe uppercase tracking-[0.2em]">Your settings</p>
            </div>
          </Link>

          {isResultsOpen ? (
            <Link href="/leaderboard" className="flex-1 bg-brand-charcoal/30 backdrop-blur-md border border-brand-burgundy/30 rounded-[28px] p-6 flex items-center gap-4 active:scale-[0.98] transition-transform hover:bg-brand-charcoal/60">
              <div className="w-12 h-12 rounded-full bg-brand-wine border border-brand-burgundy/50 flex items-center justify-center shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F6D7CF" strokeWidth="1.5">
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
                  <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
                  <path d="M4 22h16"></path>
                  <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
                </svg>
              </div>
              <div>
                <p className="font-playfair text-xl text-brand-blush mb-1">Picks</p>
                <p className="text-[9px] text-brand-taupe uppercase tracking-[0.2em]">Leaderboard</p>
              </div>
            </Link>
          ) : (
            <div className="flex-1 bg-brand-wine/20 border border-brand-burgundy/20 rounded-[28px] p-6 flex items-center gap-4 opacity-50 cursor-not-allowed">
              <div className="w-12 h-12 rounded-full bg-brand-charcoal/50 flex items-center justify-center shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B5A57" strokeWidth="1.5">
                  <rect x="3" y="11" width="18" height="11" rx="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <div>
                <p className="font-playfair text-xl text-brand-taupe mb-1">Picks</p>
                <p className="text-[9px] text-brand-taupe/50 uppercase tracking-[0.2em]">Locked</p>
              </div>
            </div>
          )}
        </div>

        {/* Staff Tools */}
        {(session.globalRole === "SUPER_ADMIN" || session?.eventRoles?.includes("ADMIN") || session?.eventRoles?.includes("CASHIER")) && (
          <div className="mt-6 mb-8 px-2">
            <p className="text-[10px] text-brand-taupe font-bold uppercase tracking-[0.3em] mb-4 text-center">Operations Center</p>
            <div className="flex gap-4">
              {(session.globalRole === "SUPER_ADMIN" || session?.eventRoles?.includes("ADMIN")) && (
                <Link href="/admin" className="flex-1 flex flex-col items-center justify-center bg-transparent border border-brand-burgundy/40 rounded-[24px] py-5 hover:bg-brand-charcoal/30 transition-all active:scale-95 group">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B5A57" strokeWidth="1.5" className="mb-2 group-hover:text-brand-rose transition-colors"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                  <span className="text-[10px] font-mono text-brand-blush/80 uppercase tracking-widest group-hover:text-brand-rose transition-colors">Event Admin</span>
                </Link>
              )}
              {(session.globalRole === "SUPER_ADMIN" || session?.eventRoles?.includes("CASHIER")) && (
                <Link href="/cashier" className="flex-1 flex flex-col items-center justify-center bg-transparent border border-brand-burgundy/40 rounded-[24px] py-5 hover:bg-brand-charcoal/30 transition-all active:scale-95 group">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B5A57" strokeWidth="1.5" className="mb-2 group-hover:text-brand-rose transition-colors"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                  <span className="text-[10px] font-mono text-brand-blush/80 uppercase tracking-widest group-hover:text-brand-rose transition-colors">Cashier Desk</span>
                </Link>
              )}
            </div>
          </div>
        )}

      </div>

      <BottomTabBar />
    </div>
  );
}
