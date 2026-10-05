"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";

export default function AdminUsersPage() {
  const { session, isLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState<string | null>(null);

  const filteredUsers = users.filter(u => 
    `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    u.college?.toLowerCase().includes(search.toLowerCase()) ||
    u.globalRole?.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (!isLoading) {
      if (!session || session.globalRole !== 'SUPER_ADMIN') router.push('/');
      else fetchUsers();
    }
  }, [session, isLoading, router]);

  const fetchUsers = async () => {
    const res = await fetch('/api/admin/users');
    const data = await res.json();
    setUsers(data.users || []);
  };

  const toggleExempt = async (userId: string, currentVal: boolean) => {
    setSaving(userId);
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, minChoiceExempt: !currentVal })
    });
    await fetchUsers();
    setSaving(null);
  };

  const toggleCashier = async (userId: string) => {
    setSaving(userId);
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, toggleEventRole: 'CASHIER' })
    });
    await fetchUsers();
    setSaving(null);
  };

  if (isLoading || !session || session.globalRole !== 'SUPER_ADMIN') return <div style={{ minHeight: '100vh', background: '#0d0d0d' }} />;

  return (
    <div className="min-h-screen bg-[#2B0609] text-[#F9F0EE] p-6 font-inter">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => router.push('/admin')} className="text-[#A3918D] hover:text-[#F9F0EE] mb-6 transition">&larr; Back to Admin</button>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <h1 className="font-playfair text-3xl">Team & User Management</h1>
          <input 
            type="text" 
            placeholder="Search name, college, or role..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#4A1519] text-[#F9F0EE] px-4 py-2 rounded-lg border border-[#6b2327] outline-none focus:border-[#E08F83] w-full sm:w-64"
          />
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#4A1519] text-[#A3918D] text-sm">
                <th className="p-4">Name</th>
                <th className="p-4">College / Batch</th>
                <th className="p-4">Global Role</th>
                <th className="p-4">Cashier Status</th>
                <th className="p-4">Min 3 Exemption</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => {
                const isCashier = u.eventRoles?.includes('CASHIER');
                return (
                  <tr key={u.id} className="border-b border-[#4A1519] hover:bg-[#3d0f12] transition">
                    <td className="p-4 font-medium">{u.firstName} {u.lastName}</td>
                    <td className="p-4 text-[#A3918D]">{u.college} {u.batch}</td>
                    <td className="p-4">{u.globalRole}</td>
                    <td className="p-4">
                      {u.globalRole === 'SUPER_ADMIN' ? (
                        <span className="text-[#A3918D] text-sm">Super Admin</span>
                      ) : (
                        <button 
                          onClick={() => toggleCashier(u.id)}
                          disabled={saving === u.id}
                          className={`px-3 py-1 rounded text-sm transition ${
                            isCashier 
                              ? 'bg-blue-900 text-blue-200 hover:bg-blue-800' 
                              : 'bg-[#4A1519] text-[#E08F83] hover:bg-[#6b2327]'
                          }`}
                        >
                          {saving === u.id ? 'Saving...' : isCashier ? 'Revoke Cashier' : 'Make Cashier'}
                        </button>
                      )}
                    </td>
                    <td className="p-4">
                      <button 
                        onClick={() => toggleExempt(u.id, u.minChoiceExempt)}
                        disabled={saving === u.id}
                        className={`px-3 py-1 rounded text-sm transition ${
                          u.minChoiceExempt 
                            ? 'bg-[#E08F83] text-[#2B0609] hover:bg-[#F9F0EE]' 
                            : 'bg-[#4A1519] text-[#E08F83] hover:bg-[#6b2327]'
                        }`}
                      >
                        {saving === u.id ? 'Saving...' : u.minChoiceExempt ? 'Exempted' : 'Not Exempt'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
