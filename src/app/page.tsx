"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function PerhapsLanding() {
  const { session, isLoading } = useAuth();
  const router = useRouter();

  // If already logged in, go to dashboard
  useEffect(() => {
    if (!isLoading && session) {
      router.push('/dashboard');
    }
  }, [session, isLoading, router]);

  if (isLoading || session) return <div style={{ minHeight: '100vh', background: '#2B0609' }} />;

  const handleLogin = () => {
    // Redirect to Roviara Hub for SSO
    const roviaraUrl = process.env.NEXT_PUBLIC_ROVIARA_URL || "http://localhost:3001";
    // Send a redirect parameter so Roviara knows where to send them back
    const redirectUrl = encodeURIComponent(`${window.location.origin}/api/auth/callback`);
    window.location.href = `${roviaraUrl}/login?redirect=${redirectUrl}`;
  };

  return (
    <main className="min-h-screen bg-brand-wine text-brand-blush font-inter flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-burgundy/40 via-brand-wine/0 to-brand-wine/0" />

      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center relative z-10 w-full max-w-md mx-auto">
        <h1 className="text-5xl font-cormorant font-bold mb-4 tracking-wide text-brand-gold">
          Perhaps
        </h1>
        
        <p className="text-lg text-brand-blush/80 mb-12 font-light">
          Find your mutuals, discover compatibility.
        </p>

        <button
          onClick={handleLogin}
          className="w-full bg-brand-gold text-brand-wine font-semibold py-4 rounded-xl hover:bg-white transition-all shadow-[0_0_20px_rgba(235,213,184,0.3)] hover:shadow-[0_0_30px_rgba(235,213,184,0.5)] active:scale-95"
        >
          Log in with Roviara
        </button>
      </div>
    </main>
  );
}
