"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/components/AuthProvider";

export default function SignupPage() {
  const { session, isLoading, refreshSession } = useAuth();
  const router = useRouter();
  const [ageConsent, setAgeConsent] = useState(false);
  const [dataConsent, setDataConsent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const clientId = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "").trim();

  useEffect(() => {
    if (!isLoading && session) {
      router.push(session.profileComplete ? '/dashboard' : '/profile');
    }
  }, [session, isLoading, router]);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!ageConsent || !dataConsent) {
      setError("You must accept both terms above to continue.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/google/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: credentialResponse.credential, ageConsent, dataConsent }),
      });
      if (res.ok) {
        await refreshSession();
      } else {
        const data = await res.json();
        setError(data.error || "Authentication failed");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || session) return <div style={{ minHeight: '100vh', background: '#09090b' }} />;

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <main className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col items-center justify-center p-6 font-inter relative">
        {/* Subtle background glow */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-rose-900/10 via-zinc-950/0 to-zinc-950/0" />

        <div className="relative max-w-md w-full bg-zinc-900/40 backdrop-blur-xl rounded-[32px] p-8 sm:p-10 border border-white/5 shadow-2xl animate-fade-up">
          
          {/* Header */}
          <div className="text-center mb-10">
            <img 
              src="/logo.png" 
              alt="Perhaps" 
              className="h-10 w-auto mx-auto mb-6 opacity-90" 
              style={{ filter: "invert(1) drop-shadow(0 0 10px rgba(159,18,57,0.3))" }} 
            />
            <h1 className="font-playfair text-2xl mb-2">Create your Roviara ID</h1>
            <p className="text-sm text-zinc-400">One secure identity for all Perhaps events.</p>
          </div>

          {/* Consent section */}
          <div className="space-y-5 mb-10 bg-zinc-950/50 p-5 rounded-2xl border border-white/5">
            <h2 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">DPDP Consent</h2>
            
            <label className="flex items-start gap-4 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={ageConsent} 
                onChange={(e) => setAgeConsent(e.target.checked)} 
                className="mt-1 w-5 h-5 rounded border-zinc-700 bg-zinc-900 accent-rose-700" 
              />
              <span className="text-sm text-zinc-400 group-hover:text-zinc-200 transition leading-relaxed">
                I declare that I am 18 years of age or older.
              </span>
            </label>
            
            <label className="flex items-start gap-4 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={dataConsent} 
                onChange={(e) => setDataConsent(e.target.checked)} 
                className="mt-1 w-5 h-5 rounded border-zinc-700 bg-zinc-900 accent-rose-700" 
              />
              <span className="text-sm text-zinc-400 group-hover:text-zinc-200 transition leading-relaxed">
                I consent to the collection and processing of my personal data (Name, Email, Google ID) strictly under the Digital Personal Data Protection Act.
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex flex-col items-center gap-4">
            {error && (
              <div className="text-sm text-rose-400 bg-rose-950/30 px-4 py-3 rounded-xl border border-rose-900/50 w-full text-center">
                {error}
              </div>
            )}
            
            {loading && <p className="text-sm text-zinc-500 animate-pulse">Authenticating...</p>}
            
            <div className={`transition-all duration-300 w-full flex justify-center ${ageConsent && dataConsent ? 'opacity-100' : 'opacity-40 grayscale pointer-events-none'}`}>
              <GoogleLogin 
                onSuccess={handleGoogleSuccess} 
                onError={() => setError("Google Login Failed")} 
                useOneTap={false} 
                theme="filled_black"
                shape="pill"
              />
            </div>

            {!(ageConsent && dataConsent) && (
              <p className="text-xs text-zinc-500 text-center mt-2">
                Accept both terms above to unlock login.
              </p>
            )}
          </div>

          <div className="mt-8 text-center">
            <a href="/" className="text-xs text-zinc-500 hover:text-zinc-300 transition">← Back to home</a>
          </div>
        </div>
      </main>
    </GoogleOAuthProvider>
  );
}
