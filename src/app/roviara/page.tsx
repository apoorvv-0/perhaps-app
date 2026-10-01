"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";

export default function RoviaraHub() {
  const { session, isLoading } = useAuth();
  const router = useRouter();
  
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (!isLoading) {
      if (!session || session.globalRole !== "SUPER_ADMIN") {
        router.push("/dashboard");
      } else {
        // Fetch stats
        fetch("/api/admin/stats").then(res => res.json()).then(setStats).catch(console.error);
      }
    }
  }, [session, isLoading, router]);

  if (isLoading || !session) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d0d', padding: '48px 24px', paddingBottom: '80px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <Link href="/dashboard" style={{ color: '#7a6b6b', textDecoration: 'none', fontSize: '14px', marginBottom: '8px', display: 'inline-block' }}>
              &larr; Back to Dashboard
            </Link>
            <h1 className="serif" style={{ fontSize: '32px', color: '#f5f0ee' }}>Roviara Hub</h1>
            <p style={{ color: '#7a6b6b', fontSize: '14px' }}>Global Command Center</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          
          {/* Events */}
          <div style={{ background: "rgba(20,20,20,0.6)", borderRadius: '12px', padding: '24px' }}>
            <h2 className="serif" style={{ fontSize: '20px', color: '#f5f0ee', marginBottom: '16px' }}>Active Events</h2>
            {stats?.eventName ? (
              <div style={{ padding: '12px', background: '#1e1e1e', borderRadius: '8px', borderLeft: '3px solid #8b1a1a' }}>
                <p style={{ color: '#f5f0ee', fontWeight: 500 }}>{stats.eventName}</p>
                <p style={{ color: '#7a6b6b', fontSize: '12px', marginTop: '4px' }}>Phase: {stats.eventPhase}</p>
              </div>
            ) : (
              <p style={{ color: '#7a6b6b', fontSize: '13px' }}>Loading event...</p>
            )}
            <button style={{ marginTop: '16px', background: 'transparent', border: '1px solid #5c1a1a', color: '#c9a0a0', padding: '10px', borderRadius: '8px', width: '100%', cursor: 'not-allowed', opacity: 0.5 }}>
              Create New Event
            </button>
          </div>

          {/* Live Stats */}
          <div style={{ background: "rgba(20,20,20,0.6)", borderRadius: '12px', padding: '24px' }}>
            <h2 className="serif" style={{ fontSize: '20px', color: '#f5f0ee', marginBottom: '16px' }}>Live Stats</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <p style={{ color: '#7a6b6b', fontSize: '11px', textTransform: 'uppercase' }}>Registrations</p>
                <p style={{ color: '#f5f0ee', fontSize: '24px', fontWeight: 600 }}>{stats?.registrationCount ?? '--'}</p>
              </div>
              <div>
                <p style={{ color: '#7a6b6b', fontSize: '11px', textTransform: 'uppercase' }}>Choices Made</p>
                <p style={{ color: '#f5f0ee', fontSize: '24px', fontWeight: 600 }}>{stats?.choicesCount ?? '--'}</p>
              </div>
            </div>
          </div>

          {/* User Management */}
          <Link href="/admin/users" style={{ background: "rgba(20,20,20,0.6)", borderRadius: '12px', padding: '24px', textDecoration: 'none', display: 'block' }}>
            <h2 className="serif" style={{ fontSize: '20px', color: '#f5f0ee', marginBottom: '8px' }}>User Management</h2>
            <p style={{ color: '#7a6b6b', fontSize: '13px' }}>View all global users, edit roles, suspend accounts.</p>
          </Link>

          {/* Financial Ledger */}
          <div style={{ background: "rgba(20,20,20,0.6)", borderRadius: '12px', padding: '24px', opacity: 0.7 }}>
            <h2 className="serif" style={{ fontSize: '20px', color: '#f5f0ee', marginBottom: '8px' }}>Financial Ledger</h2>
            <p style={{ color: '#7a6b6b', fontSize: '13px' }}>Cross-event coupon revenue and analytics. (Coming Soon)</p>
          </div>

        </div>

      </div>
    </div>
  );
}
