"use client";

import { useEffect, useState } from "react";
import LoadingScreen from "@/components/LoadingScreen";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import BottomTabBar from "@/components/BottomTabBar";

const PHASE_LABELS: Record<string, { title: string; sub: string; color: string; label: string }> = {
  DRAFT:               { title: "Planning", sub: "Event is being set up.", color: "#6B5A57", label: "Hidden" },
  REGISTRATION_OPEN:   { title: "Registrations Open", sub: "Join the event before it closes.", color: "#F6D7CF", label: "Live" },
  REGISTRATION_CLOSED: { title: "Registrations Closed", sub: "Choosing begins soon.", color: "#6B5A57", label: "Paused" },
  CHOOSING_OPEN:       { title: "Lock Choices", sub: "Pick the people you'd want to date. You will be matched with your strongest mutual connection.", color: "#F6D7CF", label: "Active" },
  CHOOSING_CLOSED:     { title: "Choosing Closed", sub: "Choices are locked. Matching begins soon.", color: "#6B5A57", label: "Locked" },
  MATCHING:            { title: "Matching...", sub: "Algorithm calculating mutuals.", color: "#6B5A57", label: "Wait" },
  RESULTS_OPEN:        { title: "Results Out", sub: "Find out who matched with you.", color: "#E8B4A5", label: "Live" },
  CLOSED:              { title: "Closed", sub: "Event officially ended.", color: "#6B5A57", label: "Ended" },
  ARCHIVED:            { title: "Archived", sub: "Event archived.", color: "#6B5A57", label: "Past" },
  UNKNOWN:             { title: "Loading...", sub: "", color: "#6B5A57", label: "" },
};

function CountdownTimer({ endTime }: { endTime: number }) {
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    const update = () => {
      const diff = endTime - Date.now();
      if (diff <= 0) return setTimeLeft("00:00:00");
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);
      setTimeLeft(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`);
    };
    update();
    const int = setInterval(update, 1000);
    return () => clearInterval(int);
  }, [endTime]);
  return <>{timeLeft}</>;
}

export default function DashboardPage() {
  const { session, isLoading } = useAuth();
  const router = useRouter();
  const [phase, setPhase] = useState("LOADING");
  const [firstName, setFirstName] = useState("");
  const [endTime, setEndTime] = useState<number | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!session) router.push("/");
      else fetchData();
    }
  }, [session, isLoading, router]);

  const fetchData = async () => {
    try {
      const [profRes, statusRes] = await Promise.all([
        fetch("/api/profile"),
        fetch("/api/event/status"),
      ]);
      if (profRes.ok) {
        const p = await profRes.json();
        setFirstName(p.profile?.firstName || "");
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
    <div className="min-h-screen bg-brand-wine text-brand-blush font-inter pb-32 selection:bg-brand-burgundy selection:text-brand-blush">

      {/* Top Bar */}
      <div className="flex items-center justify-between px-8 pt-16 pb-2">
        <h1 className="font-playfair text-3xl font-bold italic tracking-tight">Perhaps</h1>
        <button className="w-11 h-11 rounded-full bg-brand-charcoal flex items-center justify-center border border-brand-taupe/20 text-brand-blush">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/>
          </svg>
        </button>
      </div>

      <div className="px-8 mt-8 max-w-lg mx-auto">

        {/* Greeting */}
        <p className="text-sm font-medium text-brand-taupe mb-1">Welcome back,</p>
        <h2 className="text-3xl font-bold mb-10 text-brand-blush">{firstName || "Student"}</h2>

        {/* Phase Card */}
        <div className="w-full bg-brand-charcoal rounded-[28px] p-8 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-brand-burgundy/20 rounded-full blur-[60px] pointer-events-none" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 mb-6">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: meta.color }} />
              <span className="text-[11px] uppercase tracking-widest font-bold" style={{ color: meta.color }}>{meta.label}</span>
            </div>

            <h3 className="font-playfair text-4xl mb-3 text-brand-blush leading-tight">{meta.title}</h3>
            <p className="text-sm text-brand-taupe leading-relaxed mb-10 max-w-[220px]">{meta.sub}</p>

            {endTime && phase === "REGISTRATION_OPEN" && (
              <div className="mb-10 flex flex-col gap-2">
                <span className="text-[11px] text-brand-taupe uppercase tracking-widest font-bold">Time Remaining</span>
                <span className="text-3xl font-mono text-brand-rose tracking-wider">
                  <CountdownTimer endTime={endTime} />
                </span>
              </div>
            )}

            {phase === "REGISTRATION_OPEN" && !isRegistered ? (
              <button
                onClick={handleRegister}
                disabled={registering}
                className="w-full py-5 rounded-full font-semibold text-brand-charcoal bg-gradient-to-r from-brand-blush to-brand-rose active:scale-[0.98] transition-all text-base tracking-wide"
              >
                {registering ? "Registering..." : "Register Now"}
              </button>
            ) : phase === "REGISTRATION_CLOSED" && !isRegistered ? (
              <button
                disabled
                className="w-full py-5 rounded-full font-semibold text-brand-taupe bg-brand-wine border border-brand-burgundy/50 text-base tracking-wide opacity-70 cursor-not-allowed"
              >
                Registrations Closed
              </button>
            ) : (
              <Link
                href={isResultsOpen ? "/results" : "/directory"}
                className="w-full py-5 rounded-full font-semibold text-brand-charcoal bg-gradient-to-r from-brand-blush to-brand-rose active:scale-[0.98] transition-all text-base tracking-wide flex items-center justify-center"
              >
                {isResultsOpen ? "View Your Match" : isChoosingOpen ? "Choose Mutuals" : "Choose Your Partner"}
              </Link>
            )}
          </div>
        </div>

        {/* Quick-access Grid */}
        <div className="grid grid-cols-2 gap-5 mt-2">
          <Link href="/profile" className="bg-brand-charcoal rounded-[28px] p-7 flex flex-col justify-between min-h-[160px] active:scale-[0.98] transition-transform">
            <div className="w-10 h-10 rounded-full bg-brand-wine flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F6D7CF" strokeWidth="1.8">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div>
              <p className="font-playfair text-xl text-brand-blush mb-1">Profile</p>
              <p className="text-[10px] text-brand-taupe uppercase tracking-widest">Your settings</p>
            </div>
          </Link>

          {isResultsOpen ? (
            <Link href="/leaderboard" className="bg-brand-charcoal rounded-[28px] p-7 flex flex-col justify-between min-h-[160px] active:scale-[0.98] transition-transform">
              <div className="w-10 h-10 rounded-full bg-brand-wine flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F6D7CF" strokeWidth="1.8">
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
                  <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
                  <path d="M4 22h16"></path>
                  <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
                </svg>
              </div>
              <div>
                <p className="font-playfair text-xl text-brand-blush mb-1">Picks</p>
                <p className="text-[10px] text-brand-taupe uppercase tracking-widest">Leaderboard</p>
              </div>
            </Link>
          ) : (
            <div className="bg-brand-charcoal/40 rounded-[28px] p-7 flex flex-col justify-between min-h-[160px] opacity-40">
              <div className="w-10 h-10 rounded-full bg-brand-wine/50 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B5A57" strokeWidth="1.8">
                  <rect x="3" y="11" width="18" height="11" rx="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <div>
                <p className="font-playfair text-xl text-brand-taupe mb-1">Picks</p>
                <p className="text-[10px] text-brand-taupe/50 uppercase tracking-widest">Locked</p>
              </div>
            </div>
          )}
        </div>

        {/* Staff Tools */}
        {(session.globalRole === "SUPER_ADMIN" || session?.eventRoles?.includes("ADMIN") || session?.eventRoles?.includes("CASHIER")) && (
          <div className="pt-8 mt-8 border-t border-brand-burgundy/30">
            <p className="text-[10px] text-brand-taupe font-bold uppercase tracking-widest mb-4">Operations Center</p>
            <div className="flex flex-col gap-3">
              {(session.globalRole === "SUPER_ADMIN" || session?.eventRoles?.includes("ADMIN")) && (
                <Link href="/admin" className="flex items-center justify-between bg-brand-charcoal/40 backdrop-blur-md border border-brand-rose/10 rounded-2xl px-6 py-4 hover:border-brand-rose/30 transition-all shadow-sm group">
                  <span className="text-sm font-semibold text-brand-blush">Event Admin</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B5A57" strokeWidth="2" className="group-hover:text-brand-rose group-hover:translate-x-1 transition-all"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                </Link>
              )}
              {(session.globalRole === "SUPER_ADMIN" || session?.eventRoles?.includes("CASHIER")) && (
                <Link href="/cashier" className="flex items-center justify-between bg-brand-charcoal/40 backdrop-blur-md border border-brand-rose/10 rounded-2xl px-6 py-4 hover:border-brand-rose/30 transition-all shadow-sm group">
                  <span className="text-sm font-semibold text-brand-blush">Cashier Desk</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B5A57" strokeWidth="2" className="group-hover:text-brand-rose group-hover:translate-x-1 transition-all"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
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
