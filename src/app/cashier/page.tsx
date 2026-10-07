"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import BottomTabBar from "@/components/BottomTabBar";

type Coupon = {
  id: string;
  faceValuePaise: number;
  status: 'ISSUED' | "REDEEMED" | "VOIDED";
  buyerPhone: string;
  issuedAt: string;
  voidedAt: string | null;
  voidReason: string | null;
  redeemer?: { firstName: string; lastName: string; instagramHandle: string } | null;
};

type LedgerSummary = {
  totalIssuedCount: number;
  activeCount: number;
  redeemedCount: number;
  voidedCount: number;
  cashCollectedRupees: number;
  cashRefundedRupees: number;
  netRupees: number;
};

export default function CashierDashboard() {
  const { session, isLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"ISSUE" | "LEDGER">("ISSUE");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  
  const [issueLoading, setIssueLoading] = useState(false);
  const [issueError, setIssueError] = useState("");
  const [issuedCode, setIssuedCode] = useState("");

  const [ledger, setLedger] = useState<Coupon[]>([]);
  const [summary, setSummary] = useState<LedgerSummary | null>(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [voidingCode, setVoidingCode] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading) {
      if (!session) router.push("/");
      else if (session.globalRole !== "SUPER_ADMIN" && !session.eventRoles?.includes("CASHIER")) {
        router.push("/dashboard");
      } else if (activeTab === "LEDGER") {
        fetchLedger();
      }
    }
  }, [session, isLoading, router, activeTab]);

  const fetchLedger = async () => {
    setLedgerLoading(true);
    try {
      const res = await fetch("/api/cashier/ledger");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLedger(data.coupons);
      setSummary(data.summary);
    } catch (err) {
      console.error(err);
    } finally {
      setLedgerLoading(false);
    }
  };

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    setIssueLoading(true);
    setIssueError("");
    setIssuedCode("");
    try {
      const res = await fetch("/api/cashier/coupons/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyerPhone: phone, faceValueRupees: Number(amount) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setIssuedCode(data.code);
      setPhone("");
      setAmount("");
    } catch (err: any) {
      setIssueError(err.message);
    } finally {
      setIssueLoading(false);
    }
  };

  const handleVoid = async (code: string) => {
    const reason = prompt("Enter reason for voiding/refunding this coupon:");
    if (!reason) return;
    if (reason.length < 5) return alert("Reason must be at least 5 characters.");
    
    setVoidingCode(code);
    try {
      const res = await fetch("/api/cashier/coupons/void", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert("Voided successfully");
      fetchLedger();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setVoidingCode(null);
    }
  };

  if (isLoading) return <div className="min-h-screen bg-[#050505]" />;

  return (
    <div className="min-h-screen bg-[#050505] font-inter relative pb-32 text-brand-blush selection:bg-brand-rose/30">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-green-900/10 via-[#050505] to-[#050505]" />

      <div className="relative z-10 max-w-2xl mx-auto px-6 pt-12 pb-6">
        <div className="flex justify-between items-center mb-8 border-b border-brand-burgundy/50 pb-6">
          <div>
            <h1 className="font-playfair text-[32px] font-bold text-brand-blush mb-1">Cashier Desk</h1>
            <p className="text-brand-blush/40 text-sm font-mono">Issue & manage coupons</p>
          </div>
          <button onClick={() => router.push("/dashboard")} className="w-10 h-10 rounded-full bg-brand-charcoal border border-brand-burgundy/50 flex items-center justify-center text-brand-taupe hover:text-brand-blush transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"></path></svg>
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex bg-brand-charcoal border border-brand-burgundy/50 rounded-2xl p-1 mb-8">
          <button 
            onClick={() => setActiveTab("ISSUE")} 
            className={`flex-1 py-3 rounded-xl text-sm font-bold tracking-widest uppercase transition-colors ${activeTab === "ISSUE" ? "bg-white text-black" : "text-brand-blush/40 hover:text-brand-blush/70"}`}
          >
            Issue Coupon
          </button>
          <button 
            onClick={() => setActiveTab("LEDGER")} 
            className={`flex-1 py-3 rounded-xl text-sm font-bold tracking-widest uppercase transition-colors ${activeTab === "LEDGER" ? "bg-white text-black" : "text-brand-blush/40 hover:text-brand-blush/70"}`}
          >
            My Ledger
          </button>
        </div>

        {activeTab === "ISSUE" && (
          <div className="bg-brand-charcoal border border-brand-burgundy/50 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
            <div className="hidden" />
            
            <form onSubmit={handleIssue} className="relative z-10 flex flex-col gap-5">
              <div>
                <label className="block text-[11px] font-bold text-brand-blush/40 uppercase tracking-widest mb-2 pl-1">Buyer Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-brand-taupe font-medium">+91</div>
                  <input 
                    type="tel" 
                    required 
                    pattern="[6-9][0-9]{9}" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    placeholder="9876543210" 
                    className="w-full bg-[#111] border border-brand-burgundy/50 text-brand-blush pl-12 pr-4 py-4 rounded-xl outline-none focus:border-green-500 transition-colors font-mono tracking-widest placeholder:text-brand-blush/20" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-brand-blush/40 uppercase tracking-widest mb-2 pl-1">Face Value (₹)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-brand-taupe font-medium">₹</div>
                  <input 
                    type="number" 
                    required 
                    min="1" 
                    max="10000" 
                    value={amount} 
                    onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : "")} 
                    placeholder="99" 
                    className="w-full bg-[#111] border border-brand-burgundy/50 text-brand-blush pl-10 pr-4 py-4 rounded-xl outline-none focus:border-green-500 transition-colors font-mono text-xl" 
                  />
                </div>
                <div className="flex gap-2 mt-3">
                  <button type="button" onClick={() => setAmount(49)} className="px-4 py-2 rounded-lg bg-brand-charcoal border border-brand-burgundy/50 text-brand-blush/60 text-xs hover:bg-white/10">₹49 (3 slots)</button>
                  <button type="button" onClick={() => setAmount(69)} className="px-4 py-2 rounded-lg bg-brand-charcoal border border-brand-burgundy/50 text-brand-blush/60 text-xs hover:bg-white/10">₹69 (6 slots)</button>
                  <button type="button" onClick={() => setAmount(99)} className="px-4 py-2 rounded-lg bg-brand-rose/10 border border-brand-rose/20 text-brand-rose text-xs font-bold hover:bg-brand-rose/20">₹99 (Reveal)</button>
                </div>
              </div>

              {issueError && <div className="text-xs text-red-400 bg-red-950/30 px-4 py-3 rounded-xl border border-red-900/50 mt-2">{issueError}</div>}

              <button 
                type="submit" 
                disabled={issueLoading} 
                className="w-full py-5 bg-green-500 text-black font-bold text-lg rounded-2xl mt-4 transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
              >
                {issueLoading ? "Generating Code..." : "Issue Coupon"}
              </button>
            </form>

            {issuedCode && (
              <div className="mt-8 p-6 bg-green-500/10 border border-green-500/30 rounded-2xl text-center relative z-10 animate-in zoom-in-95 duration-300">
                <p className="text-xs font-bold text-green-400 uppercase tracking-widest mb-2">Coupon Generated Successfully</p>
                <div className="font-mono text-4xl font-bold tracking-widest text-brand-blush mb-4 bg-brand-wine/50 py-4 rounded-xl border border-brand-burgundy/50 select-all">
                  {issuedCode}
                </div>
                <p className="text-brand-blush/40 text-sm">Ask the user to enter this code on the Choosing or Results page.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "LEDGER" && (
          <div className="space-y-6">
            {summary && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-brand-charcoal border border-brand-burgundy/50 rounded-2xl p-4">
                  <p className="text-brand-blush/40 text-[10px] font-bold uppercase tracking-widest mb-1">Total Issued</p>
                  <p className="text-xl font-mono">{summary.totalIssuedCount}</p>
                </div>
                <div className="bg-brand-charcoal border border-brand-burgundy/50 rounded-2xl p-4">
                  <p className="text-brand-blush/40 text-[10px] font-bold uppercase tracking-widest mb-1">Active</p>
                  <p className="text-xl font-mono text-blue-400">{summary.activeCount}</p>
                </div>
                <div className="bg-brand-charcoal border border-brand-burgundy/50 rounded-2xl p-4">
                  <p className="text-brand-blush/40 text-[10px] font-bold uppercase tracking-widest mb-1">Redeemed</p>
                  <p className="text-xl font-mono text-brand-rose">{summary.redeemedCount}</p>
                </div>
                <div className="bg-brand-charcoal border border-brand-burgundy/50 rounded-2xl p-4">
                  <p className="text-green-500/50 text-[10px] font-bold uppercase tracking-widest mb-1">Net Cash</p>
                  <p className="text-xl font-mono text-green-400">₹{summary.netRupees}</p>
                </div>
              </div>
            )}

            <div className="bg-brand-charcoal border border-brand-burgundy/50 rounded-3xl overflow-hidden">
              <div className="p-4 border-b border-brand-burgundy/50 bg-white/[0.02]">
                <h3 className="font-medium text-sm text-brand-blush/70 uppercase tracking-widest font-bold">Recent Transactions</h3>
              </div>
              
              {ledgerLoading ? (
                <div className="py-12 text-center text-brand-taupe">Loading ledger...</div>
              ) : ledger.length === 0 ? (
                <div className="py-12 text-center text-brand-taupe">No coupons issued yet.</div>
              ) : (
                <div className="divide-y divide-white/5">
                  {ledger.map((c) => (
                    <div key={c.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-mono text-lg font-bold">{c.id}</span>
                          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                            c.status === 'ISSUED' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 
                            c.status === 'REDEEMED' ? 'bg-brand-rose/10 text-brand-rose border border-brand-rose/20' : 
                            'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {c.status}
                          </span>
                        </div>
                        <div className="text-xs text-brand-blush/40 flex items-center gap-2">
                          <span>₹{c.faceValuePaise / 100}</span>
                          <span>•</span>
                          <span>{c.buyerPhone}</span>
                          <span>•</span>
                          <span>{new Date(c.issuedAt).toLocaleDateString()}</span>
                        </div>
                        {c.status === "REDEEMED" && c.redeemer && (
                          <div className="text-[11px] text-brand-rose mt-1">
                            Redeemed by: <strong>{c.redeemer.firstName} {c.redeemer.lastName}</strong>
                          </div>
                        )}
                        {c.status === "VOIDED" && c.voidReason && (
                          <p className="text-xs text-red-400 mt-1 bg-red-950/30 inline-block px-2 py-0.5 rounded border border-red-900/50">Refunded: {c.voidReason}</p>
                        )}
                      </div>
                      
                      {c.status === "ISSUED" && (
                        <button 
                          onClick={() => handleVoid(c.id)}
                          disabled={voidingCode === c.id}
                          className="px-4 py-2 bg-brand-charcoal border border-brand-burgundy/50 rounded-lg text-xs font-bold text-brand-taupe hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                        >
                          {voidingCode === c.id ? "..." : "Void & Refund"}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <BottomTabBar />
    </div>
  );
}

