"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";

export default function SuperAdminPage() {
  const { session, isLoading } = useAuth();
  const router = useRouter();

  const [eventName, setEventName] = useState("");
  const [targetCollege, setTargetCollege] = useState("KEM Hospital");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!isLoading) {
      if (!session) router.push("/");
      else if (session.globalRole !== "SUPER_ADMIN") router.push("/dashboard");
    }
  }, [session, isLoading, router]);

  const handleCreateEvent = async () => {
    setLoading(true);
    setSuccess("");
    try {
      const res = await fetch("/api/admin/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CREATE_NEW", eventName, targetCollege })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(`Successfully created: ${data.event.name}`);
        setEventName("");
      } else {
        alert(data.error);
      }
    } catch (e) {
      alert("Error creating event");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || !session || session.globalRole !== "SUPER_ADMIN") return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold font-sans text-brand-dark">Roviara Super Admin</h1>
            <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Create New Event</h2>
          {success && <div className="mb-4 p-3 bg-green-50 text-green-700 rounded">{success}</div>}
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Name</label>
              <input 
                type="text" 
                value={eventName}
                onChange={e => setEventName(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded focus:ring-brand-primary focus:border-brand-primary"
                placeholder="e.g. Perhaps Season 1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target College</label>
              <input 
                type="text" 
                value={targetCollege}
                onChange={e => setTargetCollege(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded focus:ring-brand-primary focus:border-brand-primary"
                placeholder="e.g. KEM Hospital"
              />
            </div>
            <button 
              onClick={handleCreateEvent}
              disabled={loading || !eventName || !targetCollege}
              className="w-full bg-brand-primary text-white py-2 rounded font-medium hover:bg-brand-dark disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Event"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
