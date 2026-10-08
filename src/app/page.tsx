"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function PerhapsLanding() {
  const { session, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && session) {
      if (session.globalRole === 'SUPER_ADMIN') router.push('/admin');
      else router.push('/dashboard');
    }
  }, [session, isLoading, router]);

  if (isLoading || session) return <div style={{ minHeight: '100vh', background: '#2B0609' }} />;

  const handleLogin = () => {
    const roviaraUrl = process.env.NEXT_PUBLIC_ROVIARA_URL || "https://roviara-web.vercel.app";
    const redirectUrl = encodeURIComponent(`${window.location.origin}/api/auth/callback`);
    window.location.href = `${roviaraUrl}/login?redirect=${redirectUrl}`;
  };

  const handleSignUp = () => {
    const roviaraUrl = process.env.NEXT_PUBLIC_ROVIARA_URL || "https://roviara-web.vercel.app";
    const redirectUrl = encodeURIComponent(`${window.location.origin}/api/auth/callback`);
    window.location.href = `${roviaraUrl}/signup?redirect=${redirectUrl}`;
  };

  return (
    <main className="min-h-screen bg-brand-wine text-brand-blush font-inter flex flex-col relative overflow-hidden">
      
      {/* Subtle ambient lighting reflecting the style guide */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-burgundy/40 via-brand-wine/0 to-brand-wine/0" />

      {/* ΓöÇΓöÇ ONBOARDING HERO (Mimicking the mockups) ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center relative z-10 w-full max-w-md mx-auto mt-20">
        
        {/* The Exact Logo */}
        <div className="animate-fade-up w-full px-4 mb-6">
          <img 
            src="/logo.png" 
            alt="Perhaps" 
            className="w-56 h-auto mx-auto object-contain"
            style={{ filter: "drop-shadow(0 4px 20px rgba(90, 13, 20, 0.4))" }}
          />
        </div>

        {/* The Exact Tagline */}
        <p className="text-brand-blush font-playfair text-[22px] tracking-wide mb-16 animate-fade-up delay-100">
          Meet someone <br />
          worth the maybe.
        </p>

        {/* Actions pinned near bottom on mobile, or just below on desktop */}
        <div className="w-full mt-auto mb-16 flex flex-col gap-4 animate-fade-up delay-200">
          <button onClick={handleSignUp} className="btn-primary block w-full text-center shadow-premium">
            Register Now
          </button>
          <button onClick={handleLogin} className="btn-secondary block w-full text-center">
            Sign In
          </button>
        </div>
      </div>

      {/* ΓöÇΓöÇ DEV LOGIN (Hidden in production) ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-4 left-0 right-0 z-50 flex justify-center">
          <div className="bg-brand-charcoal/90 backdrop-blur-md p-4 rounded-xl border border-white/5 w-[90%] max-w-xs shadow-premium">
            <p className="text-[10px] text-brand-taupe uppercase tracking-widest mb-3 text-center">Dev Access</p>
            <div className="flex flex-col gap-2">
              {[
                ['Male Student', 'student-male-1'], 
                ['Female Student', 'student-female-2'], 
                ['Admin', 'admin1']
              ].map(([label, testId]) => (
                <button 
                  key={testId} 
                  onClick={async () => {
                    const res = await fetch('/api/auth/dev-login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ testId }) });
                    if (res.ok) window.location.href = '/dashboard';
                  }} 
                  className="px-3 py-2 bg-[#1A1A1A] border border-white/5 text-brand-taupe rounded-lg text-xs hover:bg-[#222] hover:text-white transition"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
