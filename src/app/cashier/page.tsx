"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

type Coupon = {
  id: string;
  faceValuePaise: number;
  status: "ACTIVE" | "REDEEMED" | "VOIDED";
  buyerPhone: string | null;
  issuedAt: string;
  voidedAt: string | null;
  voidReason: string | null;
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

  const [ledger, setLedger] = useState<{ coupons: Coupon[]; summary: LedgerSummary } | null>(null);
  
  // Issue Form State
  const [issuePhone, setIssuePhone] = useState("");
  const [issueAmount, setIssueAmount] = useState(100);
  const [issuing, setIssuing] = useState(false);
  const [issueError, setIssueError] = useState("");
  const [newCouponCode, setNewCouponCode] = useState("");

  // Void Form State
  const [voidCode, setVoidCode] = useState("");
  const [voidReason, setVoidReason] = useState("");
  const [voiding, setVoiding] = useState(false);
  const [voidError, setVoidError] = useState("");
  const [voidSuccess, setVoidSuccess] = useState("");

  useEffect(() => {
    if (!isLoading) {
      if (!session) router.push("/");
      else if (session.globalRole !== "SUPER_ADMIN") router.push("/dashboard");
      else fetchLedger();
    }
  }, [session, isLoading, router]);

  const fetchLedger = async () => {
    try {
      const res = await fetch("/api/cashier/ledger");
      if (res.ok) {
        const data = await res.json();
        setLedger(data);
      }
    } catch (error) {
      console.error("Failed to fetch ledger");
    }
  };

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    setIssuing(true);
    setIssueError("");
    setNewCouponCode("");

    try {
      const res = await fetch("/api/cashier/coupons/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          faceValueRupees: Number(issueAmount),
          buyerPhone: issuePhone,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setNewCouponCode(data.code);
        setIssuePhone("");
        fetchLedger();
      } else {
        setIssueError(data.error || "Failed to issue coupon");
      }
    } catch (err) {
      setIssueError("Network error");
    } finally {
      setIssuing(false);
    }
  };

  const handleVoid = async (e: React.FormEvent) => {
    e.preventDefault();
    setVoiding(true);
    setVoidError("");
    setVoidSuccess("");

    try {
      const res = await fetch("/api/cashier/coupons/void", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: voidCode,
          reason: voidReason,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setVoidSuccess("Coupon voided and refunded successfully.");
        setVoidCode("");
        setVoidReason("");
        fetchLedger();
      } else {
        setVoidError(data.error || "Failed to void coupon");
      }
    } catch (err) {
      setVoidError("Network error");
    } finally {
      setVoiding(false);
    }
  };

  if (isLoading || !ledger) return <div className="p-8 text-center text-[#7a6b6b]">Loading Cashier Dashboard...</div>;

  return (
    <div className="min-h-screen bg-[#0d0d0d] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-[#f5f0ee]">Cashier Terminal</h1>
          <button onClick={() => router.push("/dashboard")} className="text-brand-primary hover:underline">
            &larr; Back to Dashboard
          </button>
        </div>

        {/* Ledger Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-#151515 p-4 rounded-lg shadow border border-[#2a2a2a]">
            <h3 className="text-sm font-medium text-[#7a6b6b]">Total Net Cash</h3>
            <p className="mt-1 text-2xl font-semibold text-green-600">₹{ledger.summary.netRupees}</p>
          </div>
          <div className="bg-#151515 p-4 rounded-lg shadow border border-[#2a2a2a]">
            <h3 className="text-sm font-medium text-[#7a6b6b]">Collected</h3>
            <p className="mt-1 text-2xl font-semibold text-[#f5f0ee]">₹{ledger.summary.cashCollectedRupees}</p>
          </div>
          <div className="bg-#151515 p-4 rounded-lg shadow border border-[#2a2a2a]">
            <h3 className="text-sm font-medium text-[#7a6b6b]">Refunded</h3>
            <p className="mt-1 text-2xl font-semibold text-red-600">₹{ledger.summary.cashRefundedRupees}</p>
          </div>
          <div className="bg-#151515 p-4 rounded-lg shadow border border-[#2a2a2a]">
            <h3 className="text-sm font-medium text-[#7a6b6b]">Active Coupons</h3>
            <p className="mt-1 text-2xl font-semibold text-[#f5f0ee]">{ledger.summary.activeCount}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Issue Coupon Form */}
          <div className="bg-#151515 p-6 rounded-lg shadow border border-[#2a2a2a]">
            <h2 className="text-xl font-semibold mb-4 text-[#e0d6d6]">Issue New Coupon</h2>
            <form onSubmit={handleIssue} className="space-y-4">
              {issueError && <p className="text-red-600 text-sm">{issueError}</p>}
              {newCouponCode && (
                <div className="bg-green-50 p-4 rounded-md border border-green-200 text-center">
                  <p className="text-sm text-green-800 font-medium mb-1">Coupon generated successfully!</p>
                  <p className="text-3xl font-mono tracking-widest font-bold text-green-900">{newCouponCode}</p>
                  <p className="text-xs text-green-600 mt-2">Write this down and hand it to the buyer.</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">Buyer Phone Number</label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <span className="inline-flex items-center rounded-l-md border border-r-0 border-[#2a2a2a] px-3 text-[#7a6b6b] sm:text-sm bg-[#0d0d0d]">+91</span>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={issuePhone}
                    onChange={(e) => setIssuePhone(e.target.value.replace(/\D/g, ""))}
                    className="flex-1 block w-full rounded-none rounded-r-md border-[#2a2a2a] focus:border-brand-accent focus:ring-brand-accent sm:text-sm p-2 border"
                    placeholder="9876543210"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount Received (₹)</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={issueAmount}
                  onChange={(e) => setIssueAmount(Number(e.target.value))}
                  className="mt-1 block w-full rounded-md border-[#2a2a2a] focus:border-brand-accent focus:ring-brand-accent sm:text-sm p-2 border"
                />
              </div>

              <button
                type="submit"
                disabled={issuing || issuePhone.length !== 10 || issueAmount <= 0}
                className="w-full py-2 bg-brand-primary text-#151515 font-medium rounded-md hover:bg-brand-dark disabled:bg-gray-400 transition"
              >
                {issuing ? "Issuing..." : "Issue Coupon & Collect Cash"}
              </button>
            </form>
          </div>

          {/* Void/Refund Coupon Form */}
          <div className="bg-#151515 p-6 rounded-lg shadow border border-[#2a2a2a]">
            <h2 className="text-xl font-semibold mb-4 text-[#e0d6d6]">Void & Refund Coupon</h2>
            <form onSubmit={handleVoid} className="space-y-4">
              {voidError && <p className="text-red-600 text-sm">{voidError}</p>}
              {voidSuccess && <p className="text-green-600 text-sm">{voidSuccess}</p>}

              <div>
                <label className="block text-sm font-medium text-gray-700">Coupon Code</label>
                <input
                  type="text"
                  required
                  value={voidCode}
                  onChange={(e) => setVoidCode(e.target.value.toUpperCase())}
                  className="mt-1 block w-full rounded-md border-[#2a2a2a] focus:border-brand-accent focus:ring-brand-accent sm:text-sm p-2 border font-mono tracking-wider"
                  placeholder="XXXXXXXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Reason for Void</label>
                <input
                  type="text"
                  required
                  minLength={5}
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  className="mt-1 block w-full rounded-md border-[#2a2a2a] focus:border-brand-accent focus:ring-brand-accent sm:text-sm p-2 border"
                  placeholder="Requested refund, mistake, etc."
                />
              </div>

              <button
                type="submit"
                disabled={voiding || !voidCode || voidReason.length < 5}
                className="w-full py-2 bg-red-600 text-#151515 font-medium rounded-md hover:bg-red-700 disabled:bg-gray-400 transition"
              >
                {voiding ? "Voiding..." : "Void Coupon & Issue Refund"}
              </button>
            </form>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="bg-#151515 rounded-lg shadow border border-[#2a2a2a] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#2a2a2a]">
            <h2 className="text-lg font-semibold text-[#e0d6d6]">Your Recent Transactions (Ledger)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-[#0d0d0d]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#7a6b6b] uppercase tracking-wider">Coupon Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#7a6b6b] uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#7a6b6b] uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#7a6b6b] uppercase tracking-wider">Buyer Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#7a6b6b] uppercase tracking-wider">Date/Time</th>
                </tr>
              </thead>
              <tbody className="bg-#151515 divide-y divide-gray-200">
                {ledger.coupons.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-[#7a6b6b] text-sm">No transactions found in your ledger.</td>
                  </tr>
                ) : (
                  ledger.coupons.map((coupon) => (
                    <tr key={coupon.id} className="hover:bg-[#0d0d0d]">
                      <td className="px-6 py-4 #151515space-nowrap text-sm font-mono text-[#f5f0ee]">{coupon.id}</td>
                      <td className="px-6 py-4 #151515space-nowrap text-sm text-[#f5f0ee]">₹{coupon.faceValuePaise / 100}</td>
                      <td className="px-6 py-4 #151515space-nowrap text-sm">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${coupon.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 
                            coupon.status === 'REDEEMED' ? 'bg-blue-100 text-blue-800' : 
                            'bg-red-100 text-red-800'}`}>
                          {coupon.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 #151515space-nowrap text-sm text-[#7a6b6b]">{coupon.buyerPhone || "N/A"}</td>
                      <td className="px-6 py-4 #151515space-nowrap text-sm text-[#7a6b6b]">
                        {new Date(coupon.issuedAt).toLocaleString()}
                        {coupon.status === 'VOIDED' && (
                          <div className="text-xs text-red-500 mt-1">Voided: {coupon.voidReason}</div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
