"use client";
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
              <td style={{ padding: 12 }}>{u.profile ? `${u.profile.firstName} ${u.profile.lastName}` : 'No Profile'}</td>
              <td style={{ padding: 12 }}>{u.phoneNumber}</td>
              <td style={{ padding: 12 }}>{u.globalRole}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
