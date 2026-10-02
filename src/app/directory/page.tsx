"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import BottomTabBar from "@/components/BottomTabBar";

type Participant = {
  id: string;
  firstName: string;
  lastName: string;
  gender: "MALE" | "FEMALE";
  college: string;
  batch: string;
  instagramHandle: string;
};

export default function DirectoryPage() {
  const { session, isLoading } = useAuth();
  const router = useRouter();

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [choices, setChoices] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [eventPhase, setEventPhase] = useState<string>("");

  useEffect(() => {
    if (!isLoading) {
      if (!session) router.push("/");
      else fetchAll();
    }
  }, [session, isLoading]);

  const fetchAll = async () => {
    try {
      const [dirRes, choicesRes] = await Promise.all([
        fetch("/api/directory"),
        fetch("/api/choices"),
      ]);

      if (dirRes.ok) {
        const dirData = await dirRes.json();
        setParticipants(dirData.participants ?? []);
        setEventPhase(dirData.eventPhase ?? "");

        if (choicesRes.ok) {
          const choicesData = await choicesRes.json();
          const savedChoices: { rank: number; pickedId: string }[] = choicesData.choices ?? [];
          const ordered = savedChoices
            .sort((a, b) => a.rank - b.rank)
            .map((c) => c.pickedId);
          setChoices(ordered);
        }
      } else {
        const data = await dirRes.json();
        setError(data.error || "Failed to load directory.");
      }
    } catch {
      setError("Network error loading directory.");
    } finally {
      setFetching(false);
    }
  };

  const toggleChoice = (participantId: string) => {
    setError("");
    setSuccessMsg("");
    if (choices.includes(participantId)) {
      setChoices(choices.filter((id) => id !== participantId));
    } else {
      if (choices.length >= 12) {
        setError("You can only select up to 12 choices.");
        return;
      }
      setChoices([...choices, participantId]);
    }
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const next = [...choices];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    setChoices(next);
  };

  const moveDown = (index: number) => {
    if (index === choices.length - 1) return;
    const next = [...choices];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    setChoices(next);
  };

  const saveChoices = async () => {
    if (choices.length > 0 && choices.length < 3) {
      setError("Select at least 3 people (or 0 to clear).");
      return;
    }
    setSaving(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/choices", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ choices }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`${data.savedCount} choices saved.`);
      } else {
        setError(data.error || "Failed to save choices.");
      }
    } catch {
      setError("Network error saving choices.");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || fetching) {
    return (
      <div className="min-h-screen bg-brand-wine flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-rose border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      </div>
    );
  }

  if (error === "Choosing is not currently open." || (eventPhase && eventPhase !== "CHOOSING_OPEN" && eventPhase !== "CHOOSING_CLOSED")) {
    return (
      <div className="min-h-screen bg-brand-wine flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 border border-brand-rose/20 rounded-full flex items-center justify-center mb-6">
          <svg width="24" height="24" fill="none" stroke="#E8B4A5" strokeWidth="1.5">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <h2 className="font-playfair text-[28px] text-brand-blush mb-2">Directory is Locked</h2>
        <p className="text-brand-taupe mb-8">The choosing phase is not currently open.</p>
        <button onClick={() => router.push("/dashboard")} className="btn-secondary">
          Return Home
        </button>
        <BottomTabBar />
      </div>
    );
  }

  const filteredParticipants = participants.filter(p =>
    `${p.firstName} ${p.lastName} ${p.college}`.toLowerCase().includes(search.toLowerCase())
  );

  const pickedParticipants = choices
    .map(id => participants.find(p => p.id === id))
    .filter(Boolean) as Participant[];

  const isChoosingOpen = eventPhase === "CHOOSING_OPEN";

  return (
    <div className="min-h-screen bg-brand-wine pb-32">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-burgundy/20 via-brand-wine/0 to-brand-wine/0" />

      {/* Top Header */}
      <div className="relative z-10 px-6 pt-12 pb-6 max-w-5xl mx-auto flex justify-between items-center">
        <h1 className="font-playfair text-[32px] text-brand-blush">Discover</h1>
        <p className="text-brand-taupe text-sm">{participants.length} available</p>
      </div>

      {/* Main Layout */}
      <div className="relative z-10 px-6 max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
        
        {/* Left: Feed */}
        <div className="flex flex-col gap-6">
          <input
            type="text"
            placeholder="Search name or college..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-brand-charcoal border border-brand-rose/20 text-brand-blush px-4 py-3 rounded-2xl outline-none focus:border-brand-rose transition-colors"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredParticipants.map((p) => {
              const isSelected = choices.includes(p.id);
              return (
                <div key={p.id} className="charcoal-card p-5 relative group overflow-hidden flex flex-col justify-end min-h-[140px]" style={{ borderColor: isSelected ? '#E8B4A5' : 'rgba(232, 180, 165, 0.1)' }}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-0 pointer-events-none" />
                  
                  {isChoosingOpen && (
                    <button 
                      onClick={() => toggleChoice(p.id)}
                      className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center border border-white/10 transition-transform hover:scale-110"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill={isSelected ? '#F6D7CF' : 'none'} stroke={isSelected ? '#F6D7CF' : '#F6D7CF'} strokeWidth="1.5">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                      </svg>
                    </button>
                  )}

                  <div className="relative z-10">
                    <h3 className="text-white font-bold text-[18px]">{p.firstName} {p.lastName}</h3>
                    <p className="text-white/70 text-[12px] flex items-center gap-1 mt-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                      {p.college}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Your Picks (Sticky) */}
        <div className="charcoal-card p-6 sticky top-6">
          <h2 className="font-playfair text-[22px] text-brand-blush mb-1">Your List</h2>
          <p className="text-brand-taupe text-[13px] mb-6">{choices.length} / 12 selected</p>

          <div className="flex flex-col gap-3 mb-8">
            {pickedParticipants.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-brand-taupe/30 rounded-xl">
                <p className="text-brand-taupe text-[13px]">No one selected yet.</p>
              </div>
            ) : (
              pickedParticipants.map((p, index) => (
                <div key={p.id} className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-brand-rose/10">
                  <div className="flex items-center gap-3">
                    <span className="text-brand-rose font-playfair font-bold text-lg w-5 text-center">{index + 1}</span>
                    <div>
                      <p className="text-white text-[14px] font-medium">{p.firstName} {p.lastName}</p>
                    </div>
                  </div>
                  {isChoosingOpen && (
                    <div className="flex items-center gap-1">
                      <button onClick={() => moveUp(index)} disabled={index === 0} className="p-1 text-brand-taupe hover:text-white disabled:opacity-30"><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"></polyline></svg></button>
                      <button onClick={() => moveDown(index)} disabled={index === choices.length - 1} className="p-1 text-brand-taupe hover:text-white disabled:opacity-30"><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg></button>
                      <button onClick={() => toggleChoice(p.id)} className="p-1 text-red-400 hover:text-red-300 ml-2"><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {isChoosingOpen && (
            <button onClick={saveChoices} disabled={saving} className="btn-primary w-full shadow-premium flex items-center justify-center gap-2">
              {saving ? (
                 <span className="animate-pulse">Saving...</span>
              ) : (
                 <>Lock In Choices</>
              )}
            </button>
          )}

          {error && <p className="text-red-400 text-[13px] mt-4 text-center">{error}</p>}
          {successMsg && <p className="text-[#E8B4A5] text-[13px] mt-4 text-center font-medium">{successMsg}</p>}
        </div>

      </div>

      <BottomTabBar />
    </div>
  );
}
