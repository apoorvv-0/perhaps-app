"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/components/AuthProvider";

export default function LoginPage() {
  const { session, isLoading, refreshSession } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const clientId = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "").trim();

  useEffect(() => {
    if (!isLoading && session) {
      router.push(session.profileComplete ? '/dashboard' : '/profile');
    }
  }, [session, isLoading, router]);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/google/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: credentialResponse.credential }),
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

  if (isLoading || session) return <div style={{ minHeight: '100vh', background: '#2B0609' }} />;

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <main className="min-h-screen bg-brand-wine text-brand-blush flex flex-col items-center justify-center p-6 font-inter relative">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-burgundy/40 via-brand-wine/0 to-brand-wine/0" />

        <div className="relative max-w-md w-full bg-brand-charcoal/90 backdrop-blur-xl rounded-[24px] p-8 sm:p-10 border border-brand-rose/10 shadow-premium animate-fade-up">
          
          {/* Header */}
          <div className="text-center mb-10">
            <img 
              src="/logo.png" 
              alt="Perhaps" 
              className="h-8 w-auto mx-auto mb-6 opacity-90" 
              style={{ filter: "drop-shadow(0 4px 20px rgba(90, 13, 20, 0.4))" }} 
            />
            <h1 className="font-playfair text-[24px] mb-2 text-brand-blush">Sign In to Roviara ID</h1>
            <p className="text-sm text-brand-taupe">One secure identity for all Perhaps events.</p>
          </div>

          {/* Actions */}
          <div className="flex flex-col items-center gap-4">
            {error && (
              <div className="text-sm text-red-300 bg-red-950/30 px-4 py-3 rounded-xl border border-red-900/50 w-full text-center">
                {error}
              </div>
            )}
            
            {loading && <p className="text-sm text-brand-taupe animate-pulse">Authenticating...</p>}
            
            <div className="transition-all duration-300 w-full flex justify-center opacity-100">
              <GoogleLogin 
                onSuccess={handleGoogleSuccess} 
                onError={() => setError("Google Login Failed")} 
                useOneTap={false} 
                theme="filled_black"
                shape="pill"
              />
            </div>

            <p className="text-xs text-brand-taupe text-center mt-6">
              Don't have an account? <a href="/signup" className="text-brand-blush hover:underline">Register here</a>
            </p>
          </div>

          <div className="mt-8 text-center">
            <a href="/" className="text-xs text-brand-taupe hover:text-brand-blush transition">← Back to home</a>
          </div>
        </div>
      </main>
    </GoogleOAuthProvider>
  );
}
