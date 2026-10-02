"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/components/AuthProvider";

export default function PerhapsLanding() {
  const { session, isLoading, refreshSession } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  const [showRoviaraAuth, setShowRoviaraAuth] = useState(false);

  // DPDP Consent state
  const [ageConsent, setAgeConsent] = useState(false);
  const [dataConsent, setDataConsent] = useState(false);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  useEffect(() => {
    if (!isLoading && session) {
      if (session.globalRole === "SUPER_ADMIN") router.push("/roviara");
      else router.push("/dashboard");
    }
  }, [session, isLoading, router]);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!ageConsent || !dataConsent) {
      setError("You must accept the terms above to continue registering for the event.");
      return;
    }
    setError("");

    try {
      const res = await fetch("/api/auth/google/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: credentialResponse.credential }),
      });

      if (res.ok) {
        await refreshSession();
      } else {
        const data = await res.json();
        setError(data.error || "Authentication failed");
      }
    } catch (err) {
      setError("Network error during authentication");
    }
  };

  const handleDevLogin = async (role: string, testId: string) => {
    const res = await fetch("/api/auth/dev-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ testId }),
    });
    if (res.ok) await refreshSession();
    else setError("Dev login failed");
  };

  if (isLoading || session) return <div style={{ minHeight: '100vh', background: '#0d0d0d' }} />;

  if (showRoviaraAuth) {
    return (
      <GoogleOAuthProvider clientId={clientId || "dummy"}>
        <main className="min-h-screen bg-[#050505] text-[#f5f0ee] flex flex-col items-center justify-center p-6 font-sans">
          <div className="glass-card fade-in" style={{ maxWidth: '400px', width: '100%', padding: '40px 32px' }}>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white tracking-widest mb-2">ROVIARA</h1>
              <p className="text-xs text-[#7a6b6b] uppercase tracking-widest">Global Identity Hub</p>
            </div>

            <div className="space-y-4 mb-8 bg-[#0a0a0a] p-4 rounded-lg border border-[#2a2a2a]">
              <h2 className="text-xs font-semibold text-[#7a6b6b] uppercase tracking-wide mb-3">DPDP Compliance & Consent</h2>
              
              <label className="flex items-start gap-3 cursor-pointer group">
                <input type="checkbox" checked={ageConsent} onChange={(e) => setAgeConsent(e.target.checked)} className="mt-1 w-4 h-4 rounded border-[#2a2a2a] bg-[#1e1e1e] text-[#8b1a1a]" />
                <span className="text-sm text-[#a09393] group-hover:text-white transition">I declare that I am 18 years of age or older.</span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input type="checkbox" checked={dataConsent} onChange={(e) => setDataConsent(e.target.checked)} className="mt-1 w-4 h-4 rounded border-[#2a2a2a] bg-[#1e1e1e] text-[#8b1a1a]" />
                <span className="text-sm text-[#a09393] group-hover:text-white transition leading-relaxed">
                  I consent to the collection and processing of my personal data by Roviara strictly in accordance with the Digital Personal Data Protection Act.
                </span>
              </label>
            </div>

            <div className="flex flex-col items-center gap-4">
              {error && <p style={{ color: '#dc2626', fontSize: '13px', padding: '12px', background: 'rgba(220, 38, 38, 0.1)', borderRadius: '8px', border: '1px solid rgba(220, 38, 38, 0.3)', width: '100%', textAlign: 'center' }}>{error}</p>}
              
              <div style={{ transition: 'opacity 0.3s', opacity: (ageConsent && dataConsent) ? 1 : 0.5, pointerEvents: (ageConsent && dataConsent) ? 'auto' : 'none' }}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError("Google Login Failed")}
                  useOneTap={false}
                />
              </div>
              
              {!(ageConsent && dataConsent) && (
                <p className="text-xs text-[#7a6b6b] mt-2 text-center">You must accept the terms above to continue.</p>
              )}

              <button 
                onClick={() => setShowRoviaraAuth(false)}
                className="mt-6 text-xs text-[#7a6b6b] hover:text-[#c9a0a0] transition"
              >
                ← Back to Perhaps Event
              </button>
            </div>
          </div>
        </main>
      </GoogleOAuthProvider>
    );
  }

  // Event Landing Page (Perhaps)
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', background: '#0d0d0d' }}>
      
      <div className="glass-card fade-in" style={{ maxWidth: '400px', width: '100%', textAlign: 'center', padding: '40px 32px' }}>
        <h1 className="serif gradient-text fade-in" style={{ fontSize: "84px", color: '#f5f0ee', fontStyle: 'italic', marginBottom: '8px', lineHeight: 1 }}>Perhaps</h1>
        <p style={{ fontSize: '14px', color: '#7a6b6b', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '40px' }}>
          Find your mutual match
        </p>
        
        <div style={{ width: '60px', height: '1px', background: '#2a2a2a', margin: '0 auto 40px auto' }} />

        <div style={{ marginBottom: '40px' }}>
          <h2 className="serif" style={{ fontSize: '24px', color: '#c9a0a0', marginBottom: '12px' }}>A Roviara Event</h2>
          <p style={{ fontSize: '14px', color: '#a09393', lineHeight: 1.6 }}>
            Join the most exclusive mutual matching event of the season. 
            Register now to browse profiles and lock in your choices.
          </p>
        </div>

        <button 
          onClick={() => setShowRoviaraAuth(true)}
          style={{ width: '100%', padding: '16px', background: '#8b1a1a', color: '#f5f0ee', borderRadius: '8px', fontWeight: 600, border: 'none', cursor: 'pointer', marginBottom: '16px', transition: 'background 0.2s' }}
          onMouseOver={(e) => e.currentTarget.style.background = '#6e1515'}
          onMouseOut={(e) => e.currentTarget.style.background = '#8b1a1a'}
        >
          Register via Roviara Hub
        </button>

        {process.env.NODE_ENV === "development" && (
          <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid #2a2a2a' }}>
            <p style={{ fontSize: '12px', color: '#7a6b6b', marginBottom: '16px' }}>Development Access</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button onClick={() => handleDevLogin('STUDENT', 'student-male-1')} style={{ padding: '12px', background: '#1e1e1e', border: '1px solid #2a2a2a', color: '#7a6b6b', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={(e) => { e.currentTarget.style.borderColor = '#5c1a1a'; e.currentTarget.style.color = '#c9a0a0'; }} onMouseOut={(e) => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#7a6b6b'; }}>
                Continue as Male Student
              </button>
              <button onClick={() => handleDevLogin('STUDENT', 'student-female-2')} style={{ padding: '12px', background: '#1e1e1e', border: '1px solid #2a2a2a', color: '#7a6b6b', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={(e) => { e.currentTarget.style.borderColor = '#5c1a1a'; e.currentTarget.style.color = '#c9a0a0'; }} onMouseOut={(e) => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#7a6b6b'; }}>
                Continue as Female Student
              </button>
              <button onClick={() => handleDevLogin('SUPER_ADMIN', 'admin1')} style={{ padding: '12px', background: '#1e1e1e', border: '1px solid #2a2a2a', color: '#7a6b6b', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={(e) => { e.currentTarget.style.borderColor = '#5c1a1a'; e.currentTarget.style.color = '#c9a0a0'; }} onMouseOut={(e) => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#7a6b6b'; }}>
                Continue as Admin
              </button>
            </div>
          </div>
        )}
      </div>

    </main>
  );
}
