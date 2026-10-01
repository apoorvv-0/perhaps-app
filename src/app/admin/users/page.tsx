"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

type User = {
  id: string;
  googleId: string;
  phoneNumber: string;
  role: "STUDENT" | "CASHIER" | "ADMIN" | "SUPER_ADMIN";
  status: "ACTIVE" | "SUSPENDED";
  createdAt: string;
  profile: {
    firstName: string;
    lastName: string;
    college: string;
    batch: string;
    gender: string;
    instagramHandle: string;
  } | null;
};

const ROLE_COLORS: Record<string, string> = {
  STUDENT: "bg-gray-100 text-gray-700",
  CASHIER: "bg-green-100 text-green-700",
  ADMIN: "bg-red-100 text-red-700",
  SUPER_ADMIN: "bg-purple-100 text-purple-700",
};

export default function AdminUsersPage() {
  const { session, isLoading } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!isLoading) {
      if (!session || session.globalRole !== "SUPER_ADMIN") {
        router.push("/dashboard");
      } else {
        fetchUsers();
      }
    }
  }, [session, isLoading, router]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch {}
    finally { setLoading(false); }
  };

  const updateUser = async (userId: string, patch: { role?: string; status?: string }) => {
    setUpdating(userId);
    setMsg("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...patch }),
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...patch } as User : u));
        setMsg(`Updated successfully`);
      } else {
        setMsg(data.error ?? "Failed to update");
      }
    } catch { setMsg("Network error"); }
    finally { setUpdating(null); }
  };

  if (isLoading || loading) return <div className="p-8 text-center text-gray-500">Loading users...</div>;

  const filtered = users.filter(u => {
    const name = `${u.profile?.firstName ?? ""} ${u.profile?.lastName ?? ""}`.toLowerCase();
    const phone = u.phoneNumber;
    return name.includes(search.toLowerCase()) || phone.includes(search);
  });

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-sm text-gray-500 mt-1">{users.length} total users</p>
          </div>
          <button onClick={() => router.push("/admin")} className="text-brand-primary hover:underline">
            ← Back to Admin Panel
          </button>
        </div>

        {msg && (
          <div className={`mb-4 p-3 rounded text-sm ${msg.includes("success") || msg.includes("Updated") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            {msg}
          </div>
        )}

        <div className="mb-4">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or phone..."
            className="w-full max-w-sm p-2 border border-gray-300 rounded-md text-sm focus:ring-brand-accent focus:border-brand-accent"
          />
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">College / Batch</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No users found</td></tr>
                ) : (
                  filtered.map(user => (
                    <tr key={user.id} className={`hover:bg-gray-50 ${user.status === "SUSPENDED" ? "opacity-60" : ""}`}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">
                          {user.profile ? `${user.profile.firstName} ${user.profile.lastName}` : <span className="text-gray-400 italic">No profile</span>}
                        </p>
                        {user.profile?.instagramHandle && (
                          <p className="text-xs text-brand-accent">@{user.profile.instagramHandle}</p>
                        )}
                        <p className="text-xs text-gray-400 font-mono">{user.id.substring(0, 12)}...</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {user.profile ? (
                          <>
                            <p>{user.profile.college}</p>
                            <p className="text-xs text-gray-400">{user.profile.gender} · {user.profile.batch}</p>
                          </>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-gray-600 text-xs">
                        {user.phoneNumber.startsWith("pending:") ? <span className="text-yellow-600">Pending</span> : user.phoneNumber}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${ROLE_COLORS[user.role]}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${user.status === "ACTIVE" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          {/* Role selector */}
                          <select
                            value={user.role}
                            onChange={e => updateUser(user.id, { role: e.target.value })}
                            disabled={updating === user.id || user.id === session?.userId}
                            className="text-xs border border-gray-200 rounded px-1 py-1 disabled:opacity-40"
                          >
                            <option value="STUDENT">Student</option>
                            <option value="CASHIER">Cashier</option>
                            <option value="ADMIN">Admin</option>
                          </select>
                          {/* Suspend / reactivate */}
                          {user.id !== session?.userId && (
                            <button
                              onClick={() => updateUser(user.id, { status: user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE" })}
                              disabled={updating === user.id}
                              className={`text-xs px-2 py-1 rounded font-medium disabled:opacity-40 ${user.status === "ACTIVE" ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-green-50 text-green-600 hover:bg-green-100"}`}
                            >
                              {user.status === "ACTIVE" ? "Suspend" : "Reactivate"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
