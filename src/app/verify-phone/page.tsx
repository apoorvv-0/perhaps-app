"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function VerifyPhonePage() {
  const { session, isLoading, refreshSession, logout } = useAuth();
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"PHONE" | "OTP">("PHONE");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!session) {
        router.push("/");
      } else if (session.phoneVerified) {
        router.push(session.profileComplete ? "/dashboard" : "/profile");
      }
    }
  }, [session, isLoading, router]);

  const requestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();

      if (res.ok) {
        setStep("OTP");
      } else {
        setError(data.error || "Failed to send OTP");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await res.json();

      if (res.ok) {
        await refreshSession(); // This will trigger the useEffect redirect
      } else {
        setError(data.error || "Invalid OTP");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || !session) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d0d', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#151515', border: '1px solid #2a2a2a', borderRadius: 12, padding: 32, width: '100%', maxWidth: 400 }}>
        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, color: '#f5f0ee', textAlign: 'center', marginBottom: 24 }}>
          Verify Your Phone
        </h2>

        {error && (
          <div style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', color: '#dc2626', borderRadius: 8, padding: 12, fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {step === "PHONE" && (
          <form onSubmit={requestOtp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, color: '#7a6b6b', marginBottom: 8, display: 'block' }}>
                10-Digit Mobile Number
              </label>
              <div style={{ display: 'flex' }}>
                <span style={{ background: '#1e1e1e', border: '1px solid #2a2a2a', borderRight: 'none', color: '#7a6b6b', padding: '0 12px', display: 'flex', alignItems: 'center', borderRadius: '8px 0 0 8px' }}>
                  +91
                </span>
                <input
                  type="text"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  style={{ background: '#1e1e1e', border: '1px solid #2a2a2a', color: '#f5f0ee', borderRadius: '0 8px 8px 0', padding: 12, width: '100%', outline: 'none' }}
                  placeholder="9876543210"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || phone.length !== 10}
              style={{ width: '100%', padding: 12, background: '#8b1a1a', color: '#f5f0ee', border: 'none', borderRadius: 8, fontWeight: 600, cursor: (loading || phone.length !== 10) ? 'not-allowed' : 'pointer', opacity: (loading || phone.length !== 10) ? 0.7 : 1 }}
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        )}

        {step === "OTP" && (
          <form onSubmit={verifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, color: '#7a6b6b', marginBottom: 8, display: 'block' }}>
                Enter 6-digit OTP sent to {phone}
              </label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                style={{ background: '#1e1e1e', border: '1px solid #2a2a2a', color: '#f5f0ee', borderRadius: 8, padding: 12, textAlign: 'center', fontSize: 20, letterSpacing: '0.3em', width: '100%', outline: 'none' }}
                placeholder="000000"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              style={{ width: '100%', padding: 12, background: '#8b1a1a', color: '#f5f0ee', border: 'none', borderRadius: 8, fontWeight: 600, cursor: (loading || otp.length !== 6) ? 'not-allowed' : 'pointer', opacity: (loading || otp.length !== 6) ? 0.7 : 1 }}
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
            <button
              type="button"
              onClick={() => setStep("PHONE")}
              style={{ width: '100%', padding: 12, background: 'none', color: '#7a6b6b', border: 'none', cursor: 'pointer', fontSize: 14 }}
            >
              Change phone number
            </button>
          </form>
        )}

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <button
            onClick={logout}
            style={{ background: 'none', border: 'none', color: '#7a6b6b', cursor: 'pointer', fontSize: 14, textDecoration: 'underline' }}
          >
            Logout / Start Over
          </button>
        </div>
      </div>
    </div>
  );
}
