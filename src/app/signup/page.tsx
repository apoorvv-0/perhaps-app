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

  if (isLoading || session) return <div style={{ minHeight: '100vh', background: '#260609' }} />;

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <main className="min-h-screen bg-wine text-blush flex flex-col items-center justify-center p-6 font-inter">
        <div className="fixed inset-0 bg-perhaps-hero pointer-events-none" />
        <div className="relative max-w-md w-full glass rounded-3xl p-8 shadow-perhaps-soft">
          <div className="text-center mb-8">
            <img src="/logo.jpg" alt="Perhaps" className="h-12 w-auto rounded-lg mx-auto mb-2 object-cover shadow-perhaps-glow" style={{ mixBlendMode: 'lighten' }} />
            <p className="text-xs text-taupe uppercase tracking-widest">Create your Roviara ID</p>
          </div>
          <div className="space-y-4 mb-8 bg-charcoal/40 p-4 rounded-2xl border border-rose-gold/10">
            <h2 className="text-xs font-semibold text-taupe-light uppercase tracking-wide mb-3">DPDP Compliance &amp; Consent</h2>
            <label className="flex items-start gap-3 cursor-pointer group">
              <input type="checkbox" checked={ageConsent} onChange={(e) => setAgeConsent(e.target.checked)} className="mt-1 w-4 h-4 rounded border-taupe/40 bg-charcoal/60" />
              <span className="text-sm text-blush/80 group-hover:text-blush transition leading-relaxed">I declare that I am 18 years of age or older.</span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer group">
              <input type="checkbox" checked={dataConsent} onChange={(e) => setDataConsent(e.target.checked)} className="mt-1 w-4 h-4 rounded border-taupe/40 bg-charcoal/60" />
              <span className="text-sm text-blush/80 group-hover:text-blush transition leading-relaxed">I consent to the collection and processing of my personal data (Name, Email, Google ID) by Roviara for identity verification, strictly under the Digital Personal Data Protection Act.</span>
            </label>
          </div>
          <div className="flex flex-col items-center gap-4">
            {error && <p className="text-sm text-rose-gold bg-burgundy/20 p-3 rounded-2xl border border-burgundy/30 w-full text-center">{error}</p>}
            {loading && <p className="text-sm text-taupe">Signing you in...</p>}
            <div className={`transition-all duration-300 ${ageConsent && dataConsent ? 'opacity-100' : 'opacity-40 grayscale pointer-events-none'}`}>
              <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError("Google Login Failed")} useOneTap={false} />
            </div>
            {!(ageConsent && dataConsent) && <p className="text-xs text-taupe text-center">Accept both terms above to continue.</p>}
          </div>
          <div className="mt-6 text-center">
            <a href="/" className="text-xs text-taupe hover:text-rose-gold transition">← Back to Perhaps</a>
          </div>
        </div>
      </main>
    </GoogleOAuthProvider>
  );
}
