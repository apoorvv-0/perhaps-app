"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function PerhapsLanding() {
  const { session, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && session) {
      if (session.globalRole === 'SUPER_ADMIN') router.push('/roviara');
      else router.push('/dashboard');
    }
  }, [session, isLoading, router]);

  if (isLoading || session) return <div style={{ minHeight: '100vh', background: '#09090b' }} />;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-inter flex flex-col">
      {/* ── NAV ─────────────────────────────────────────────── */}
      <nav className="w-full border-b border-white/5 bg-zinc-950/80 backdrop-blur-md fixed top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Perhaps" className="h-6 w-auto opacity-90" style={{ filter: "invert(1) brightness(0.9)" }} />
          </div>
          <div className="flex items-center gap-4">
            <a href="/signup" className="text-sm font-medium text-zinc-400 hover:text-white transition">Sign in</a>
            <a href="/signup" className="text-sm font-medium px-4 py-2 bg-rose-900 text-rose-50 rounded-full hover:bg-rose-800 transition">Get Started</a>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pt-32 pb-20 text-center">
        
        {/* New Badge */}
        <div className="animate-fade-up mb-8 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-rose-900/30 bg-rose-900/10 text-xs font-medium tracking-wide text-rose-300">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          Now in limited beta
        </div>

        {/* Logo Image */}
        <div className="animate-fade-up delay-100 mb-8 max-w-sm w-full mx-auto px-4">
          <img 
            src="/logo.png" 
            alt="Perhaps" 
            className="w-full h-auto object-contain drop-shadow-xl"
            style={{ filter: "invert(1) drop-shadow(0 0 20px rgba(159, 18, 57, 0.4))" }}
          />
        </div>

        <p className="text-xl sm:text-2xl text-zinc-400 font-playfair italic mb-10 max-w-lg mx-auto animate-fade-up delay-200 leading-relaxed">
          Meet someone worth the maybe. <br />
          A premium matching experience built for colleges.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 animate-fade-up delay-300">
          <a href="/signup" className="px-8 py-3.5 rounded-full font-semibold text-sm bg-rose-900 text-white hover:bg-rose-800 active:scale-95 transition-all shadow-lg shadow-rose-900/20">
            Create Roviara ID
          </a>
        </div>
      </main>

      {/* ── FOOTER & DEV LOGIN ─────────────────────────────── */}
      <footer className="border-t border-white/5 py-12 px-6 flex flex-col items-center gap-4">
        <img src="/logo.png" alt="Perhaps" className="h-5 w-auto opacity-50 grayscale" style={{ filter: "invert(1)" }} />
        <p className="text-xs text-zinc-600 max-w-xs text-center leading-relaxed">
          A product by Roviara · Built for college India
        </p>
        
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 pt-8 border-t border-white/5 w-full max-w-sm text-center">
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-4">Dev Access</p>
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
                  className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-lg text-xs hover:bg-zinc-800 hover:text-white transition"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </footer>
    </div>
  );
}
