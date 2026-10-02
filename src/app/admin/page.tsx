"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

type EventPhase =
  | "DRAFT" | "REGISTRATION_OPEN" | "REGISTRATION_CLOSED"
  | "CHOOSING_OPEN" | "CHOOSING_CLOSED" | "MATCHING"
  | "RESULTS_OPEN" | "CLOSED" | "ARCHIVED";

const TRANSITION_META: Record<string, { label: string; bg: string; color: string; isRollback?: boolean }> = {
  REGISTRATION_OPEN:   { label: "Open Registration",             bg: "#1a3a6e", color: "#60a5fa" },
  REGISTRATION_CLOSED: { label: "Close Registration",            bg: "#3a2a0a", color: "#fbbf24" },
  CHOOSING_OPEN:       { label: "Open Choosing Phase",           bg: "#3a1a6e", color: "#a78bfa" },
  CHOOSING_CLOSED:     { label: "Close Choosing (Lock Choices)", bg: "#3a2a0a", color: "#fbbf24" },
  MATCHING:            { label: "Move to Matching Phase",        bg: "#1a3a2a", color: "#34d399" },
  RESULTS_OPEN:        { label: "Publish Results",               bg: "#1a3a1a", color: "#4ade80" },
  CLOSED:              { label: "Close Event",                   bg: "#1e1e1e", color: "#7a6b6b" },
  ARCHIVED:            { label: "Archive Event",                 bg: "#f5f0ee", color: "#7a6b6b" },
  DRAFT:               { label: "Revert to DRAFT",               bg: "#2a0a0a", color: "#dc2626", isRollback: true },
};

const VALID_NEXT: Record<EventPhase, EventPhase[]> = {
  DRAFT:               ["REGISTRATION_OPEN"],
  REGISTRATION_OPEN:   ["REGISTRATION_CLOSED"],
  REGISTRATION_CLOSED: ["CHOOSING_OPEN", "REGISTRATION_OPEN", "DRAFT"],
  CHOOSING_OPEN:       ["CHOOSING_CLOSED"],
  CHOOSING_CLOSED:     ["MATCHING", "CHOOSING_OPEN"],
  MATCHING:            ["RESULTS_OPEN", "CHOOSING_CLOSED"],
  RESULTS_OPEN:        ["CLOSED"],
  CLOSED:              ["ARCHIVED"],
  ARCHIVED:            [],
};

const ROLLBACK_PHASES: EventPhase[] = ["DRAFT", "REGISTRATION_OPEN", "CHOOSING_OPEN", "CHOOSING_CLOSED"];

const cardStyle: React.CSSProperties = {
  background: "#151515",
  borderRadius: "12px",
  padding: "24px",
  border: "1px solid #2a2a2a",
};

export default function AdminDashboard() {
  const { session, isLoading } = useAuth();
  const router = useRouter();

  const [event, setEvent] = useState<any>(null);
  const [dryRunData, setDryRunData] = useState<any>(null);
  const [runningMatch, setRunningMatch] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [newEventName, setNewEventName] = useState("");
  const [showNewEventForm, setShowNewEventForm] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!session) router.push("/");
      else if (session.globalRole !== "SUPER_ADMIN") router.push("/dashboard");
      else fetchEvent();
    }
  }, [session, isLoading, router]);

  const fetchEvent = async () => {
    try {
      const res = await fetch("/api/admin/event");
      if (res.ok) {
        const data = await res.json();
        setEvent(data.event);
        setShowNewEventForm(!data.event || data.event.status === "ARCHIVED");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const advancePhase = async (nextPhase: string) => {
    if (ROLLBACK_PHASES.includes(nextPhase as EventPhase) && nextPhase !== event.status) {
      if (!confirm(`Roll back to "${nextPhase}"? This cannot be undone automatically.`)) return;
    }
    setLoadingAction(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nextPhase }),
      });
      const data = await res.json();
      if (res.ok) {
        setEvent(data.event);
        setSuccess(`Phase changed to ${data.event.status}`);
      } else {
        setError(data.error);
      }
    } catch {
      setError("Network error");
    } finally {
      setLoadingAction(false);
    }
  };

  const createNewEvent = async () => {
    if (!newEventName.trim()) return;
    if (!confirm(`Archive the current event and create "${newEventName}"?`)) return;
    setLoadingAction(true);
    setError("");
    try {
      const res = await fetch("/api/admin/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CREATE_NEW", eventName: newEventName }),
      });
      const data = await res.json();
      if (res.ok) {
        setEvent(data.event);
        setShowNewEventForm(false);
        setNewEventName("");
        setSuccess(`New event "${data.event.name}" created!`);
      } else {
        setError(data.error);
      }
    } catch {
      setError("Network error");
    } finally {
      setLoadingAction(false);
    }
  };

  const triggerDryRun = async () => {
    setRunningMatch(true);
    setError("");
    setDryRunData(null);
    try {
      const res = await fetch("/api/admin/matching/dry-run", { method: "POST" });
      const data = await res.json();
      if (res.ok) setDryRunData(data);
      else setError(data.error || "Matching failed");
    } catch { setError("Network error"); }
    finally { setRunningMatch(false); }
  };

  const triggerCommit = async () => {
    if (!confirm("Commit matches permanently? This cannot be undone.")) return;
    setRunningMatch(true);
    setError("");
    try {
      const res = await fetch("/api/admin/matching/commit", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setSuccess(`Matches committed! Snapshot: ${data.snapshotId ?? "saved"}`);
        fetchEvent();
      } else {
        setError(data.error || "Commit failed");
      }
    } catch { setError("Network error"); }
    finally { setRunningMatch(false); }
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", background: '#0d0d0d', display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#7a6b6b" }}>Loading Admin Panel...</p>
      </div>
    );
  }

  const currentPhase: EventPhase | null = event?.status ?? null;
  const nextPhases: EventPhase[] = currentPhase ? VALID_NEXT[currentPhase] : [];
  const forwardPhases = nextPhases.filter(p => !ROLLBACK_PHASES.includes(p));
  const rollbackPhases = nextPhases.filter(p => ROLLBACK_PHASES.includes(p));

  return (
    <div style={{ minHeight: "100vh", background: '#0d0d0d' }}>

      {/* Top bar */}
      <div style={{
        background: "#111111",
        borderBottom: "1px solid #2a2a2a",
        padding: "0 24px",
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 40,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "20px",
            fontStyle: "italic",
            color: "#f5f0ee",
          }}>
            Perhaps
          </span>
          <span style={{
            background: "#1a0a0a",
            border: "1px solid #5c1a1a",
            color: "#c9a0a0",
            fontSize: "10px",
            fontWeight: 700,
            padding: "2px 8px",
            borderRadius: "4px",
            textTransform: "uppercase" as const,
            letterSpacing: "0.08em",
          }}>
            Admin
          </span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => router.push("/admin/users")}
            style={{
              background: "#1e1e1e",
              color: "#f5f0ee",
              border: "1px solid #2a2a2a",
              borderRadius: "6px",
              padding: "6px 14px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Manage Users
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            style={{
              background: "none",
              border: "1px solid #2a2a2a",
              borderRadius: "6px",
              padding: "6px 14px",
              color: "#7a6b6b",
              fontSize: "12px",
              cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Dashboard
          </button>
        </div>
      </div>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "32px",
            fontWeight: 500,
            color: "#f5f0ee",
            margin: "0 0 4px",
          }}>
            Admin Control Panel
          </h1>
          <p style={{ color: "#7a6b6b", margin: 0, fontSize: "13px" }}>
            Manage event lifecycle, run matching engine, and configure Perhaps.
          </p>
        </div>

        {error && (
          <div style={{
            marginBottom: 16,
            padding: "12px 16px",
            background: "#1e0a0a",
            border: "1px solid #5c1a1a",
            borderLeft: "3px solid #dc2626",
            borderRadius: "8px",
            color: "#dc2626",
            fontSize: "13px",
          }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{
            marginBottom: 16,
            padding: "12px 16px",
            background: "#0a1e0a",
            border: "1px solid #16a34a",
            borderLeft: "3px solid #16a34a",
            borderRadius: "8px",
            color: "#16a34a",
            fontSize: "13px",
          }}>
            {success}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>

          {/* Event State Machine */}
          <div style={cardStyle}>
            <h2 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "20px",
              fontWeight: 500,
              color: "#f5f0ee",
              margin: "0 0 20px",
            }}>
              Event State Machine
            </h2>

            {event && event.status !== "ARCHIVED" ? (
              <>
                <div style={{
                  marginBottom: 20,
                  padding: "14px 16px",
                  background: "#1a0d0d",
                  border: "1px solid #5c1a1a",
                  borderRadius: "8px",
                }}>
                  <p style={{ fontSize: "10px", fontWeight: 700, color: "#7a6b6b", textTransform: "uppercase" as const, letterSpacing: "0.1em", margin: "0 0 4px" }}>
                    Current Phase
                  </p>
                  <p style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: "26px",
                    fontWeight: 600,
                    color: "#c9a0a0",
                    margin: "0 0 4px",
                  }}>
                    {event.status}
                  </p>
                  <p style={{ fontSize: "11px", color: "#7a6b6b", margin: 0 }}>{event.name}</p>
                </div>

                {forwardPhases.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <p style={{ fontSize: "10px", fontWeight: 700, color: "#7a6b6b", textTransform: "uppercase" as const, letterSpacing: "0.1em", margin: "0 0 8px" }}>
                      Advance
                    </p>
                    <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
                      {forwardPhases.map(phase => {
                        const meta = TRANSITION_META[phase];
                        return (
                          <button
                            key={phase}
                            onClick={() => advancePhase(phase)}
                            disabled={loadingAction}
                            style={{
                              padding: "10px 14px",
                              borderRadius: "8px",
                              border: `1px solid ${meta?.color ?? "#2a2a2a"}33`,
                              background: meta?.bg ?? "#1e1e1e",
                              color: meta?.color ?? "#f5f0ee",
                              fontSize: "13px",
                              fontWeight: 600,
                              fontFamily: "'Inter', sans-serif",
                              cursor: loadingAction ? "not-allowed" : "pointer",
                              opacity: loadingAction ? 0.5 : 1,
                              textAlign: "left" as const,
                            }}
                          >
                            {meta?.label ?? phase}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {rollbackPhases.length > 0 && (
                  <div>
                    <p style={{ fontSize: "10px", fontWeight: 700, color: "#dc2626", textTransform: "uppercase" as const, letterSpacing: "0.1em", margin: "0 0 8px" }}>
                      Emergency Rollback
                    </p>
                    <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
                      {rollbackPhases.map(phase => (
                        <button
                          key={phase}
                          onClick={() => advancePhase(phase)}
                          disabled={loadingAction}
                          style={{
                            padding: "10px 14px",
                            borderRadius: "8px",
                            border: "1px solid #5c1a1a",
                            background: "#1e0a0a",
                            color: "#dc2626",
                            fontSize: "13px",
                            fontWeight: 600,
                            fontFamily: "'Inter', sans-serif",
                            cursor: loadingAction ? "not-allowed" : "pointer",
                            opacity: loadingAction ? 0.5 : 1,
                            textAlign: "left" as const,
                          }}
                        >
                          {TRANSITION_META[phase]?.label ?? `Rollback to ${phase}`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={{
                padding: "20px",
                background: "#111111",
                border: "1px dashed #2a2a2a",
                borderRadius: "8px",
                textAlign: "center" as const,
                color: "#7a6b6b",
                fontSize: "13px",
                marginBottom: 14,
              }}>
                {event?.status === "ARCHIVED" ? "This event is archived." : "No event exists yet."}
              </div>
            )}

            {(showNewEventForm || !event) && (
              <div style={{
                marginTop: 14,
                padding: "14px",
                background: "#0a1e0a",
                border: "1px solid #16a34a33",
                borderRadius: "8px",
              }}>
                <p style={{ fontSize: "12px", fontWeight: 600, color: "#16a34a", margin: "0 0 10px" }}>
                  Create New Event
                </p>
                <input
                  type="text"
                  value={newEventName}
                  onChange={e => setNewEventName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    background: "#0d1a0d",
                    border: "1px solid #16a34a44",
                    borderRadius: "6px",
                    fontSize: "13px",
                    marginBottom: 10,
                    boxSizing: "border-box" as const,
                    outline: "none",
                    color: "#f5f0ee",
                    fontFamily: "'Inter', sans-serif",
                  }}
                  placeholder="e.g. Perhaps Season 2"
                />
                <button
                  onClick={createNewEvent}
                  disabled={!newEventName.trim() || loadingAction}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "none",
                    background: "#16a34a",
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: "13px",
                    fontFamily: "'Inter', sans-serif",
                    cursor: (!newEventName.trim() || loadingAction) ? "not-allowed" : "pointer",
                    opacity: (!newEventName.trim() || loadingAction) ? 0.5 : 1,
                  }}
                >
                  {loadingAction ? "Creating..." : "Create & Start Fresh"}
                </button>
                {event && (
                  <button
                    onClick={() => setShowNewEventForm(false)}
                    style={{
                      marginTop: 6,
                      width: "100%",
                      background: "none",
                      border: "none",
                      color: "#7a6b6b",
                      fontSize: "12px",
                      fontFamily: "'Inter', sans-serif",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            )}

            {event && !showNewEventForm && (
              <button
                onClick={() => setShowNewEventForm(true)}
                style={{
                  marginTop: 12,
                  width: "100%",
                  padding: "8px",
                  background: "none",
                  border: "1px dashed #2a2a2a",
                  borderRadius: "6px",
                  color: "#7a6b6b",
                  fontSize: "12px",
                  fontFamily: "'Inter', sans-serif",
                  cursor: "pointer",
                }}
              >
                + Start a new event (archives current)
              </button>
            )}
          </div>

          {/* Matching Engine */}
          <div style={cardStyle}>
            <h2 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "20px",
              fontWeight: 500,
              color: "#f5f0ee",
              margin: "0 0 20px",
            }}>
              Matching Engine
            </h2>

            {event?.status !== "MATCHING" && (
              <div style={{
                marginBottom: 14,
                padding: "12px 14px",
                background: "#1a1a0a",
                border: "1px solid #3a3010",
                borderRadius: "8px",
                fontSize: "13px",
                color: "#fbbf24",
              }}>
                Event must be in <strong>MATCHING</strong> phase. Current:{" "}
                <strong>{event?.status ?? "none"}</strong>
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              <button
                onClick={triggerDryRun}
                disabled={runningMatch || event?.status !== "MATCHING"}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#3a2a0a",
                  color: "#fbbf24",
                  fontWeight: 700,
                  fontSize: "13px",
                  fontFamily: "'Inter', sans-serif",
                  cursor: (runningMatch || event?.status !== "MATCHING") ? "not-allowed" : "pointer",
                  opacity: (runningMatch || event?.status !== "MATCHING") ? 0.4 : 1,
                }}
              >
                {runningMatch ? "Running..." : "Dry Run"}
              </button>
              <button
                onClick={triggerCommit}
                disabled={runningMatch || event?.status !== "MATCHING"}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#2a0a0a",
                  color: "#dc2626",
                  fontWeight: 700,
                  fontSize: "13px",
                  fontFamily: "'Inter', sans-serif",
                  cursor: (runningMatch || event?.status !== "MATCHING") ? "not-allowed" : "pointer",
                  opacity: (runningMatch || event?.status !== "MATCHING") ? 0.4 : 1,
                }}
              >
                Commit (Final)
              </button>
            </div>

            {dryRunData && (
              <div style={{
                background: '#0d0d0d',
                borderRadius: "8px",
                padding: "14px",
                maxHeight: "280px",
                overflowY: "auto" as const,
                fontFamily: "monospace",
                fontSize: "12px",
                color: "#d1d5db",
                border: "1px solid #1e1e1e",
              }}>
                <p style={{ color: "#34d399", margin: "0 0 8px", fontWeight: 700 }}>DRY RUN COMPLETE</p>
                <p style={{ margin: "0 0 4px" }}>
                  Mutual Pairs:{" "}
                  <span style={{ color: "#f5f0ee", fontWeight: 700 }}>
                    {dryRunData.stats?.totalMutuals ?? dryRunData.matches?.length ?? "?"}
                  </span>
                </p>
                <p style={{ margin: "0 0 12px" }}>
                  Singles:{" "}
                  <span style={{ color: "#f5f0ee", fontWeight: 700 }}>
                    {dryRunData.stats?.singlesCount ?? "?"}
                  </span>
                </p>
                {dryRunData.matches?.slice(0, 10).map((m: any, i: number) => (
                  <p key={i} style={{ margin: "3px 0", color: "#7a6b6b" }}>
                    <span style={{ color: "#fbbf24" }}>{m.userA_id?.substring(0, 8) ?? m.user1Id?.substring(0, 8)}...</span>
                    <span style={{ color: "#c9a0a0" }}> × </span>
                    <span style={{ color: "#c9a0a0" }}>{m.userB_id?.substring(0, 8) ?? m.user2Id?.substring(0, 8)}...</span>
                    <span style={{ color: "#3d3030", fontSize: "10px" }}> ({m.matchStrength})</span>
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
