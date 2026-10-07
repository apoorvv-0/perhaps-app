"use client";

import { useEffect, useState } from "react";
import LoadingScreen from "@/components/LoadingScreen";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import BottomTabBar from "@/components/BottomTabBar";
import { motion, AnimatePresence } from "framer-motion";

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
  
  // Decryption Animation States
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptionStage, setDecryptionStage] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      if (!session) router.push("/");
      else if (!session.phoneVerified) window.location.href = (process.env.NEXT_PUBLIC_ROVIARA_URL || "https://roviara-web.vercel.app") + "/phone";
      else if (!session.profileComplete) router.push("/profile");
      else fetchResult();
    }
  }, [session, isLoading, router]);

  const fetchResult = async () => {
    try {
      const res = await fetch("/api/results");
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403) {
          setMatchStatus({ state: "not_open" });
        } else {
          throw new Error(data.error || "Failed to load results.");
        }
        return;
      }
      
      if (!data.matched) {
        setMatchStatus({ state: "no_match" });
      } else if (data.revealed) {
        setMatchStatus({ state: "matched_revealed", matchedUser: data.matchedUser });
      } else {
        setMatchStatus({ state: "matched_hidden", hint: data.hint });
      }
    } catch (err: any) {
      console.error(err);
      setMatchStatus({ state: "no_match" });
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
        body: JSON.stringify({ couponCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reveal match.");
      
      setIsDecrypting(true);
      setMatchStatus({ state: "matched_revealed", matchedUser: data.matchedUser }); // Will update to matched_revealed in the background
      
      setTimeout(() => setDecryptionStage(1), 1500);
      setTimeout(() => setDecryptionStage(2), 3000);
      setTimeout(() => {
        setDecryptionStage(3);
        setIsDecrypting(false);
      }, 5000);

    } catch (err: any) {
      setRevealError(err.message);
    } finally {
      setRevealing(false);
    }
  };

  if (isLoading || matchStatus.state === "loading") {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-brand-wine text-brand-blush font-inter relative pb-36 selection:bg-brand-burgundy selection:text-brand-blush overflow-hidden flex flex-col">
      {/* Intense Cinematic Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[500px] bg-brand-burgundy/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Header (Minimalist) */}
      <div className="relative z-10 w-full max-w-lg mx-auto px-6 pt-12 pb-4 flex justify-between items-center border-b border-brand-burgundy/30">
        <div>
          <p className="text-[10px] font-bold text-brand-taupe tracking-[0.2em] uppercase mb-1">Season 2</p>
          <h1 className="font-playfair text-2xl italic tracking-tight text-brand-blush">Results</h1>
        </div>
        <button 
          onClick={() => router.push("/dashboard")} 
          className="w-10 h-10 rounded-full bg-brand-wine border border-brand-taupe/20 flex items-center justify-center text-brand-taupe hover:text-brand-blush transition-colors backdrop-blur-md"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m15 18-6-6 6-6"></path></svg>
        </button>
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center w-full max-w-lg mx-auto px-6 pt-8 pb-12">
        
        {/* State: Not Open */}
        {matchStatus.state === "not_open" && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: "easeOut" }} className="w-full text-center flex flex-col items-center">
            <div className="w-24 h-24 rounded-full border border-brand-taupe/10 flex items-center justify-center mb-8 bg-brand-wine/50 backdrop-blur-sm shadow-[0_0_40px_rgba(0,0,0,0.3)] relative">
              <div className="absolute inset-0 rounded-full border border-brand-burgundy/30 animate-[spin_10s_linear_infinite]" />
              <svg width="28" height="28" fill="none" stroke="#E8B4A5" strokeWidth="1" className="opacity-70"><rect x="3" y="11" width="18" height="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            </div>
            <h2 className="font-playfair text-4xl font-normal tracking-wide mb-4 text-brand-blush">Locked</h2>
            <p className="text-brand-taupe text-sm max-w-[260px] mx-auto leading-relaxed font-light">The oracle is still calculating mutual pairs. Patience.</p>
          </motion.div>
        )}

        {/* State: No Match */}
        {matchStatus.state === "no_match" && (
          <motion.div initial={{ opacity: 0, filter: "blur(10px)" }} animate={{ opacity: 1, filter: "blur(0px)" }} transition={{ duration: 1.2, ease: "easeOut" }} className="w-full text-center flex flex-col items-center">
            <div className="w-20 h-20 mb-8 opacity-40">
              <svg viewBox="0 0 24 24" fill="none" stroke="#6B5A57" strokeWidth="0.5" className="w-full h-full"><path d="M4 4l16 16M4 20L20 4"></path></svg>
            </div>
            <h2 className="font-mono text-2xl font-normal tracking-[0.3em] mb-4 text-brand-taupe">NO MATCH</h2>
            <p className="text-brand-taupe/60 text-xs uppercase tracking-widest max-w-[280px] mx-auto leading-loose mb-12">The stars did not align this season. Someone you chose did not choose you back.</p>
            <Link 
              href="/mutuals" 
              className="text-brand-taupe/80 text-xs font-mono uppercase tracking-[0.2em] border-b border-brand-taupe/30 pb-1 hover:text-brand-blush hover:border-brand-blush transition-colors"
            >
              Review Your Choices
            </Link>
          </motion.div>
        )}

        {/* State: Matched Hidden (Paywall) */}
        {matchStatus.state === "matched_hidden" && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }} className="w-full relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-brand-rose/5 rounded-[40px] blur-2xl pointer-events-none" />
            
            <div className="bg-brand-wine/80 backdrop-blur-xl border border-brand-rose/20 rounded-[32px] p-8 pb-10 text-center relative z-10 shadow-2xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-rose/40 to-transparent" />
              
              <div className="inline-block px-4 py-1.5 bg-brand-rose/10 text-brand-rose text-[10px] font-mono uppercase tracking-[0.2em] rounded-full mb-8 border border-brand-rose/20">
                Mutual Match Found
              </div>

              <h2 className="font-playfair text-4xl mb-3 text-brand-blush leading-tight">The feeling <br/><i className="text-brand-rose font-normal">was mutual.</i></h2>
              <p className="text-brand-taupe text-sm mb-10 font-light px-2">Someone you chose also chose you.</p>

              <div className="border border-brand-burgundy/40 bg-brand-charcoal/50 rounded-2xl p-6 mb-10 relative overflow-hidden group">
                <div className="absolute inset-0 bg-brand-rose/5 translate-y-full group-hover:translate-y-0 transition-transform duration-700 ease-out" />
                <p className="text-[9px] text-brand-taupe uppercase tracking-[0.3em] mb-3">Clue</p>
                <p className="font-mono text-xl text-brand-blush tracking-widest">{matchStatus.hint.college} / {matchStatus.hint.batch}</p>
              </div>

              <form onSubmit={handleReveal} className="relative z-10">
                <div className="text-left mb-4 px-2">
                  <p className="text-brand-blush/90 text-sm font-medium">Ready to see who it is?</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-brand-taupe text-xs">Unlock your match's identity.</p>
                    <a href="https://instagram.com/perhaps.app" target="_blank" rel="noreferrer" className="text-brand-rose text-xs hover:underline flex items-center gap-1 opacity-80">
                      Get Code <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                    </a>
                  </div>
                </div>

                <div className="relative">
                  <input 
                    type="text" 
                    required 
                    placeholder="ENTER CODE (,199)" 
                    value={couponCode} 
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())} 
                    className="w-full bg-brand-wine/50 backdrop-blur-md border border-brand-burgundy text-brand-rose text-center px-4 py-5 rounded-[20px] outline-none focus:border-brand-rose/50 font-mono tracking-[0.2em] placeholder:tracking-[0.1em] placeholder:text-brand-taupe/30 text-sm transition-all" 
                  />
                  <button 
                    type="submit" 
                    disabled={revealing || !couponCode} 
                    className="absolute right-2 top-2 bottom-2 aspect-square bg-brand-rose text-brand-wine rounded-[14px] flex items-center justify-center transition-transform hover:scale-[1.05] active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {revealing ? (
                      <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                    )}
                  </button>
                </div>
                {revealError && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400/80 text-xs mt-3">{revealError}</motion.p>}
              </form>
            </div>
          </motion.div>
        )}

        {/* State: Decrypting Full Screen Overlay */}
        <AnimatePresence>
          {isDecrypting && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              transition={{ duration: 0.5 }}
              className="fixed inset-0 z-50 bg-brand-wine/98 backdrop-blur-2xl flex flex-col items-center justify-center p-8"
            >
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)] pointer-events-none" />

              <div className="w-32 h-32 mb-12 relative flex items-center justify-center">
                <motion.div className="absolute inset-0 border-[1px] border-brand-rose/20 rounded-full" animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 2, repeat: Infinity }} />
                <motion.div className="absolute inset-4 border-[1px] border-brand-rose/40 rounded-full" animate={{ scale: [1, 1.1, 1], opacity: [0.8, 0.2, 0.8] }} transition={{ duration: 2, repeat: Infinity, delay: 0.2 }} />
                <motion.div className="absolute inset-8 border border-brand-rose rounded-full border-t-transparent border-l-transparent" animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} />
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-brand-rose"><rect x="3" y="11" width="18" height="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              </div>

              <h2 className="text-xs font-mono text-brand-rose/80 mb-12 tracking-[0.5em] uppercase">Decrypting Identity</h2>

              <div className="w-full max-w-sm space-y-6 relative z-10">
                <div className="flex justify-between items-end border-b border-brand-burgundy/30 pb-2">
                  <span className="text-brand-taupe/50 font-mono text-[10px] uppercase tracking-[0.2em]">College</span>
                  <span className="text-brand-blush font-mono text-sm tracking-widest">
                    {decryptionStage >= 1 && matchStatus.state === "matched_revealed" ? matchStatus.matchedUser.college : "-^-^-^-^-^"}
                  </span>
                </div>
                <div className="flex justify-between items-end border-b border-brand-burgundy/30 pb-2">
                  <span className="text-brand-taupe/50 font-mono text-[10px] uppercase tracking-[0.2em]">Batch</span>
                  <span className="text-brand-blush font-mono text-sm tracking-widest">
                    {decryptionStage >= 2 && matchStatus.state === "matched_revealed" ? matchStatus.matchedUser.batch : "-^-^-^"}
                  </span>
                </div>
                <div className="flex justify-between items-end border-b border-brand-burgundy/30 pb-2">
                  <span className="text-brand-taupe/50 font-mono text-[10px] uppercase tracking-[0.2em]">Match</span>
                  <span className="text-brand-rose font-mono text-sm tracking-widest blur-[2px] animate-pulse">
                    {decryptionStage >= 3 ? "REVEALED" : "-^-^-^-^-^-^"}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* State: Matched Revealed */}
        {!isDecrypting && matchStatus.state === "matched_revealed" && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }} 
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-full bg-brand-charcoal border-[0.5px] border-brand-rose/40 rounded-[32px] overflow-hidden shadow-[0_20px_60px_-15px_rgba(232,180,165,0.15)] relative"
          >
            <div className="absolute top-0 left-0 w-full h-[200px] bg-gradient-to-b from-brand-rose/10 to-transparent pointer-events-none" />
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-brand-rose/20 rounded-full blur-[80px]" />
            
            <div className="p-8 pb-10 text-center relative z-10 flex flex-col items-center">
              <div className="mb-10 w-full flex justify-center">
                <div className="px-4 py-1.5 bg-brand-rose text-brand-charcoal text-[9px] font-bold uppercase tracking-[0.3em] rounded-full shadow-[0_0_20px_rgba(232,180,165,0.4)]">
                  Match Revealed
                </div>
              </div>

              <h2 className="font-playfair text-5xl font-normal text-brand-blush mb-4 leading-none tracking-tight">
                {matchStatus.matchedUser.firstName} <br/> <span className="italic">{matchStatus.matchedUser.lastName}</span>
              </h2>
              
              <div className="flex items-center gap-3 text-brand-taupe font-mono text-xs uppercase tracking-[0.2em] mb-12">
                <span>{matchStatus.matchedUser.college}</span>
                <span className="w-1 h-1 rounded-full bg-brand-rose/50" />
                <span>{matchStatus.matchedUser.batch}</span>
              </div>

              <a 
                href={`https://instagram.com/${matchStatus.matchedUser.instagramHandle.replace('@', '')}`}
                target="_blank"
                rel="noreferrer"
                className="w-full bg-brand-blush text-brand-wine py-4 rounded-[20px] font-bold text-sm uppercase tracking-[0.1em] flex items-center justify-center gap-3 transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-lg mb-6 group"
              >
                DM {matchStatus.matchedUser.firstName} 
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:translate-x-1 transition-transform"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
              </a>

              <div className="w-full border-t border-brand-burgundy/40 pt-6">
                <p className="text-brand-taupe/60 text-[10px] uppercase tracking-[0.2em] leading-relaxed font-mono">
                  Instagram Handle
                  <br/>
                  <span className="text-brand-rose text-sm font-medium tracking-widest lowercase block mt-1">@{matchStatus.matchedUser.instagramHandle.replace('@', '')}</span>
                </p>
              </div>
            </div>
          </motion.div>
        )}

      </div>
      <BottomTabBar />
    </div>
  );
}
