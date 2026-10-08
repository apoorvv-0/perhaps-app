"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import BottomTabBar from "@/components/BottomTabBar";

export default function AdminUsersPage() {
  const { session, isLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [hubConfig, setHubConfig] = useState<any>({ colleges: [], batches: [] });

  const filteredUsers = users.filter(u => 
    `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    u.college?.toLowerCase().includes(search.toLowerCase()) ||
    u.globalRole?.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (!isLoading) {
      if (!session || (session.globalRole !== 'SUPER_ADMIN' && !session.eventRoles?.includes('ADMIN'))) router.push('/dashboard');
      else {
        fetchUsers();
        fetch('https://roviara-web.vercel.app/api/admin/config')
          .then(res => res.json())
          .then(data => setHubConfig(data))
          .catch(() => console.error("Failed to load hub config"));
      }
    }
  }, [session, isLoading, router]);

  const saveProfile = async () => {
    if (!editingUser) return;
    setSaving(editingUser.id);
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: editingUser.id, profile: editForm })
    });
    await fetchUsers();
    setEditingUser(null);
    setSaving(null);
  };

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

  const toggleAdmin = async (userId: string) => {
    setSaving(userId);
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, toggleEventRole: 'ADMIN' })
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

  if (isLoading || !session || (session.globalRole !== 'SUPER_ADMIN' && !session.eventRoles?.includes('ADMIN'))) {
    return <div className="min-h-screen bg-[#050505]" />;
  }

  return (
    <div className="min-h-screen bg-[#050505] font-inter relative pb-32 text-brand-blush selection:bg-brand-rose/30">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-[#050505] to-[#050505]" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-12 pb-6">
        <button onClick={() => router.push('/admin')} className="text-brand-taupe hover:text-brand-blush mb-6 transition flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"></path></svg>
          Back to Admin
        </button>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-brand-burgundy/50 pb-6">
          <div>
            <h1 className="font-playfair text-[32px] font-bold text-brand-blush mb-1">User Management</h1>
            <p className="text-brand-blush/40 text-sm font-mono">Manage staff and special exemptions</p>
          </div>
          <input 
            type="text" 
            placeholder="Search name, college, or role..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-brand-charcoal text-brand-blush px-4 py-2 rounded-xl border border-brand-burgundy/50 outline-none focus:border-brand-rose/50 w-full md:w-64"
          />
        </div>
        
        <div className="bg-brand-charcoal border border-brand-burgundy/50 rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-burgundy/50 text-brand-blush/40 text-xs uppercase tracking-wider font-bold">
                  <th className="p-4">Name</th>
                  <th className="p-4">College / Batch</th>
                  <th className="p-4">Global Role</th>
                  <th className="p-4">Staff Roles</th>
                  <th className="p-4">Event Registration</th>
                  <th className="p-4">Min 3 Exemption</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filteredUsers.map(u => {
                  const isCashier = u.eventRoles?.includes('CASHIER');
                  const isAdmin = u.eventRoles?.includes('ADMIN');
                  const isSuperAdmin = u.globalRole === 'SUPER_ADMIN';

                  return (
                    <tr key={u.id} className="border-b border-brand-burgundy/20 hover:bg-white/5 transition">
                      <td className="p-4 font-medium text-brand-blush whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <span>{u.firstName} {u.lastName}</span>
                          <button onClick={() => { setEditingUser(u); setEditForm(u); }} className="text-[10px] uppercase tracking-wider bg-white/5 hover:bg-white/10 px-2 py-1 rounded text-brand-taupe transition">Edit</button>
                        </div>
                      </td>
                      <td className="p-4 text-brand-taupe whitespace-nowrap">{u.college} {u.batch}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-widest ${isSuperAdmin ? 'bg-purple-500/20 text-purple-400' : 'bg-brand-wine border border-brand-burgundy/50 text-brand-taupe'}`}>
                          {u.globalRole}
                        </span>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        {isSuperAdmin ? (
                          <span className="text-brand-taupe/50 text-xs italic">Inherits All</span>
                        ) : (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => toggleCashier(u.id)}
                              disabled={saving === u.id}
                              className={`px-3 py-1.5 rounded-lg text-xs transition border ${ isCashier ? 'bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30' : 'bg-brand-wine border-brand-burgundy/50 text-brand-taupe hover:border-brand-rose/30 hover:text-brand-blush' }`}
                            >
                              {saving === u.id ? '...' : isCashier ? 'Cashier' : '+ Cashier'}
                            </button>
                            {session.globalRole === 'SUPER_ADMIN' && (
                              <button 
                                onClick={() => toggleAdmin(u.id)}
                                disabled={saving === u.id}
                                className={`px-3 py-1.5 rounded-lg text-xs transition border ${ isAdmin ? 'bg-orange-500/20 text-orange-400 border-orange-500/30 hover:bg-orange-500/30' : 'bg-brand-wine border-brand-burgundy/50 text-brand-taupe hover:border-brand-rose/30 hover:text-brand-blush' }`}
                              >
                                {saving === u.id ? '...' : isAdmin ? 'Admin' : '+ Admin'}
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-widest ${u.isRegistered ? 'bg-green-500/20 text-green-400' : 'bg-brand-wine border border-brand-burgundy/50 text-brand-taupe'}`}>
                          {u.isRegistered ? 'Registered' : 'Not Registered'}
                        </span>
                      </td>
                      <td className="p-4">
                        <button 
                          onClick={() => toggleExempt(u.id, u.minChoiceExempt)}
                          disabled={saving === u.id || !u.isRegistered}
                          className={`px-3 py-1.5 rounded-lg text-xs transition border ${
                            u.minChoiceExempt 
                              ? 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30' 
                              : 'bg-brand-wine border-brand-burgundy/50 text-brand-taupe hover:border-brand-rose/30 hover:text-brand-blush'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {saving === u.id ? '...' : u.minChoiceExempt ? 'Exempted' : 'Not Exempt'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredUsers.length === 0 && <p className="text-center text-brand-taupe p-12">No users found.</p>}
          </div>
        </div>
      </div>
      
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-brand-charcoal border border-brand-burgundy/50 p-6 rounded-[24px] w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-playfair font-bold mb-4 text-brand-blush">Edit Profile</h2>
            <div className="flex flex-col gap-3 mb-6">
              <input className="bg-transparent border border-brand-burgundy rounded-xl px-4 py-3 text-sm focus:border-brand-rose/50 outline-none transition" placeholder="First Name" value={editForm.firstName || ''} onChange={e => setEditForm({...editForm, firstName: e.target.value})} />
              <input className="bg-transparent border border-brand-burgundy rounded-xl px-4 py-3 text-sm focus:border-brand-rose/50 outline-none transition" placeholder="Last Name" value={editForm.lastName || ''} onChange={e => setEditForm({...editForm, lastName: e.target.value})} />
              <select className="bg-brand-wine border border-brand-burgundy rounded-xl px-4 py-3 text-sm focus:border-brand-rose/50 outline-none transition" value={editForm.college || ''} onChange={e => setEditForm({...editForm, college: e.target.value})}>
                <option value="">Select College</option>
                {hubConfig?.colleges?.map((c: any) => <option key={c.name || c} value={c.name || c}>{c.name || c}</option>)}
              </select>
              <select className="bg-brand-wine border border-brand-burgundy rounded-xl px-4 py-3 text-sm focus:border-brand-rose/50 outline-none transition" value={editForm.batch || ''} onChange={e => setEditForm({...editForm, batch: e.target.value})}>
                <option value="">Select Batch</option>
                {hubConfig?.batches?.map((b: any) => <option key={b} value={b}>{b}</option>)}
              </select>
              <select className="bg-brand-wine border border-brand-burgundy rounded-xl px-4 py-3 text-sm focus:border-brand-rose/50 outline-none transition" value={editForm.gender || ''} onChange={e => setEditForm({...editForm, gender: e.target.value})}>
                <option value="MALE">MALE</option>
                <option value="FEMALE">FEMALE</option>
              </select>
              <input className="bg-transparent border border-brand-burgundy rounded-xl px-4 py-3 text-sm focus:border-brand-rose/50 outline-none transition" placeholder="Instagram (optional)" value={editForm.instagramHandle || ''} onChange={e => setEditForm({...editForm, instagramHandle: e.target.value})} />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setEditingUser(null)} className="px-5 py-2.5 rounded-full text-sm font-medium border border-brand-burgundy/50 hover:bg-white/5 transition">Cancel</button>
              <button onClick={saveProfile} className="px-5 py-2.5 rounded-full text-sm font-bold bg-gradient-to-r from-brand-blush to-brand-rose text-brand-charcoal hover:scale-105 transition active:scale-95">{saving === editingUser.id ? "Saving..." : "Save Changes"}</button>
            </div>
          </div>
        </div>
      )}

      <BottomTabBar />

    </div>
  );
}
