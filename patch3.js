const fs = require('fs');

// M-22: src/app/api/profile/route.ts - Remove blocking phase check
let apiProfile = fs.readFileSync('src/app/api/profile/route.ts', 'utf8');
apiProfile = apiProfile.replace(/const event = await getActiveEvent\(\);\s*if \(event && !\["DRAFT", "REGISTRATION_OPEN"\]\.includes\(event\.status\)\) \{\s*return NextResponse\.json\([\s\S]*?\{\s*status:\s*403\s*\}\s*\);\s*\}/, "const event = await getActiveEvent();\n  // Phase check removed for M-22 - only gender/college are frozen in upsert");
fs.writeFileSync('src/app/api/profile/route.ts', apiProfile);
console.log('Done M-22');

// M-15: src/app/admin/users/page.tsx
const adminUsersCode = `"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";

export default function AdminUsersPage() {
  const { session, isLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    if (!isLoading) {
      if (!session || session.globalRole !== 'SUPER_ADMIN') router.push('/');
      else {
        fetch('/api/admin/users').then(res => res.json()).then(data => setUsers(data.users || []));
      }
    }
  }, [session, isLoading, router]);

  if (isLoading || !session || session.globalRole !== 'SUPER_ADMIN') return <div style={{ minHeight: '100vh', background: '#0d0d0d' }} />;

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d0d', color: '#f5f0ee', padding: 24 }}>
      <button onClick={() => router.push('/admin')} style={{ background: 'none', border: 'none', color: '#7a6b6b', cursor: 'pointer', marginBottom: 24 }}>&larr; Back to Admin</button>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>User Management</h1>
      <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #2a2a2a', color: '#7a6b6b' }}>
            <th style={{ padding: 12 }}>Name</th>
            <th style={{ padding: 12 }}>Phone</th>
            <th style={{ padding: 12 }}>Role</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
              <td style={{ padding: 12 }}>{u.profile ? \`\${u.profile.firstName} \${u.profile.lastName}\` : 'No Profile'}</td>
              <td style={{ padding: 12 }}>{u.phoneNumber}</td>
              <td style={{ padding: 12 }}>{u.globalRole}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
`;
fs.mkdirSync('src/app/admin/users', { recursive: true });
fs.writeFileSync('src/app/admin/users/page.tsx', adminUsersCode);
console.log('Done M-15');

// H-7 & L-6: src/app/leaderboard/page.tsx
const leaderboardCode = `"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import BottomTabBar from "@/components/BottomTabBar";

interface LeaderboardEntry {
  id: string;
  userId: string;
  gender: "MALE" | "FEMALE";
  college: string;
  batch: string;
  pickerCount: number;
  rank: number;
  slice: string;
  user: {
    profile: {
      firstName: string;
      lastName: string;
      instagramHandle: string;
    };
  };
}

export default function LeaderboardPage() {
  const { session, isLoading } = useAuth();
  const router = useRouter();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!session) router.push("/");
      else fetchLeaderboard();
    }
  }, [session, isLoading, router]);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch("/api/leaderboard");
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || !session) return null;

  const renderTop3 = (slice: string, gender: "MALE" | "FEMALE", title: string) => {
    const list = entries.filter(e => e.slice === slice && e.gender === gender).sort((a, b) => a.rank - b.rank);
    if (list.length === 0) return null;

    return (
      <div style={{ background: '#151515', border: '1px solid #2a2a2a', borderRadius: 12, padding: 24 }}>
        <h3 style={{ fontSize: 20, fontWeight: 'bold', color: '#f5f0ee', marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid #2a2a2a' }}>{title}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {list.map(e => (
            <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 12, borderRadius: 8 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 18,
                ...(e.rank === 1 ? { background: '#8b1a1a', color: '#f5f0ee' } : 
                    e.rank === 2 ? { background: '#3d1515', color: '#c9a0a0' } : 
                                   { background: '#1e1010', color: '#7a6b6b' })
              }}>
                #{e.rank}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, color: '#f5f0ee' }}>{e.user.profile.firstName} {e.user.profile.lastName}</p>
                <p style={{ fontSize: 12, color: '#7a6b6b' }}>{e.college} • {e.batch}</p>
              </div>
              <div style={{ color: '#7a6b6b', fontSize: 14, fontWeight: 500 }}>
                @{e.user.profile.instagramHandle}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d0d', color: '#f5f0ee', paddingBottom: 80 }}>
      <nav style={{ background: '#151515', borderBottom: '1px solid #2a2a2a' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', height: 64, alignItems: 'center' }}>
            <Link href="/dashboard" style={{ fontSize: 20, fontWeight: 'bold', color: '#f5f0ee' }}>Perhaps</Link>
            <Link href="/dashboard" style={{ fontSize: 14, color: '#7a6b6b' }}>Back to Dashboard</Link>
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 16px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: '#f5f0ee', letterSpacing: '-0.02em' }}>The Most Wanted</h1>
          <p style={{ marginTop: 16, fontSize: 18, color: '#7a6b6b', maxWidth: 600, margin: '16px auto 0' }}>
            These are the most highly requested participants of the season. Did you make the cut?
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <p style={{ color: '#7a6b6b' }}>Calculating hype...</p>
          </div>
        ) : error && entries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', background: '#151515', borderRadius: 12, border: '1px solid #2a2a2a' }}>
             <p style={{ color: '#dc2626' }}>Failed to load leaderboard.</p>
          </div>
        ) : entries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', background: '#151515', borderRadius: 12, border: '1px solid #2a2a2a' }}>
            <span style={{ fontSize: 36 }}>🤫</span>
            <h3 style={{ marginTop: 16, fontSize: 18, fontWeight: 500, color: '#f5f0ee' }}>Leaderboard is under wraps</h3>
            <p style={{ color: '#7a6b6b', marginTop: 8 }}>Check back after the Choosing phase is closed!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
            <section>
              <h2 style={{ fontSize: 24, fontWeight: 'bold', color: '#f5f0ee', marginBottom: 24, paddingLeft: 8, borderLeft: '4px solid #8b1a1a' }}>Overall Top 3</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32 }}>
                {renderTop3("overall", "FEMALE", "Most Wanted Girls")}
                {renderTop3("overall", "MALE", "Most Wanted Boys")}
              </div>
            </section>
          </div>
        )}
      </main>
      <BottomTabBar />
    </div>
  );
}
`;
fs.writeFileSync('src/app/leaderboard/page.tsx', leaderboardCode);
console.log('Done H-7, L-6');

// M-7 to M-10: src/app/verify-phone/page.tsx
const verifyPhoneCode = `"use client";

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
                  onChange={(e) => setPhone(e.target.value.replace(/\\D/g, ""))}
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
                onChange={(e) => setOtp(e.target.value.replace(/\\D/g, ""))}
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
`;
fs.writeFileSync('src/app/verify-phone/page.tsx', verifyPhoneCode);
console.log('Done M-7 to M-10');
