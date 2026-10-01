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
    <div className="flex min-h-screen items-center justify-center bg-[#0d0d0d] text-[#f5f0ee] p-4">
      <div className="w-full max-w-md bg-[#151515] border border-[#2a2a2a] rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-6 text-center text-white">
          Verify Your Phone
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        {step === "PHONE" && (
          <form onSubmit={requestOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#7a6b6b]">
                10-Digit Mobile Number
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 px-3 text-[#7a6b6b] sm:text-sm">
                  +91
                </span>
                <input
                  type="text"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  className="block w-full flex-1 rounded-none rounded-r-md border-gray-300 focus:border-brand-accent focus:ring-brand-accent sm:text-sm p-2 border"
                  placeholder="9876543210"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || phone.length !== 10}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#8b1a1a] hover:bg-[#6e1515] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent disabled:bg-brand-accent"
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        )}

        {step === "OTP" && (
          <form onSubmit={verifyOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#7a6b6b]">
                Enter 6-digit OTP sent to {phone}
              </label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="mt-1 block w-full rounded-md border-gray-300 focus:border-brand-accent focus:ring-brand-accent sm:text-sm p-2 border text-center text-lg tracking-widest font-mono"
                placeholder="000000"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-400"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
            <button
              type="button"
              onClick={() => setStep("PHONE")}
              className="w-full text-sm text-brand-primary hover:text-brand-accent"
            >
              Change phone number
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={logout}
            className="text-sm text-[#7a6b6b] hover:text-white underline"
          >
            Logout / Start Over
          </button>
        </div>
      </div>
    </div>
  );
}
