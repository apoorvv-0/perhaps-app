"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/components/AuthProvider";

export default function LandingPage() {
  const { session, isLoading, refreshSession } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
  const isDev = process.env.NODE_ENV === "development";

  useEffect(() => {
    if (!isLoading && session) {
      if (!session.phoneVerified) {
        router.push("/verify-phone");
      } else if (!session.profileComplete) {
        router.push("/profile");
      } else {
        router.push("/dashboard");
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
        setError(data.error || "Google authentication failed");
      }
    } catch (err) {
      setError("Network error during authentication");
    }
  };

  const handleDevLogin = async (testId: string) => {
    try {
      const res = await fetch("/api/auth/dev-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testId }),
      });
      if (res.ok) {
        await refreshSession();
      }
    } catch (err) {
      setError("Dev login failed");
    }
  };

  if (isLoading) return null;

  return (
    <GoogleOAuthProvider clientId={clientId || "dummy-client-id-so-it-doesnt-crash"}>
      <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
          <h1 className="serif gradient-text fade-in" style={{ fontSize: "84px", fontStyle: 'italic', marginBottom: '8px' }}>Perhaps</h1>
          <p style={{ fontSize: '14px', color: '#7a6b6b', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '32px' }}>
            Find your mutual match
          </p>
          <div style={{ height: '1px', width: '60px', background: '#2a2a2a', margin: '0 auto 48px' }}></div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            {clientId ? (
              <div className="glass-card" style={{ padding: "32px", width: "100%" }}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError("Google Login Failed")}
                  useOneTap
                />
              </div>
            ) : (
              <div style={{ background: '#1e1e1e', border: '1px solid #5c1a1a', padding: '16px', borderRadius: '8px', color: '#c9a0a0', fontSize: '12px' }}>
                Missing Google Client ID. Dev mode active.
              </div>
            )}

            {error && <p style={{ color: '#dc2626', fontSize: '14px', marginTop: '16px' }}>{error}</p>}

            {isDev && (
              <div style={{ marginTop: '64px', width: '100%' }}>
                <p style={{ color: '#3d3030', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Development Access</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button onClick={() => handleDevLogin("student-male-1")}
                    style={{ background: '#1e1e1e', border: '1px solid #2a2a2a', color: '#7a6b6b', padding: '12px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseOver={(e) => { e.currentTarget.style.borderColor = '#5c1a1a'; e.currentTarget.style.color = '#c9a0a0'; }}
                    onMouseOut={(e) => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#7a6b6b'; }}>
                    Continue as Male Student
                  </button>
                  <button onClick={() => handleDevLogin("student-female-2")}
                    style={{ background: '#1e1e1e', border: '1px solid #2a2a2a', color: '#7a6b6b', padding: '12px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseOver={(e) => { e.currentTarget.style.borderColor = '#5c1a1a'; e.currentTarget.style.color = '#c9a0a0'; }}
                    onMouseOut={(e) => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#7a6b6b'; }}>
                    Continue as Female Student
                  </button>
                  <button onClick={() => handleDevLogin("admin1")}
                    style={{ background: '#1e1e1e', border: '1px solid #2a2a2a', color: '#7a6b6b', padding: '12px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseOver={(e) => { e.currentTarget.style.borderColor = '#5c1a1a'; e.currentTarget.style.color = '#c9a0a0'; }}
                    onMouseOut={(e) => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#7a6b6b'; }}>
                    Continue as Admin
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </GoogleOAuthProvider>
  );
}
