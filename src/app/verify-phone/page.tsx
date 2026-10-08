"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { app, auth } from "@/lib/firebase/client";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import LoadingScreen from "@/components/LoadingScreen";

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}

export default function VerifyPhone() {
  const { session, isLoading } = useAuth();
  const router = useRouter();
  
  const [phoneNumber, setPhoneNumber] = useState("+91");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  
  const confirmationResult = useRef<ConfirmationResult | null>(null);

  useEffect(() => {
    if (!isLoading) {
      if (!session) {
        router.push("/");
      } else if (session.phoneVerified) {
        router.push(session.profileComplete ? "/dashboard" : "/profile");
      }
    }
  }, [session, isLoading, router]);

  useEffect(() => {
    // Cooldown timer logic
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const initRecaptcha = () => {
    if (typeof window !== "undefined" && !window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
          size: "invisible",
        });
      } catch (e) {
        console.error("Recaptcha Init Error", e);
      }
    }
    return window.recaptchaVerifier;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown > 0) return;
    
    setError("");
    setLoading(true);
    
    try {
      const appVerifier = initRecaptcha();
      const result = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      confirmationResult.current = result;
      setStep("otp");
      setCooldown(60); // 60 seconds rate limit
    } catch (err: any) {
      console.error(err);
      
      // Reset reCAPTCHA if it failed so they can try again
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
      
      if (err.code === "auth/too-many-requests") {
        setError("Too many attempts. Google has temporarily blocked this device. Please wait a few minutes.");
      } else if (err.code === "auth/invalid-phone-number") {
        setError("Invalid phone number format. Please ensure it starts with +91.");
      } else {
        setError(err.message || "Failed to send OTP. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      if (!confirmationResult.current) throw new Error("No OTP request found.");
      
      const result = await confirmationResult.current.confirm(otp);
      const user = result.user;
      const idToken = await user.getIdToken();
      
      // Send token to backend to finalize verification
      const res = await fetch("/api/auth/phone-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to sync verification with server.");
      
      // Redirect to profile or dashboard
      router.push(session?.profileComplete ? "/dashboard" : "/profile");
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Invalid OTP.");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || !session) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-brand-wine flex flex-col items-center justify-center p-8 text-brand-blush">
      <div className="w-full max-w-sm bg-brand-charcoal/80 p-8 rounded-3xl border border-brand-burgundy/50 shadow-2xl relative">
        <h1 className="font-playfair text-3xl font-normal text-center mb-2 italic">Verify Phone</h1>
        <p className="text-brand-taupe/80 text-center text-sm mb-8 font-light leading-relaxed">
          {step === "phone" ? "Enter your phone number to receive a secure code." : "Enter the code sent to your phone."}
        </p>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-sm mb-6 text-center">
            {error}
          </div>
        )}

        <div id="recaptcha-container"></div>

        {step === "phone" ? (
          <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
            <input
              type="tel"
              placeholder="+919876543210"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full bg-brand-wine/50 border border-brand-burgundy text-brand-blush px-5 py-4 rounded-[16px] outline-none focus:border-brand-rose/50 transition-colors font-mono tracking-wider text-center"
              required
            />
            <button
              type="submit"
              disabled={loading || cooldown > 0}
              className="w-full py-4 mt-2 bg-brand-blush text-brand-wine font-bold rounded-[16px] uppercase tracking-widest text-xs shadow-[0_4px_14px_rgba(232,180,165,0.25)] hover:bg-brand-rose transition-colors disabled:opacity-50"
            >
              {loading ? "Sending..." : cooldown > 0 ? `Try again in ${cooldown}s` : "Send OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full bg-brand-wine/50 border border-brand-burgundy text-brand-blush px-5 py-4 rounded-[16px] outline-none focus:border-brand-rose/50 transition-colors font-mono tracking-[0.5em] text-center text-lg"
              maxLength={6}
              required
            />
            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="w-full py-4 mt-2 bg-brand-rose text-brand-wine font-bold rounded-[16px] uppercase tracking-widest text-xs shadow-[0_4px_14px_rgba(232,180,165,0.25)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify Code"}
            </button>
            <button
              type="button"
              onClick={() => setStep("phone")}
              className="text-brand-taupe text-xs mt-2 hover:text-brand-blush transition-colors"
            >
              Change Phone Number
            </button>
          </form>
        )}
        
        <div className="mt-8 text-center">
          <button
            onClick={useAuth().logout}
            className="text-brand-taupe/50 hover:text-red-400 text-xs transition-colors"
          >
            Log out / Switch Account
          </button>
        </div>
      </div>
    </div>
  );
}
