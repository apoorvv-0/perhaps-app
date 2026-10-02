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
      // Rely on directory endpoint for students to get eventPhase safely
      const dirRes = await fetch("/api/directory");
      if (dirRes.ok) {
        const dirData = await dirRes.json();
        setPhase(dirData.eventPhase || "Unknown");
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading || !session) return null;

  const isAdmin = session.globalRole === "SUPER_ADMIN";
  const displayPhase = PHASE_LABELS[phase] || phase;

  const cardStyle = {
    padding: "24px",
    display: 'flex', flexDirection: 'column' as const, textDecoration: 'none',
    transition: 'all 0.2s ease', cursor: 'pointer'
  };
  
  const hoverProps = {
    onMouseOver: (e: any) => { e.currentTarget.style.borderColor = "rgba(201, 160, 160, 0.3)"; e.currentTarget.style.background = "rgba(40, 20, 20, 0.6)"; },
    onMouseOut: (e: any) => { e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.05)"; e.currentTarget.style.background = "rgba(20, 20, 20, 0.6)"; }
  };

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '80px' }}>
      {/* Top Section */}
      <div style={{ padding: '48px 24px 24px', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="serif" style={{ fontSize: '28px', color: '#f5f0ee' }}><span className="gradient-text"><span className="gradient-text">{(() => { const hour = new Date().getHours(); return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'; })()}, {firstName}</span></span></h1>
          </div>
          <button onClick={logout} style={{ background: 'none', border: 'none', color: '#7a6b6b', cursor: 'pointer', fontSize: '14px', textDecoration: 'underline' }}>Logout</button>
        </div>
        
        {/* Phase Banner */}
        <div style={{ marginTop: '24px', background: "rgba(20, 20, 20, 0.4)", backdropFilter: "blur(10px)", borderLeft: '4px solid #8b1a1a', padding: '16px 20px', borderRadius: '4px' }}>
          <p style={{ fontSize: '12px', color: '#7a6b6b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Current Phase</p>
          <p style={{ fontSize: '16px', color: '#f5f0ee', fontWeight: 500 }}>{displayPhase}</p>
        </div>
      </div>

      {/* Cards Grid */}
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        
        {phase === "RESULTS_OPEN" && (
          <Link href="/results" className="glass-card fade-in" style={{ ...cardStyle, border: "1px solid rgba(139, 26, 26, 0.5)", gridColumn: "1 / -1", background: "linear-gradient(135deg, rgba(139,26,26,0.1) 0%, rgba(0,0,0,0) 100%)" } as any}
            onMouseOver={(e: any) => { e.currentTarget.style.background = '#1a1010'; }}
            onMouseOut={(e: any) => { e.currentTarget.style.background = '#151515'; }}>
            <h2 className="serif" style={{ fontSize: '24px', color: '#c9a0a0', marginBottom: '4px' }}>Results are live</h2>
            <p style={{ fontSize: '13px', color: '#7a6b6b' }}>See if you have a mutual match.</p>
          </Link>
        )}

        {(phase === "CHOOSING_OPEN" || phase === "CHOOSING_CLOSED") && (
          <Link href="/directory" className="glass-card fade-in" style={cardStyle as any} {...hoverProps}>
            <h2 className="serif" style={{ fontSize: '20px', color: '#f5f0ee', marginBottom: '4px' }}>Browse & Choose</h2>
            <p style={{ fontSize: '13px', color: '#7a6b6b' }}>Rank who you want to match with.</p>
          </Link>
        )}

        {(phase !== "DRAFT" && phase !== "REGISTRATION_OPEN" && phase !== "CHOOSING_OPEN") && (
          <Link href="/leaderboard" className="glass-card fade-in" style={cardStyle as any} {...hoverProps}>
            <h2 className="serif" style={{ fontSize: '20px', color: '#f5f0ee', marginBottom: '4px' }}>The Most Wanted</h2>
            <p style={{ fontSize: '13px', color: '#7a6b6b' }}>See who the season chose.</p>
          </Link>
        )}

        <Link href="/profile" className="glass-card fade-in" style={cardStyle as any} {...hoverProps}>
          <h2 className="serif" style={{ fontSize: '20px', color: '#f5f0ee', marginBottom: '4px' }}>Edit Profile</h2>
          <p style={{ fontSize: '13px', color: '#7a6b6b' }}>Update your details.</p>
        </Link>

        {isAdmin && (
          <>
            <Link href="/admin" className="glass-card fade-in" style={{ ...cardStyle, border: "1px solid rgba(92, 26, 26, 0.5)" } as any}
              onMouseOver={(e: any) => { e.currentTarget.style.background = '#1a1010'; }}
              onMouseOut={(e: any) => { e.currentTarget.style.background = '#151515'; }}>
              <h2 className="serif" style={{ fontSize: '20px', color: '#f5f0ee', marginBottom: '4px' }}>Event Control</h2>
              <p style={{ fontSize: '13px', color: '#7a6b6b' }}>Manage phases and matching.</p>
            </Link>
            
            <Link href="/cashier" className="glass-card fade-in" style={cardStyle as any} {...hoverProps}>
              <h2 className="serif" style={{ fontSize: '20px', color: '#f5f0ee', marginBottom: '4px' }}>Cashier Terminal</h2>
              <p style={{ fontSize: '13px', color: '#7a6b6b' }}>Issue match coupons.</p>
            </Link>
            
            <Link href="/roviara" className="glass-card fade-in" style={cardStyle as any} {...hoverProps}>
              <h2 className="serif" style={{ fontSize: '20px', color: '#f5f0ee', marginBottom: '4px' }}>Roviara Hub</h2>
              <p style={{ fontSize: '13px', color: '#7a6b6b' }}>Global management.</p>
            </Link>
          </>
        )}

      </div>

      <BottomTabBar />
    </div>
  );
}
