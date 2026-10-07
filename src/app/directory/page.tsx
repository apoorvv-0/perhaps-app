"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import BottomTabBar from "@/components/BottomTabBar";
import LoadingScreen from "@/components/LoadingScreen";
import { motion, AnimatePresence } from "framer-motion";

type UserProfile = { id: string; firstName: string; lastName: string; gender: string; college: string; batch: string; alias?: string; };

export default function DirectoryPage() {
  const { session, isLoading } = useAuth();
  const router = useRouter();

  const [phase, setPhase] = useState("LOADING");
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [picks, setPicks] = useState<string[]>([]);
  
  const [search, setSearch] = useState("");
  const [filterGender, setFilterGender] = useState("");
  const [filterCollege, setFilterCollege] = useState("");
  const [filterBatch, setFilterBatch] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showPicks, setShowPicks] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [maxAllowed, setMaxAllowed] = useState(3);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  const initialLoadDone = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isLoading) {
      if (!session) { router.push("/"); return; }
      if (!session.phoneVerified) { window.location.href = (process.env.NEXT_PUBLIC_ROVIARA_URL || "https://roviara-web.vercel.app") + "/phone"; return; }
      if (!session.profileComplete) { router.push("/profile"); return; }
      fetchData();
    }
  }, [session, isLoading, router]);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/directory", { cache: "no-store" });
      const d = await res.json();
      const finalPhase = d.eventPhase || "UNKNOWN";
      
      if (["CHOOSING_OPEN", "CHOOSING_CLOSED", "MATCHING", "RESULTS_OPEN"].includes(d.eventPhase)) {
        const cRes = await fetch("/api/choices", { cache: "no-store" });
        const cData = await cRes.json();
        if (cData.choices) setPicks(cData.choices.map((c: any) => c.pickedId ?? c));
        if (cData.maxChoicesAllowed) setMaxAllowed(cData.maxChoicesAllowed);
      }
      setProfiles(d.participants || []);
      setPhase(finalPhase);
      setTimeout(() => { initialLoadDone.current = true; }, 500);
    } catch {
      setPhase("ERROR");
    }
  };

  

  const saveChoices = async () => {
    const currentPicks = picks;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/choices", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ choices: currentPicks }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save choices");
      setMaxAllowed(data.maxAllowed || data.maxChoicesAllowed || maxAllowed);
      setSyncStatus("saved");
      setHasUnsavedChanges(false);
      setTimeout(() => setSyncStatus("idle"), 2000);
    } catch (err: any) {
      setError(err.message);
      setSyncStatus("error");
    } finally {
      setSaving(false);
    }
  };

  const redeemCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponLoading(true);
    setCouponError("");
    try {
      const res = await fetch("/api/coupons/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid coupon");
      
      setCouponCode("");
      setShowCouponModal(false);
      
      const cRes = await fetch("/api/choices");
      const cData = await cRes.json();
      if (cData.maxChoicesAllowed) setMaxAllowed(cData.maxChoicesAllowed);
    } catch (err: any) {
      setCouponError(err.message);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleTogglePick = (id: string) => {
    if (phase !== "CHOOSING_OPEN") return; // Read-only in other phases

    if (picks.includes(id)) {
      setPicks(picks.filter(p => p !== id));
      setHasUnsavedChanges(true);
    } else {
      if (picks.length >= maxAllowed) {
        // We removed the hard block. We just open the drawer to show the upsell.
        setShowCouponModal(true);
        return;
      }
      setPicks([...picks, id]);
      setHasUnsavedChanges(true);
    }
  };

  const colleges = useMemo(() => Array.from(new Set(profiles.map(p => p.college).filter(Boolean))), [profiles]);
  const batches = useMemo(() => Array.from(new Set(profiles.map(p => p.batch).filter(Boolean))).sort(), [profiles]);

  const filtered = useMemo(() => {
    return profiles.filter(p => {
      const matchSearch = (p.firstName + " " + p.lastName).toLowerCase().includes(search.toLowerCase());
      const matchGender = filterGender ? p.gender === filterGender : true;
      const matchCollege = filterCollege ? p.college === filterCollege : true;
      const matchBatch = filterBatch ? p.batch === filterBatch : true;
      return matchSearch && matchGender && matchCollege && matchBatch;
    });
  }, [profiles, search, filterGender, filterCollege, filterBatch]);

  if (isLoading || phase === "LOADING") return <LoadingScreen />;

  const isChoosing = phase === "CHOOSING_OPEN";
  const isReadOnly = ["CHOOSING_CLOSED", "MATCHING", "RESULTS_OPEN", "CLOSED", "ARCHIVED"].includes(phase);
  
  if (phase !== "CHOOSING_OPEN" && !isReadOnly) {
    return (
      <div className="min-h-screen bg-brand-wine flex flex-col items-center justify-center text-center px-6">
        <h1 className="font-playfair text-3xl font-bold text-brand-blush mb-4">Not Open</h1>
        <p className="text-brand-taupe text-sm">The choosing phase is not active right now.</p>
        <BottomTabBar />
      </div>
    );
  }

  const isValidCount = picks.length === 0 || picks.length >= 3;

  return (
    <div className="min-h-screen bg-brand-wine text-brand-blush font-inter pb-40 relative">
      {/* Premium ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[600px] h-[400px] bg-brand-burgundy/20 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 px-8 pt-16 pb-6 max-w-lg mx-auto">
        <div className="flex justify-between items-center mb-1">
          <h1 className="font-playfair text-4xl font-bold text-brand-blush text-center flex-1">Directory</h1>
          
          {/* Sync Status Indicator (Desktop/Corner) */}
          {isChoosing && (
            <div className="absolute right-8 top-16 flex items-center justify-center">
              {syncStatus === "saving" && <span className="w-2 h-2 rounded-full bg-brand-rose animate-pulse shadow-[0_0_8px_rgba(232,180,165,0.8)]" title="Saving..." />}
              {syncStatus === "saved" && <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" title="Saved" />}
              {syncStatus === "error" && <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" title="Error saving" />}
            </div>
          )}
        </div>
        
        <p className="text-brand-taupe text-center text-sm mb-8 font-light">
          {isChoosing ? "Find someone worth the maybe. If you have multiple mutuals, you will only be matched with your strongest mutual connection." : "Your choices are currently locked."}
        </p>

        {/* Results CTA */}
        {(phase === "RESULTS_OPEN" || phase === "CLOSED") && (
          <div className="mb-6">
            <Link href="/results" className="flex items-center justify-center gap-2 w-full py-4 rounded-[20px] font-bold text-brand-charcoal bg-brand-rose shadow-[0_8px_30px_-10px_rgba(232,180,165,0.4)] transition-transform active:scale-[0.98]">
              View Your Match
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
            </Link>
          </div>
        )}

        {/* Search Bar - Premium Pill */}
        <div className="relative w-full mb-5">
          <svg className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-taupe" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-brand-charcoal border border-brand-burgundy/30 pl-14 pr-6 py-4 rounded-full text-brand-blush placeholder:text-brand-taupe/60 focus:outline-none focus:border-brand-rose/40 transition-colors shadow-lg text-sm"
          />
        </div>

        {/* Custom Pill Filters */}
        <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-2">
          <div className="relative">
             <select value={filterGender} onChange={e => setFilterGender(e.target.value)} className="bg-brand-charcoal border border-brand-burgundy/30 text-brand-taupe text-xs rounded-full px-5 py-2.5 outline-none whitespace-nowrap shadow-sm appearance-none focus:border-brand-rose/40">
               <option value="">Gender</option>
               <option value="MALE">Male</option>
               <option value="FEMALE">Female</option>
             </select>
          </div>
          <div className="relative">
            <select value={filterCollege} onChange={e => setFilterCollege(e.target.value)} className="bg-brand-charcoal border border-brand-burgundy/30 text-brand-taupe text-xs rounded-full px-5 py-2.5 outline-none whitespace-nowrap shadow-sm appearance-none focus:border-brand-rose/40">
              <option value="">College</option>
              {colleges.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="relative">
            <select value={filterBatch} onChange={e => setFilterBatch(e.target.value)} className="bg-brand-charcoal border border-brand-burgundy/30 text-brand-taupe text-xs rounded-full px-5 py-2.5 outline-none whitespace-nowrap shadow-sm appearance-none focus:border-brand-rose/40">
              <option value="">Batch</option>
              {batches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Profile Cards */}
      <div className="px-8 max-w-lg mx-auto flex flex-col gap-4 relative z-10">
        {filtered.map(p => {
          const isPicked = picks.includes(p.id);
          const isMaxedOut = !isPicked && picks.length >= maxAllowed;
          const rank = picks.indexOf(p.id) + 1;
          
          return (
            <motion.div 
              key={p.id}
              whileTap={isChoosing ? { scale: 0.98 } : undefined}
              onClick={() => handleTogglePick(p.id)}
              className={`flex items-center gap-4 p-5 rounded-[28px] ${isChoosing ? 'cursor-pointer' : 'opacity-80'} transition-all duration-300 ${isPicked ? 'bg-brand-charcoal border border-brand-rose/40 shadow-[0_8px_24px_rgba(232,180,165,0.15)]' : 'bg-brand-charcoal/80 border border-brand-burgundy/25 shadow-md hover:bg-brand-charcoal'}`}
            >
              {/* Avatar Circle */}
              <div className="relative">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-playfair transition-all duration-300 ${isPicked ? 'bg-brand-blush text-brand-wine font-bold' : 'bg-brand-wine border border-brand-burgundy/50 text-brand-blush'}`}>
                  {isPicked ? rank : p.firstName[0]}
                </div>
              </div>
              
              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-playfair text-xl font-semibold text-brand-blush truncate tracking-wide">
                  {p.firstName} {p.lastName} {p.alias && <span className="text-brand-taupe font-inter text-sm italic ml-1">"{p.alias}"</span>}
                </h3>
                <div className="flex items-center flex-wrap gap-1.5 text-xs text-brand-taupe mt-1 font-light">
                  <span>{p.college}</span>
                  <span className="w-1 h-1 rounded-full bg-brand-burgundy/60" />
                  <span>'{(p.batch || "").slice(-2)}</span>
                </div>
              </div>

              {/* Heart Icon / Lock Icon */}
              {isChoosing && (
                <div className="pl-2 flex items-center justify-center">
                  {isMaxedOut ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6B5A57" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill={isPicked ? "#E8B4A5" : "none"} stroke={isPicked ? "#E8B4A5" : "#6B5A57"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-300">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-brand-taupe">
            <p className="font-playfair text-xl italic mb-2">Nobody found</p>
            <p className="text-sm font-light">Try adjusting your filters.</p>
          </div>
        )}
      </div>

      {/* Floating Action Bar (My List) */}
      <div className="fixed bottom-[100px] left-0 right-0 z-40 px-6 pointer-events-none flex justify-center">
        {hasUnsavedChanges && (
          <button 
            onClick={() => saveChoices()}
            disabled={saving}
            className="pointer-events-auto bg-green-600 text-white px-5 py-3.5 rounded-full shadow-[0_8px_32px_rgba(34,197,94,0.3)] hover:scale-105 transition-transform font-bold flex items-center gap-1 text-sm"
          >
            {saving ? "Saving..." : "Save Picks"}
          </button>
        )}
        <button 
          onClick={() => setShowPicks(true)}
          className="pointer-events-auto flex items-center gap-2 bg-brand-blush/95 backdrop-blur-md text-brand-wine px-5 py-3.5 rounded-full shadow-[0_8px_32px_rgba(246,215,207,0.25)] hover:scale-105 transition-transform text-sm"
        >
          <span className="font-semibold text-sm">{isChoosing ? "Review Your List" : "View Your Choices"}</span>
          <div className="flex items-center gap-1 bg-brand-wine/10 px-2 py-0.5 rounded-full">
            <span className="font-bold">{picks.length}</span>
            <span className="text-brand-wine/60 text-[10px]">/ {maxAllowed}</span>
          </div>
        </button>
      </div>

      {/* Selected Picks Bottom Sheet */}
      <AnimatePresence>
        {showPicks && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-brand-wine/80 backdrop-blur-sm" onClick={() => setShowPicks(false)} />
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-brand-charcoal border-t border-brand-burgundy/50 rounded-t-[32px] p-6 pb-12 w-full max-w-md mx-auto max-h-[85vh] flex flex-col shadow-[0_-12px_48px_rgba(0,0,0,0.5)]"
            >
              <div className="w-12 h-1.5 bg-brand-taupe/30 rounded-full mx-auto mb-8" />
              
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="font-playfair text-3xl font-bold text-brand-blush mb-1">{isChoosing ? "Your Choices" : "Locked Choices"}</h2>
                  <p className="text-brand-taupe text-sm">Ranked in order of preference.</p>
                </div>
                <button onClick={() => setShowPicks(false)} className="w-10 h-10 rounded-full bg-brand-wine flex items-center justify-center text-brand-taupe hover:text-brand-blush transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>

              {!isValidCount && isChoosing && (
                <div className="bg-brand-wine border border-brand-rose/20 rounded-2xl p-4 mb-6 text-sm text-brand-rose text-center font-medium shadow-inner">
                  Pro tip: Select 3 or more mutuals to lock in your choices and increase your chances.
                </div>
              )}
              {error && <div className="bg-red-950/20 border border-red-900/30 rounded-2xl p-4 mb-6 text-sm text-red-300 text-center">{error}</div>}

              <div className="flex-1 overflow-y-auto mb-6 pr-2 scrollbar-hide space-y-3">
                {picks.length === 0 ? (
                  <div className="text-center py-12 text-brand-taupe">
                    <svg className="mx-auto mb-4 opacity-50" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                    <p className="font-playfair text-lg italic mb-1">Your list is empty.</p>
                    {isChoosing && <p className="text-xs">Tap the heart on a profile to add them.</p>}
                  </div>
                ) : (
                  picks.map((id, index) => {
                    const p = profiles.find(x => x.id === id);
                    if (!p) return null;
                    return (
                      <div key={id} className="flex items-center gap-4 bg-brand-wine/50 border border-brand-burgundy/30 p-4 rounded-[20px]">
                        <div className="w-8 h-8 rounded-full bg-brand-charcoal text-brand-rose font-bold flex items-center justify-center text-sm shadow-inner">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-playfair text-lg font-semibold text-brand-blush truncate">{p.firstName} {p.lastName}</p>
                        </div>
                        {isChoosing && (
                          <button onClick={() => handleTogglePick(id)} className="text-brand-taupe hover:text-brand-rose p-2 transition-colors">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {isChoosing && (
                <div className="bg-brand-wine/40 rounded-[24px] p-5 border border-brand-burgundy/30 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-brand-blush">Need more slots?</span>
                    <span className="text-xs font-bold text-brand-taupe">{picks.length}/{maxAllowed} Used</span>
                  </div>
                  <button onClick={() => setShowCouponModal(true)} className="w-full py-4 bg-transparent border border-brand-rose/20 text-brand-rose rounded-full font-medium text-sm hover:bg-brand-rose/5 transition-colors">
                    Unlock extra choices
                  </button>
                </div>
              )}
              
              <div className="text-center h-4 mt-2">
                <p className="text-xs text-brand-taupe font-medium tracking-wide">
                  {syncStatus === "saving" ? (
                    <span className="flex items-center justify-center gap-2 text-brand-rose">
                      <span className="w-1.5 h-1.5 bg-brand-rose rounded-full animate-pulse" /> Saving...
                    </span>
                  ) : syncStatus === "saved" && isValidCount ? (
                    <span className="text-brand-taupe/60">Saved securely</span>
                  ) : null}
                </p>
              </div>

              {isChoosing && hasUnsavedChanges && (
                <button onClick={() => saveChoices()} disabled={saving} className="w-full py-4 mt-2 bg-green-600 text-white rounded-full font-bold shadow-lg hover:bg-green-500 transition-colors">
                  {saving ? "Saving..." : "Save Picks"}
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Coupon Modal */}
      <AnimatePresence>
        {showCouponModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-brand-wine/90 backdrop-blur-md" onClick={() => setShowCouponModal(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-brand-charcoal border border-brand-burgundy/50 rounded-[32px] p-8 w-full max-w-sm text-center shadow-[0_24px_64px_rgba(0,0,0,0.5)]">
              <h2 className="font-playfair text-3xl font-bold mb-3 text-brand-blush">Expand List</h2>
              <p className="text-brand-taupe text-sm mb-8 leading-relaxed">
                First 3 choices are free.<br/>
                Next 3 slots = ₹69.<br/>
                Every 3 slots after = ₹49.<br/>
                <span className="text-brand-taupe/60 text-xs mt-2 block">(Max 15 total slots)</span>
              </p>
              
              <a href="https://instagram.com/perhaps.app" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full py-4 bg-brand-wine text-brand-rose rounded-full font-medium text-sm hover:bg-brand-burgundy/40 transition-colors mb-8 shadow-sm">
                Get Coupon via Instagram
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
              </a>

              <div className="relative mb-8">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-brand-burgundy/30"></div></div>
                <div className="relative flex justify-center"><span className="bg-brand-charcoal px-4 text-xs text-brand-taupe uppercase tracking-widest">Or apply code</span></div>
              </div>

              <form onSubmit={redeemCoupon} className="flex flex-col gap-5">
                <input 
                  type="text" 
                  placeholder="8-CHAR CODE"
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())}
                  className="w-full bg-brand-wine border border-brand-burgundy/50 text-brand-rose px-6 py-4 rounded-2xl text-center tracking-widest font-mono text-base uppercase placeholder:text-brand-taupe/50 focus:outline-none focus:border-brand-rose/50 shadow-inner"
                  maxLength={8}
                  required
                />
                {couponError && <p className="text-red-400 text-xs font-medium">{couponError}</p>}
                <button type="submit" disabled={couponLoading || couponCode.length !== 8} className="w-full py-4 bg-brand-blush text-brand-wine font-bold rounded-full disabled:opacity-50 active:scale-[0.98] transition-transform shadow-[0_8px_24px_rgba(246,215,207,0.2)]">
                  {couponLoading ? "Verifying..." : "Redeem"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <BottomTabBar />
    </div>
  );
}
