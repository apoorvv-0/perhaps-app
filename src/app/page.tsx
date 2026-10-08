"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import LoadingScreen from "@/components/LoadingScreen";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function PerhapsLandingPage() {
  const { session, isLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isLoading && session) {
      if (session.globalRole === 'SUPER_ADMIN') router.push('/admin');
      else router.push("/dashboard");
    }
  }, [session, isLoading, router]);

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

  if (isLoading || session) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen w-full bg-brand-wine text-brand-blush font-inter relative overflow-hidden flex flex-col justify-between selection:bg-brand-burgundy selection:text-brand-blush">
      
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-burgundy/25 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 w-full h-[40vh] bg-gradient-to-t from-brand-wine-dark/80 via-brand-burgundy/10 to-transparent pointer-events-none" />

      {/* Top Header */}
      <header className="w-full max-w-md mx-auto px-8 pt-14 flex justify-end relative z-10">
        <button 
          onClick={handleLogin} 
          className="text-brand-rose/80 text-sm font-medium hover:text-brand-blush transition-colors tracking-wide py-2 px-4 rounded-full border border-brand-rose/15 hover:border-brand-rose/40 bg-brand-charcoal/30 backdrop-blur-sm"
        >
          Log In
        </button>
      </header>

      {/* Center Content: Exact Brand Logo & Tagline */}
      <main className={`flex-1 flex flex-col items-center justify-center text-center px-8 relative z-10 transition-all duration-1000 transform ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
        
        {/* Glow Behind Logo */}
        <div className="relative mb-6">
          <div className="absolute -inset-4 bg-brand-rose/10 rounded-full blur-2xl pointer-events-none" />
          <Image
            src="/brand-logo.png"
            alt="Perhaps"
            width={324}
            height={130}
            priority
            className="w-64 sm:w-72 h-auto mx-auto object-contain drop-shadow-[0_4px_24px_rgba(232,180,165,0.35)]"
          />
        </div>

        {/* Tagline matching the brand spec */}
        <h2 className="font-playfair text-2xl sm:text-3xl font-normal text-brand-blush/90 leading-relaxed mt-2 tracking-wide">
          Meet someone <br />
          <span className="italic font-medium text-brand-rose">worth the maybe.</span>
        </h2>
        
        <p className="text-xs sm:text-sm text-brand-taupe mt-4 max-w-[260px] leading-relaxed font-light">
          Discreet, intentional mutual matching for verified college students.
        </p>
      </main>

      {/* Bottom CTA & Controls */}
      <footer className={`w-full max-w-md mx-auto px-8 pb-14 flex flex-col items-center relative z-10 gap-5 transition-all duration-1000 delay-200 transform ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
        
        {/* Primary CTA */}
        <button 
          onClick={handleSignUp} 
          className="w-full py-5 rounded-full font-inter font-semibold text-brand-charcoal bg-gradient-to-r from-brand-blush to-brand-rose active:scale-[0.98] transition-all text-base tracking-wide shadow-[0_8px_32px_rgba(232,180,165,0.25)] hover:shadow-[0_8px_40px_rgba(232,180,165,0.4)] hover:scale-[1.01]"
        >
          Get Started
        </button>

        {/* Secondary Login Link */}
        <div className="flex items-center gap-1.5 text-xs text-brand-taupe">
          <span>Already have a Roviara ID?</span>
          <button 
            onClick={handleLogin} 
            className="text-brand-rose font-medium hover:underline transition-colors"
          >
            Log In
          </button>
        </div>

        {/* Pagination Dots from Brand Spec */}
        <div className="flex items-center gap-2 pt-2">
          <div className="w-2 h-2 rounded-full bg-brand-rose shadow-[0_0_8px_rgba(232,180,165,0.8)]" />
          <div className="w-1.5 h-1.5 rounded-full bg-brand-taupe/30" />
          <div className="w-1.5 h-1.5 rounded-full bg-brand-taupe/30" />
        </div>
      </footer>
    </div>
  );
}
