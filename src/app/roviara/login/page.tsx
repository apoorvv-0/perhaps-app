"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/components/AuthProvider";

export default function RoviaraLogin() {
  const { session, isLoading, refreshSession } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  useEffect(() => {
    if (!isLoading && session) {
      if (session.globalRole === "SUPER_ADMIN") {
        router.push("/roviara");
      } else {
        setError("Unauthorized: This portal is for Roviara Staff only.");
      }
    }
  }, [session, isLoading, router]);

  const handleGoogleSuccess = async (credentialResponse: any) => {
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
    } catch (err) {
      setError("Network error during authentication");
    }
  };

  if (isLoading) return null;

  return (
    <GoogleOAuthProvider clientId={clientId || "dummy"}>
      <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', background: '#050505' }}>
        <div className="glass-card fade-in" style={{ maxWidth: '400px', width: '100%', textAlign: 'center', padding: '40px 32px' }}>
          
          <h1 style={{ fontSize: '28px', color: '#f5f0ee', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '8px' }}>ROVIARA</h1>
          <p style={{ fontSize: '13px', color: '#7a6b6b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '40px' }}>
            Staff Command Center
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            {clientId ? (
              <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError("Google Login Failed")}
                  useOneTap
                />
              </div>
            ) : (
              <div style={{ background: '#1e1e1e', border: '1px solid #5c1a1a', padding: '16px', borderRadius: '8px', color: '#c9a0a0', fontSize: '12px' }}>
                Missing Google Client ID. Cannot authenticate.
              </div>
            )}

            {error && <p style={{ color: '#dc2626', fontSize: '13px', marginTop: '16px', padding: '12px', background: 'rgba(220, 38, 38, 0.1)', borderRadius: '8px', border: '1px solid rgba(220, 38, 38, 0.3)' }}>{error}</p>}
          </div>

        </div>
      </main>
    </GoogleOAuthProvider>
  );
}
