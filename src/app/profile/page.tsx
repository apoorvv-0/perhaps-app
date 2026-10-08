"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import LoadingScreen from "@/components/LoadingScreen";
import BottomTabBar from "@/components/BottomTabBar";

export default function PerhapsProfilePage() {
  const { session, isLoading, refreshSession, logout } = useAuth();
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("");
  const [college, setCollege] = useState("");
  const [batch, setBatch] = useState("");
  const [instagram, setInstagram] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!session) { router.push("/"); return; }
      if (session.idVerificationStatus !== "APPROVED") {
        router.push("/verify-id");
        return;
      }
      fetch("/api/profile").then(r => r.json()).then(data => {
        if (data.profile) {
          setFirstName(data.profile.firstName || "");
          setLastName(data.profile.lastName || "");
          setGender(data.profile.gender || "");
          setCollege(data.profile.college || "");
          setBatch(data.profile.batch || "");
          setInstagram(data.profile.instagramHandle || "");
          
          if (data.profile.firstName && data.profile.firstName !== "New") {
            setIsLocked(true);
          }
        }
        setReady(true);
      });
    }
  }, [isLoading, session, router]);

  const handleSave = async () => {
    setError(""); setSuccess(""); setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, gender, college, batch, instagramHandle: instagram }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setSuccess("Profile updated.");
      await refreshSession();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!ready || isLoading || !session) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-brand-wine text-brand-blush font-inter pb-36 selection:bg-brand-burgundy selection:text-brand-blush">

      {/* Header */}
      <div className="flex items-center justify-between px-8 pt-16 pb-2">
        <h1 className="font-playfair text-3xl font-bold italic tracking-tight">Profile</h1>
        <button
          onClick={logout}
          className="text-brand-taupe text-sm font-medium hover:text-brand-blush transition-colors tracking-wide"
        >
          Sign Out
        </button>
      </div>

      <div className="px-8 mt-8 max-w-lg mx-auto space-y-5">

        {/* Feedback */}
        {error && (
          <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm leading-relaxed">
            {error}
          </div>
        )}
        {success && (
          <div className="p-5 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm leading-relaxed">
            {success}
          </div>
        )}

        {/* Name Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-brand-taupe uppercase tracking-widest ml-1">
              First Name
            </label>
            <input
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              disabled={isLocked}
              placeholder="Priya"
              className="w-full bg-brand-charcoal rounded-2xl px-5 py-4 text-brand-blush text-sm outline-none focus:ring-2 focus:ring-brand-rose/20 transition-all disabled:opacity-60"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-brand-taupe uppercase tracking-widest ml-1">
              Last Name
            </label>
            <input
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              disabled={isLocked}
              placeholder="Sharma"
              className="w-full bg-brand-charcoal rounded-2xl px-5 py-4 text-brand-blush text-sm outline-none focus:ring-2 focus:ring-brand-rose/20 transition-all disabled:opacity-60"
            />
          </div>
        </div>

        {/* Gender */}
        <div className="space-y-2">
          <label className="block text-[11px] font-bold text-brand-taupe uppercase tracking-widest ml-1">
            Gender
          </label>
          <select
            value={gender}
            onChange={e => setGender(e.target.value)}
            disabled={isLocked}
            className="w-full bg-brand-charcoal rounded-2xl px-5 py-4 text-brand-blush text-sm outline-none focus:ring-2 focus:ring-brand-rose/20 transition-all appearance-none disabled:opacity-60"
          >
            <option value="" disabled>Select your gender</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
        </div>

        {/* College */}
        <div className="space-y-2">
          <label className="block text-[11px] font-bold text-brand-taupe uppercase tracking-widest ml-1">
            College
          </label>
          <input
            value={college}
            onChange={e => setCollege(e.target.value)}
            disabled={isLocked}
            placeholder="Symbiosis"
            className="w-full bg-brand-charcoal rounded-2xl px-5 py-4 text-brand-blush text-sm outline-none focus:ring-2 focus:ring-brand-rose/20 transition-all disabled:opacity-60"
          />
        </div>

        {/* Batch */}
        <div className="space-y-2">
          <label className="block text-[11px] font-bold text-brand-taupe uppercase tracking-widest ml-1">
            Batch (Year of Graduation)
          </label>
          <input
            value={batch}
            onChange={e => setBatch(e.target.value)}
            disabled={isLocked}
            placeholder="2026"
            className="w-full bg-brand-charcoal rounded-2xl px-5 py-4 text-brand-blush text-sm outline-none focus:ring-2 focus:ring-brand-rose/20 transition-all disabled:opacity-60"
          />
        </div>

        {/* Instagram */}
        <div className="space-y-2">
          <label className="block text-[11px] font-bold text-brand-taupe uppercase tracking-widest ml-1">
            Instagram Handle
          </label>
          <div className="relative">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-taupe text-sm select-none">@</span>
            <input
              value={instagram}
              onChange={e => setInstagram(e.target.value)}
              placeholder="priya.sharma"
              className="w-full bg-brand-charcoal rounded-2xl pl-10 pr-5 py-4 text-brand-blush text-sm outline-none focus:ring-2 focus:ring-brand-rose/20 transition-all"
            />
          </div>
          <p className="text-[11px] text-brand-taupe/60 ml-1 leading-relaxed">
            Used to verify your identity and connect you with your matches.
          </p>
        </div>

        {/* Save */}
        <div className="pt-4 flex flex-col gap-4">
          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full py-5 rounded-full font-semibold text-brand-charcoal bg-gradient-to-r from-brand-blush to-brand-rose active:scale-[0.98] transition-all text-base tracking-wide disabled:opacity-60"
          >
            {loading ? "Saving..." : "Save Identity"}
          </button>
          
          <button
            onClick={async () => {
              if (confirm("Are you sure you want to permanently delete your account? This cannot be undone.")) {
                try {
                  await fetch("/api/profile", { method: "DELETE" });
                  await logout();
                } catch (e) {
                  alert("Failed to delete account");
                }
              }
            }}
            className="w-full py-3 rounded-full font-medium text-red-400 bg-red-400/10 hover:bg-red-400/20 active:scale-[0.98] transition-all text-sm tracking-wide"
          >
            Permanently Delete Account
          </button>
        </div>

      </div>

      <BottomTabBar />
    </div>
  );
}
