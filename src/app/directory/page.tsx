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
      <div style={{ minHeight: "100vh", background: "#0d0d0d", paddingBottom: "80px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 32, height: 32,
            border: "2px solid #8b1a1a",
            borderTopColor: "transparent",
            borderRadius: "50%",
            margin: "0 auto 16px",
            animation: "spin 1s linear infinite",
          }} />
          <p style={{ color: "#7a6b6b", fontSize: "13px" }}>Loading directory...</p>
        </div>
      </div>
    );
  }

  if (eventPhase && eventPhase !== "CHOOSING_OPEN" && eventPhase !== "CHOOSING_CLOSED") {
    return (
      <div style={{ minHeight: "100vh", background: "#0d0d0d", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: 40 }}>
          <div style={{
            width: 56, height: 56,
            border: "1px solid #2a2a2a",
            borderRadius: "50%",
            margin: "0 auto 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7a6b6b" strokeWidth="1.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h2 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "24px",
            color: "#f5f0ee",
            marginBottom: 8,
            fontWeight: 500,
          }}>
            Directory is Locked
          </h2>
          <p style={{ color: "#7a6b6b", marginBottom: 24, fontSize: "14px" }}>
            The choosing phase is not open right now.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            style={{
              background: "#8b1a1a",
              color: "#f5f0ee",
              border: "none",
              padding: "12px 24px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: 600,
              fontFamily: "'Inter', sans-serif",
              fontSize: "14px",
            }}
          >
            Back to Dashboard
          </button>
        </div>
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
    <div style={{ minHeight: "100vh", background: "#0d0d0d", paddingBottom: 80 }}>

      {/* Header */}
      <div style={{ padding: "32px 24px 16px", maxWidth: 1200, margin: "0 auto" }}>
        <button
          onClick={() => router.push("/dashboard")}
          style={{
            background: "none",
            border: "none",
            color: "#7a6b6b",
            cursor: "pointer",
            fontSize: "13px",
            fontFamily: "'Inter', sans-serif",
            padding: 0,
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Dashboard
        </button>

        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "32px",
          fontWeight: 500,
          color: "#f5f0ee",
          marginBottom: 4,
        }}>
          Directory
        </h1>
        <p style={{ color: "#7a6b6b", fontSize: "14px" }}>
          {isChoosingOpen
            ? "Browse participants and build your ranked list. Click a name to select."
            : "Choices are locked. You can view the directory but cannot make changes."}
        </p>
      </div>

      {/* Messages */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        {error && (
          <div style={{
            background: "#1e0a0a",
            border: "1px solid #5c1a1a",
            color: "#dc2626",
            padding: "10px 14px",
            borderRadius: 8,
            marginBottom: 12,
            fontSize: 13,
          }}>
            {error}
          </div>
        )}
        {successMsg && (
          <div style={{
            background: "#0a1e0a",
            border: "1px solid #16a34a",
            color: "#16a34a",
            padding: "10px 14px",
            borderRadius: 8,
            marginBottom: 12,
            fontSize: 13,
          }}>
            {successMsg}
          </div>
        )}
      </div>

      {/* Main content */}
      <div style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "0 24px 24px",
        display: "grid",
        gridTemplateColumns: "1fr 340px",
        gap: 20,
        alignItems: "start",
      }}>

        {/* LEFT: Directory */}
        <div style={{
          background: "#151515",
          borderRadius: 12,
          border: "1px solid #2a2a2a",
        }}>
          <div style={{ padding: "18px 20px", borderBottom: "1px solid #2a2a2a" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: "#f5f0ee", margin: 0 }}>
                Participants ({participants.length})
              </h2>
            </div>
            <input
              type="text"
              placeholder="Search by name or college..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "#1e1e1e",
                border: "1px solid #2a2a2a",
                borderRadius: 8,
                fontSize: 13,
                outline: "none",
                color: "#f5f0ee",
                fontFamily: "'Inter', sans-serif",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ maxHeight: "65vh", overflowY: "auto", padding: "10px 14px" }}>
            {filteredParticipants.length === 0 ? (
              <p style={{ textAlign: "center", color: "#7a6b6b", padding: "32px 0", fontSize: 13 }}>
                No participants found.
              </p>
            ) : (
              filteredParticipants.map(p => {
                const isSelected = choices.includes(p.id);
                const rank = choices.indexOf(p.id) + 1;
                return (
                  <ParticipantRow
                    key={p.id}
                    participant={p}
                    isSelected={isSelected}
                    rank={rank}
                    isChoosingOpen={isChoosingOpen}
                    onClick={() => isChoosingOpen && toggleChoice(p.id)}
                  />
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT: Ranked Choices */}
        <div style={{ position: "sticky", top: 24 }}>
          <div style={{
            background: "#151515",
            borderRadius: 12,
            border: "1px solid #2a2a2a",
          }}>
            <div style={{ padding: "18px 18px 12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <h2 style={{ fontSize: 14, fontWeight: 600, color: "#f5f0ee", margin: 0 }}>
                  Your Ranked Choices
                </h2>
                <span style={{
                  fontSize: 11,
                  color: "#7a6b6b",
                  background: "#1e1e1e",
                  padding: "3px 10px",
                  borderRadius: 12,
                  border: "1px solid #2a2a2a",
                }}>
                  {choices.length} / 12
                </span>
              </div>

              {pickedParticipants.length === 0 ? (
                <div style={{ textAlign: "center", padding: "28px 0", color: "#7a6b6b", fontSize: 12 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    border: "1px solid #2a2a2a",
                    borderRadius: "50%",
                    margin: "0 auto 10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3d3030" strokeWidth="1.5">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                  </div>
                  Click names to add them here
                </div>
              ) : (
                <div style={{ maxHeight: "50vh", overflowY: "auto" }}>
                  {pickedParticipants.map((p, index) => (
                    <div key={p.id} style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "9px 10px",
                      borderRadius: 8,
                      marginBottom: 5,
                      border: "1px solid #2a2a2a",
                      background: "#1e1e1e",
                    }}>
                      <span style={{
                        fontWeight: 700,
                        color: "#8b1a1a",
                        fontSize: 13,
                        minWidth: 22,
                        textAlign: "center",
                      }}>
                        {index + 1}
                      </span>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: "#f5f0ee", margin: 0 }}>
                          {p.firstName} {p.lastName}
                        </p>
                        <p style={{ fontSize: 10, color: "#7a6b6b", margin: 0 }}>@{p.instagramHandle}</p>
                      </div>
                      {isChoosingOpen && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          <button
                            onClick={() => moveUp(index)}
                            disabled={index === 0}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: index === 0 ? "not-allowed" : "pointer",
                              color: index === 0 ? "#2a2a2a" : "#8b1a1a",
                              fontSize: 11,
                              padding: 2,
                            }}
                          >
                            ▲
                          </button>
                          <button
                            onClick={() => moveDown(index)}
                            disabled={index === choices.length - 1}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: index === choices.length - 1 ? "not-allowed" : "pointer",
                              color: index === choices.length - 1 ? "#2a2a2a" : "#8b1a1a",
                              fontSize: 11,
                              padding: 2,
                            }}
                          >
                            ▼
                          </button>
                        </div>
                      )}
                      {isChoosingOpen && (
                        <button
                          onClick={() => toggleChoice(p.id)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#5c1a1a",
                            cursor: "pointer",
                            fontSize: 16,
                            padding: "0 2px",
                            lineHeight: 1,
                          }}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {isChoosingOpen && (
              <div style={{ padding: "0 18px 18px" }}>
                {choices.length > 0 && choices.length < 3 && (
                  <p style={{ fontSize: 11, color: "#dc2626", marginBottom: 8, textAlign: "center" }}>
                    Select at least 3 to save
                  </p>
                )}
                <button
                  onClick={saveChoices}
                  disabled={saving || (choices.length > 0 && choices.length < 3)}
                  style={{
                    width: "100%",
                    padding: "13px",
                    borderRadius: 8,
                    background: (saving || (choices.length > 0 && choices.length < 3)) ? "#2a1a1a" : "#8b1a1a",
                    color: "#f5f0ee",
                    border: "none",
                    fontWeight: 600,
                    fontSize: 14,
                    fontFamily: "'Inter', sans-serif",
                    cursor: (saving || (choices.length > 0 && choices.length < 3)) ? "not-allowed" : "pointer",
                    transition: "background 0.2s",
                  }}
                >
                  {saving ? "Saving..." : choices.length === 0 ? "Clear All Choices" : "Save My Choices"}
                </button>
              </div>
            )}

            {!isChoosingOpen && choices.length > 0 && (
              <div style={{ padding: "0 18px 18px" }}>
                <div style={{
                  background: "#1a1a10",
                  border: "1px solid #3a3010",
                  borderRadius: 8,
                  padding: "10px 14px",
                  fontSize: 12,
                  color: "#7a6b6b",
                }}>
                  Choices are locked. Results coming soon.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <BottomTabBar />
    </div>
  );
}

function ParticipantRow({
  participant: p,
  isSelected,
  rank,
  isChoosingOpen,
  onClick,
}: {
  participant: Participant;
  isSelected: boolean;
  rank: number;
  isChoosingOpen: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "11px 12px",
        borderRadius: 8,
        marginBottom: 5,
        border: isSelected ? "1px solid #8b1a1a" : `1px solid ${hovered ? "#2a2a2a" : "transparent"}`,
        background: isSelected ? "#1a0d0d" : hovered ? "#1e1e1e" : "transparent",
        cursor: isChoosingOpen ? "pointer" : "default",
        transition: "all 0.15s ease",
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {isSelected && (
            <span style={{
              background: "#8b1a1a",
              color: "#f5f0ee",
              fontSize: 10,
              fontWeight: 700,
              padding: "2px 7px",
              borderRadius: 10,
              minWidth: 22,
              textAlign: "center",
            }}>
              #{rank}
            </span>
          )}
          <span style={{ fontWeight: 600, fontSize: 13, color: "#f5f0ee" }}>
            {p.firstName} {p.lastName}
          </span>
        </div>
        <p style={{ fontSize: 11, color: "#7a6b6b", marginTop: 2, margin: 0 }}>
          {p.college} · {p.batch} · @{p.instagramHandle}
        </p>
      </div>
      {isChoosingOpen && (
        <div style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          border: isSelected ? "2px solid #8b1a1a" : "2px solid #2a2a2a",
          background: isSelected ? "#8b1a1a" : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "all 0.15s ease",
        }}>
          {isSelected && (
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#f5f0ee" strokeWidth="2.5">
              <polyline points="2 6 5 9 10 3"/>
            </svg>
          )}
        </div>
      )}
    </div>
  );
}
