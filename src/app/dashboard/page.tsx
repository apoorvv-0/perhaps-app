"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import BottomTabBar from "@/components/BottomTabBar";

const PHASE_LABELS: Record<string, string> = {
  DRAFT: 'Coming Soon',
  REGISTRATION_OPEN: 'Registration Open',
  REGISTRATION_CLOSED: 'Registration Closed',
  CHOOSING_OPEN: 'Choosing Phase',
  CHOOSING_CLOSED: 'Choices Locked',
  MATCHING: 'Matching in Progress',
  RESULTS_OPEN: 'Results Live',
  CLOSED: 'Event Closed',
  ARCHIVED: 'Archived'
};

export default function DashboardPage() {
  const { session, isLoading, logout } = useAuth();
  const router = useRouter();
  const [phase, setPhase] = useState("Loading...");
  const [firstName, setFirstName] = useState("");

  useEffect(() => {
    if (!isLoading) {
      if (!session) {
        router.push("/");
      } else {
        fetchData();
      }
    }
  }, [session, isLoading, router]);

  const fetchData = async () => {
    try {
      const profRes = await fetch("/api/profile");
      if (profRes.ok) {
        const pData = await profRes.json();
        setFirstName(pData.profile?.firstName || "Guest");
      }
      // eventPhase is included in BOTH 200 and 403 responses from directory API
      const dirRes = await fetch("/api/directory");
      const dirData = await dirRes.json();
      if (dirData.eventPhase) {
        setPhase(dirData.eventPhase);
      } else {
        // Fallback for SUPER_ADMIN via admin event endpoint
        const adminRes = await fetch("/api/admin/event");
        if (adminRes.ok) {
          const adminData = await adminRes.json();
          setPhase(adminData.event?.status || "Unknown");
        } else {
          setPhase("Unknown");
        }
      }
    } catch (e) {
      console.error(e);
      setPhase("Unknown");
    }
  };

  if (isLoading || !session) return <div style={{ minHeight: '100vh', background: '#2B0609' }} />;

  const isAdmin = session.globalRole === "SUPER_ADMIN";
  const displayPhase = PHASE_LABELS[phase] || phase;

  const cardStyle = {
    display: 'flex', flexDirection: 'column' as const, textDecoration: 'none',
    transition: 'all 0.2s ease', cursor: 'pointer', padding: '24px'
  };
  
  const hoverProps = {
    onMouseOver: (e: any) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = "rgba(246, 215, 207, 0.2)"; },
    onMouseOut: (e: any) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "rgba(246, 215, 207, 0.05)"; }
  };

  return (
    <div className="min-h-screen bg-brand-wine text-brand-blush font-inter relative pb-24">
      {/* Background Glow */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-burgundy/30 via-brand-wine/0 to-brand-wine/0" />

      {/* Top Section */}
      <div className="relative z-10 max-w-2xl mx-auto px-6 pt-12 pb-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-playfair text-[28px] text-brand-blush mb-1">
              {(() => { const hour = new Date().getHours(); return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'; })()}, {firstName}
            </h1>
          </div>
          <button onClick={logout} className="text-brand-taupe hover:text-brand-blush text-sm transition-colors">
            Logout
          </button>
        </div>
        
        {/* Phase Banner */}
        <div className="glass-panel p-5 rounded-2xl border-l-4 border-l-brand-burgundy">
          {phase === 'REGISTRATION_OPEN' ? (
            <>
              <p className="text-[11px] text-brand-taupe uppercase tracking-widest font-bold mb-1">Status</p>
              <p className="text-[16px] text-brand-blush font-semibold">You are registered.</p>
              <p className="text-[13px] text-brand-rose mt-1">Choosing your maybes begins soon.</p>
            </>
          ) : phase === 'CHOOSING_OPEN' ? (
            <>
              <p className="text-[11px] text-brand-taupe uppercase tracking-widest font-bold mb-1">Status</p>
              <p className="text-[16px] text-brand-blush font-semibold">Choosing is live!</p>
              <p className="text-[13px] text-brand-rose mt-1">Go to Discover to rank your matches.</p>
            </>
          ) : phase === 'CHOOSING_CLOSED' || phase === 'MATCHING' ? (
             <>
              <p className="text-[11px] text-brand-taupe uppercase tracking-widest font-bold mb-1">Status</p>
              <p className="text-[16px] text-brand-blush font-semibold">Choices Locked.</p>
              <p className="text-[13px] text-brand-rose mt-1">Matches are being calculated...</p>
            </>
          ) : (
            <>
              <p className="text-[11px] text-brand-taupe uppercase tracking-widest font-bold mb-1">Current Phase</p>
              <p className="text-[16px] text-brand-blush font-semibold">{displayPhase}</p>
            </>
          )}
        </div>
      </div>

      {/* Cards Grid */}
      <div className="relative z-10 max-w-2xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {phase === "RESULTS_OPEN" && (
          <Link href="/results" className="charcoal-card col-span-1 sm:col-span-2 relative overflow-hidden group" style={{ ...cardStyle, border: "1px solid rgba(232, 180, 165, 0.4)" }} onMouseOver={hoverProps.onMouseOver} onMouseOut={hoverProps.onMouseOut}>
            <div className="absolute inset-0 bg-gradient-to-br from-brand-burgundy/20 to-transparent pointer-events-none" />
            <h2 className="font-playfair text-[24px] text-brand-rose mb-1 relative z-10">Results are live</h2>
            <p className="text-[13px] text-brand-taupe relative z-10">See if you have a mutual match.</p>
          </Link>
        )}

        {/* Instead of text 'Directory', rename it 'Discover' to match mockup */}
        <Link href="/directory" className="charcoal-card" style={cardStyle} onMouseOver={hoverProps.onMouseOver} onMouseOut={hoverProps.onMouseOut}>
          <h2 className="font-playfair text-[20px] text-brand-blush mb-1">Discover</h2>
          <p className="text-[13px] text-brand-taupe">Browse and rank your potential matches.</p>
        </Link>

        {phase === "RESULTS_OPEN" && (
          <Link href="/leaderboard" className="charcoal-card" style={cardStyle} onMouseOver={hoverProps.onMouseOver} onMouseOut={hoverProps.onMouseOut}>
            <h2 className="font-playfair text-[20px] text-brand-blush mb-1">Leaderboard</h2>
            <p className="text-[13px] text-brand-taupe">See the most wanted.</p>
          </Link>
        )}

        <Link href="/profile" className="charcoal-card" style={cardStyle} onMouseOver={hoverProps.onMouseOver} onMouseOut={hoverProps.onMouseOut}>
          <h2 className="font-playfair text-[20px] text-brand-blush mb-1">Profile</h2>
          <p className="text-[13px] text-brand-taupe">Edit your personal details.</p>
        </Link>

        {isAdmin && (
          <>
            <div className="col-span-1 sm:col-span-2 mt-4 mb-2">
              <p className="text-[11px] text-brand-taupe uppercase tracking-widest font-bold px-1">Admin Tools</p>
            </div>
            <Link href="/roviara" className="charcoal-card" style={cardStyle} onMouseOver={hoverProps.onMouseOver} onMouseOut={hoverProps.onMouseOut}>
              <h2 className="font-playfair text-[20px] text-brand-rose mb-1">Roviara Hub</h2>
              <p className="text-[13px] text-brand-taupe">SuperAdmin command center.</p>
            </Link>

            <Link href="/admin" className="charcoal-card" style={cardStyle} onMouseOver={hoverProps.onMouseOver} onMouseOut={hoverProps.onMouseOut}>
              <h2 className="font-playfair text-[20px] text-brand-blush mb-1">Event Control</h2>
              <p className="text-[13px] text-brand-taupe">Manage phases & matching.</p>
            </Link>

            <Link href="/cashier" className="charcoal-card" style={cardStyle} onMouseOver={hoverProps.onMouseOver} onMouseOut={hoverProps.onMouseOut}>
              <h2 className="font-playfair text-[20px] text-brand-blush mb-1">Cashier</h2>
              <p className="text-[13px] text-brand-taupe">Issue coupons & verify payments.</p>
            </Link>
          </>
        )}
      </div>

      <BottomTabBar />
    </div>
  );
}
