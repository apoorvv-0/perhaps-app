"use client";

import React from "react";
import BottomTabBar from "@/components/BottomTabBar";

export default function CompatibleComingSoon() {
  return (
    <div className="min-h-screen bg-brand-wine text-brand-blush font-inter flex flex-col items-center justify-center text-center px-6 pb-24 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-brand-burgundy/40 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />

      <div className="relative z-10 flex flex-col items-center max-w-sm mx-auto">
        <div className="w-20 h-20 rounded-full bg-brand-charcoal/80 border border-brand-burgundy/50 flex items-center justify-center mb-8 shadow-2xl">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E8B4A5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
        
        <h1 className="text-4xl font-playfair font-bold mb-4 text-brand-blush">Compatible</h1>
        
        <p className="text-brand-taupe text-base leading-relaxed mb-10">
          A blind compatibility quiz. Answer deep questions and discover who you naturally click with.
        </p>
        
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-brand-charcoal border border-brand-burgundy/50 text-brand-taupe rounded-full text-xs font-bold uppercase tracking-widest shadow-sm">
          <span className="w-2 h-2 rounded-full bg-brand-rose animate-pulse" />
          Coming Soon
        </div>
      </div>

      <BottomTabBar />
    </div>
  );
}
