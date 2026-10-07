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
      else if (!session.phoneVerified) router.push("/verify-phone");
      else if (!session.profileComplete) router.push("/profile");
      else fetchResult();
    }
  }, [session, isLoading, router]);

  const fetchResult = async () => {
    try {
      const res = await fetch("/api/results");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load results.");
      setMatchStatus(data);
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
      setMatchStatus(data);
      
      setTimeout(() => setDecryptionStage(1), 2000);
      setTimeout(() => setDecryptionStage(2), 4000);
      setTimeout(() => {
        setDecryptionStage(3);
        setIsDecrypting(false);
      }, 7000);

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
    <div className="min-h-screen bg-brand-wine text-brand-blush font-inter relative pb-36 selection:bg-brand-burgundy selection:text-brand-blush">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[600px] h-[400px] bg-brand-burgundy/25 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-lg mx-auto px-8 pt-16 pb-6">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-10 pb-4 border-b border-brand-burgundy/40">
          <div>
            <p className="text-[11px] font-bold text-brand-taupe tracking-widest uppercase mb-1">Season 2</p>
            <h1 className="font-playfair text-3xl font-bold italic tracking-tight text-brand-blush">Results</h1>
          </div>
          <button 
            onClick={() => router.push("/dashboard")} 
            className="w-11 h-11 rounded-full bg-brand-charcoal border border-brand-taupe/20 flex items-center justify-center text-brand-taupe hover:text-brand-blush transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"></path></svg>
          </button>
        </div>

        {matchStatus.state === "not_open" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
            <div className="w-20 h-20 bg-brand-charcoal rounded-full flex items-center justify-center mx-auto mb-6 border border-brand-burgundy/40">
              <svg width="32" height="32" fill="none" stroke="#E8B4A5" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            </div>
            <h2 className="font-playfair text-3xl font-bold mb-3 text-brand-blush">Results Locked</h2>
            <p className="text-brand-taupe text-sm max-w-xs mx-auto leading-relaxed">The matching algorithm is currently calculating mutual pairs. Check back soon.</p>
          </motion.div>
        )}

        {matchStatus.state === "no_match" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
            <div className="w-20 h-20 bg-brand-charcoal rounded-full flex items-center justify-center mx-auto mb-6 border border-brand-burgundy/40">
              <svg width="32" height="32" fill="none" stroke="#6B5A57" strokeWidth="1.5"><circle cx="12" cy="12" r="10"></circle><path d="m15 9-6 6"></path><path d="m9 9 6 6"></path></svg>
            </div>
            <h2 className="font-playfair text-3xl font-bold mb-3 text-brand-blush">No Match This Round</h2>
            <p className="text-brand-taupe text-sm mb-10 max-w-xs mx-auto leading-relaxed">Unfortunately, none of your choices were mutual this season. There is always next round!</p>
            <Link 
              href="/mutuals" 
              className="inline-block py-4 px-8 rounded-full bg-brand-charcoal border border-brand-rose/20 text-brand-rose text-sm font-semibold hover:border-brand-rose/40 transition-all"
            >
              View Your Choices &rarr;
            </Link>
          </motion.div>
        )}

        {matchStatus.state === "matched_hidden" && (
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="bg-brand-charcoal border border-brand-burgundy/50 rounded-[28px] p-8 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-brand-burgundy/30 rounded-full blur-[60px] pointer-events-none" />
            
            <div className="relative z-10">
              <div className="w-16 h-16 bg-brand-burgundy/40 rounded-full flex items-center justify-center mx-auto mb-6 border border-brand-rose/30">
                <svg width="28" height="28" fill="none" stroke="#E8B4A5" strokeWidth="2"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"></path><path d="M12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"></path><path d="M12 21v-6"></path></svg>
              </div>
              <h2 className="font-playfair text-3xl font-bold text-brand-blush mb-2">You Have a Match!</h2>
              <p className="text-brand-taupe text-sm mb-8 leading-relaxed">The feeling was mutual. Someone you chose also chose you.</p>

              <div className="bg-brand-wine/80 border border-brand-burgundy/60 rounded-2xl p-5 mb-8 inline-block w-full text-center">
                <p className="text-[10px] text-brand-taupe uppercase tracking-widest font-bold mb-1">Clue</p>
                <p className="font-mono text-lg text-brand-rose tracking-wide">{matchStatus.hint.college} • {matchStatus.hint.batch}</p>
              </div>

              <div className="bg-brand-wine/40 border border-brand-burgundy/40 rounded-2xl p-5 mb-8 text-sm text-left leading-relaxed">
                <p className="text-brand-blush/80 mb-2">To decrypt and reveal your match's identity and Instagram handle, apply a Reveal Code (₹99).</p>
                <a href="https://instagram.com/perhaps.app" target="_blank" rel="noreferrer" className="text-brand-rose font-medium text-xs hover:underline flex items-center gap-1.5">
                  Get Reveal Code via Instagram DM 
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                </a>
              </div>

              <form onSubmit={handleReveal} className="flex flex-col gap-4">
                <input 
                  type="text" 
                  required 
                  placeholder="8-CHAR CODE" 
                  value={couponCode} 
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())} 
                  className="w-full bg-brand-wine border border-brand-burgundy/60 text-brand-rose text-center px-4 py-4 rounded-2xl outline-none focus:border-brand-rose/60 font-mono tracking-widest placeholder:tracking-normal placeholder:text-brand-taupe/40 text-base" 
                />
                <button 
                  type="submit" 
                  disabled={revealing} 
                  className="w-full py-4 bg-gradient-to-r from-brand-blush to-brand-rose text-brand-charcoal font-semibold rounded-full transition-transform active:scale-[0.98] disabled:opacity-50 text-base tracking-wide"
                >
                  {revealing ? "Decrypting..." : "Reveal Match"}
                </button>
                {revealError && <p className="text-red-400 text-xs mt-1">{revealError}</p>}
              </form>
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {isDecrypting && matchStatus.state === "matched_revealed" && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="fixed inset-0 z-50 bg-brand-wine/95 backdrop-blur-md flex flex-col items-center justify-center p-8"
            >
              <div className="w-24 h-24 mb-8 relative">
                <div className="absolute inset-0 border-4 border-brand-rose/20 rounded-full" />
                <motion.div 
                  className="absolute inset-0 border-4 border-brand-rose rounded-full border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-brand-rose">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                </div>
              </div>

              <h2 className="text-2xl font-mono text-brand-blush mb-10 tracking-widest">DECRYPTING MATCH</h2>

              <div className="w-full max-w-sm space-y-5">
                <div className="flex justify-between items-center border-b border-brand-burgundy/50 pb-3">
                  <span className="text-brand-taupe font-mono text-xs uppercase tracking-wider">College</span>
                  <span className="text-brand-rose font-mono font-bold">
                    {decryptionStage >= 1 ? matchStatus.matchedUser.college : "████████"}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-brand-burgundy/50 pb-3">
                  <span className="text-brand-taupe font-mono text-xs uppercase tracking-wider">Batch</span>
                  <span className="text-brand-rose font-mono font-bold">
                    {decryptionStage >= 2 ? matchStatus.matchedUser.batch : "████"}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-brand-burgundy/50 pb-3">
                  <span className="text-brand-taupe font-mono text-xs uppercase tracking-wider">Name</span>
                  <span className="text-brand-rose font-mono font-bold blur-[2px] animate-pulse">
                    ██████ █████
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!isDecrypting && matchStatus.state === "matched_revealed" && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", damping: 20 }}
            className="bg-brand-charcoal border border-brand-rose/30 rounded-[28px] overflow-hidden shadow-2xl relative"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-rose/20 via-transparent to-transparent pointer-events-none" />
            
            <div className="p-8 pb-10 text-center relative z-10">
              <div className="inline-block px-4 py-1.5 bg-brand-rose/15 border border-brand-rose/30 text-brand-rose text-xs font-bold uppercase tracking-widest rounded-full mb-8">
                IT'S A MATCH
              </div>

              <h2 className="font-playfair text-4xl font-bold text-brand-blush mb-2 leading-tight">
                {matchStatus.matchedUser.firstName} <br/> {matchStatus.matchedUser.lastName}
              </h2>
              <p className="text-brand-taupe font-mono text-sm mb-10">{matchStatus.matchedUser.college} • {matchStatus.matchedUser.batch}</p>

              <a 
                href={`https://instagram.com/${matchStatus.matchedUser.instagramHandle.replace('@', '')}`}
                target="_blank"
                rel="noreferrer"
                className="w-full bg-gradient-to-r from-brand-blush to-brand-rose text-brand-charcoal py-5 rounded-full font-semibold text-base flex items-center justify-center gap-3 transition-transform active:scale-[0.98] shadow-lg"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                DM {matchStatus.matchedUser.firstName} on Instagram
              </a>

              <p className="text-brand-taupe/60 text-xs mt-8 px-4 leading-relaxed font-light">
                They chose you just as much as you chose them. Send them a message and see where it goes!
              </p>
            </div>
          </motion.div>
        )}

      </div>
      <BottomTabBar />
    </div>
  );
}
