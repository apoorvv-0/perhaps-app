"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import BottomTabBar from "@/components/BottomTabBar";

type MatchStatus =
  | { state: "loading" }
  | { state: "not_open" }
  | { state: "no_match" }
  | { state: "matched_hidden"; hint: { college: string; batch: string } }
  | { state: "matched_revealed"; matchedUser: { firstName: string; lastName: string; instagramHandle: string; college: string; batch: string } };

export default function ResultsPage() {
  const { session, isLoading } = useAuth();
  const router = useRouter();

  const [matchStatus, setMatchStatus] = useState<MatchStatus>({ state: "loading" });
  const [couponCode, setCouponCode] = useState("");
  const [revealing, setRevealing] = useState(false);
  const [revealError, setRevealError] = useState("");

  useEffect(() => {
    if (!isLoading) {
      if (!session) router.push("/");
      else if (!session.phoneVerified) router.push("/verify-phone");
      else if (!session.profileComplete) router.push("/profile");
      else fetchResult();
    }
  }, [session, isLoading, router]);

  const fetchResult = async () => {
    setMatchStatus({ state: "loading" });
    try {
      const res = await fetch("/api/results");
      if (res.status === 403) {
        setMatchStatus({ state: "not_open" });
        return;
      }
      const data = await res.json();
      if (!data.matched) {
        setMatchStatus({ state: "no_match" });
      } else if (data.revealed) {
        setMatchStatus({ state: "matched_revealed", matchedUser: data.matchedUser });
      } else {
        setMatchStatus({ state: "matched_hidden", hint: data.hint });
      }
    } catch {
      setMatchStatus({ state: "not_open" }); // fallback
    }
  };

  const handleReveal = async (e: React.FormEvent) => {
    e.preventDefault();
    setRevealing(true);
    setRevealError("");
    try {
      const res = await fetch("/api/results/reveal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ couponCode: couponCode.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (res.ok) {
        setMatchStatus({ state: "matched_revealed", matchedUser: data.matchedUser });
        setCouponCode("");
      } else {
        setRevealError(data.error || "Invalid or already used coupon.");
      }
    } catch {
      setRevealError("Network error. Please try again.");
    } finally {
      setRevealing(false);
    }
  };

  if (isLoading || !session) return <div className="min-h-screen bg-brand-wine" />;

  return (
    <div className="min-h-screen bg-brand-wine pb-32 font-inter relative">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-burgundy/40 via-brand-wine/0 to-brand-wine/0" />

      {/* Header */}
      <div className="relative z-10 px-6 pt-12 pb-6 max-w-lg mx-auto">
        <button onClick={() => router.push("/dashboard")} className="text-brand-taupe hover:text-brand-blush text-sm flex items-center gap-2 mb-8 transition-colors">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          Dashboard
        </button>

        <h1 className="font-playfair text-[32px] text-brand-blush">Your Match</h1>
      </div>

      <div className="relative z-10 px-6 max-w-lg mx-auto">
        
        {matchStatus.state === "loading" && (
          <div className="charcoal-card p-10 text-center flex flex-col items-center">
            <div className="w-8 h-8 border-2 border-brand-rose border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-brand-taupe">Finding your match...</p>
          </div>
        )}

        {matchStatus.state === "not_open" && (
          <div className="charcoal-card p-10 text-center flex flex-col items-center">
            <div className="w-16 h-16 border border-brand-rose/20 rounded-full flex items-center justify-center mb-6">
              <svg width="24" height="24" fill="none" stroke="#E8B4A5" strokeWidth="1.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <h2 className="font-playfair text-[24px] text-brand-blush mb-2">Results are not live</h2>
            <p className="text-brand-taupe mb-0 text-sm">Please wait for the choosing phase to conclude.</p>
          </div>
        )}

        {matchStatus.state === "no_match" && (
          <div className="charcoal-card p-10 text-center flex flex-col items-center">
             <div className="w-16 h-16 border border-brand-rose/20 rounded-full flex items-center justify-center mb-6">
              <svg width="24" height="24" fill="none" stroke="#E8B4A5" strokeWidth="1.5">
                <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line>
              </svg>
            </div>
            <h2 className="font-playfair text-[24px] text-brand-blush mb-2">No Match</h2>
            <p className="text-brand-taupe text-sm">Unfortunately, you didn't receive a mutual match this season. Don't worry, there's always next time.</p>
          </div>
        )}

        {matchStatus.state === "matched_hidden" && (
          <div className="charcoal-card overflow-hidden">
            <div className="bg-gradient-to-br from-[#5A0D14]/80 to-[#2B0609] p-8 text-center border-b border-brand-rose/10 relative">
              <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay pointer-events-none" />
              <div className="relative z-10 w-20 h-20 mx-auto rounded-full bg-brand-charcoal/50 border border-brand-rose/30 flex items-center justify-center mb-4">
                <svg width="32" height="32" fill="none" stroke="#F6D7CF" strokeWidth="1.5">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
              </div>
              <h2 className="font-playfair text-[28px] text-brand-blush mb-1 relative z-10">It's a Match!</h2>
              <p className="text-brand-rose text-sm relative z-10">You have a mutual connection.</p>
            </div>
            <div className="p-6">
              <p className="text-brand-taupe text-[11px] uppercase tracking-widest font-bold mb-3">Your match is from:</p>
              <div className="flex flex-col gap-2 mb-8">
                <div className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-rose" />
                  <span className="text-brand-blush text-sm">{matchStatus.hint.college}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-rose" />
                  <span className="text-brand-blush text-sm">Batch: {matchStatus.hint.batch}</span>
                </div>
              </div>

              <div className="bg-[#111] p-4 rounded-xl border border-white/5 mb-6">
                <p className="text-brand-blush text-sm mb-3">Enter your coupon code to reveal their identity and Instagram handle.</p>
                <form onSubmit={handleReveal} className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter Code (e.g. A1B2C3D4)"
                    className="flex-1 bg-brand-charcoal border border-brand-rose/20 text-brand-blush px-4 py-3 rounded-xl outline-none focus:border-brand-rose uppercase text-sm"
                    required
                  />
                  <button type="submit" disabled={revealing} className="btn-primary px-6 py-3 rounded-xl whitespace-nowrap">
                    {revealing ? "..." : "Reveal"}
                  </button>
                </form>
                {revealError && <p className="text-red-400 text-xs mt-3">{revealError}</p>}
              </div>
              <p className="text-center text-xs text-brand-taupe">Coupons can be purchased from campus ambassadors.</p>
            </div>
          </div>
        )}

        {matchStatus.state === "matched_revealed" && (
          <div className="charcoal-card overflow-hidden animate-fade-up">
            <div className="bg-gradient-to-br from-[#5A0D14] to-[#2B0609] p-10 text-center relative">
              <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay pointer-events-none" />
              <div className="relative z-10 w-24 h-24 mx-auto rounded-full bg-brand-charcoal border-4 border-brand-rose/50 flex items-center justify-center mb-6 shadow-premium">
                 <svg width="40" height="40" fill="none" stroke="#F6D7CF" strokeWidth="1.5">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
              </div>
              <h2 className="font-playfair text-[32px] text-brand-blush mb-1 relative z-10">
                {matchStatus.matchedUser.firstName} {matchStatus.matchedUser.lastName}
              </h2>
              <p className="text-brand-rose text-sm relative z-10 mb-4">{matchStatus.matchedUser.college} • {matchStatus.matchedUser.batch}</p>
              
              <a 
                href={`https://instagram.com/${matchStatus.matchedUser.instagramHandle.replace('@', '')}`}
                target="_blank"
                rel="noreferrer"
                className="inline-block bg-white/10 hover:bg-white/20 transition-colors backdrop-blur px-6 py-3 rounded-full text-brand-blush font-medium text-sm border border-brand-rose/30 relative z-10"
              >
                @{matchStatus.matchedUser.instagramHandle}
              </a>
            </div>
            <div className="p-6 text-center">
              <p className="text-brand-taupe text-sm">Send them a message and say hi!</p>
            </div>
          </div>
        )}

      </div>
      <BottomTabBar />
    </div>
  );
}
