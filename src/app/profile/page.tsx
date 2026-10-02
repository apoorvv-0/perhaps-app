"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import BottomTabBar from "@/components/BottomTabBar";

const COLLEGES = [
  "Seth GS Medical College",
  "Topiwala National Medical College",
  "Lokmanya Tilak Municipal Medical College",
  "Grant Medical College",
  "HBT Medical College",
  "KEM Hospital",
  "Sion Hospital",
  "Nair Hospital",
  "Other"
];

const BATCHES = [
  "2020", "2021", "2022", "2023", "2024", "Intern", "Other"
];

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  background: "#1e1e1e",
  border: "1px solid #2a2a2a",
  borderRadius: "8px",
  color: "#f5f0ee",
  fontSize: "14px",
  fontFamily: "'Inter', sans-serif",
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  color: "#7a6b6b",
  marginBottom: "6px",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  fontWeight: 600,
};

export default function ProfileSetupPage() {
  const { session, isLoading, refreshSession, logout } = useAuth();
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "">("");
  const [college, setCollege] = useState("");
  const [batch, setBatch] = useState("");
  const [instagram, setInstagram] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const initialFetchDoneRef = useRef<boolean>(false);

  useEffect(() => {
    if (!isLoading) {
      if (!session) {
        router.push("/");
      } else if (!session.phoneVerified) {
        router.push("/verify-phone");
      } else if (session.profileComplete && !initialFetchDone) {
        fetch("/api/profile")
          .then(r => r.json())
          .then(data => {
            if (data.profile) {
              setFirstName(data.profile.firstName);
              setLastName(data.profile.lastName);
              setGender(data.profile.gender);
              setCollege(data.profile.college);
              setBatch(data.profile.batch);
              setInstagram(data.profile.instagramHandle);
              setIsEditMode(true);
            }
            initialFetchDoneRef.current = true;
          })
          .catch(() => setInitialFetchDone(true));
      } else if (!session.profileComplete) {
        initialFetchDoneRef.current = true;
      }
    }
  }, [session, isLoading, router, initialFetchDone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    let cleanInsta = instagram.trim();
    if (cleanInsta.startsWith("@")) {
      cleanInsta = cleanInsta.substring(1);
    }

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          gender,
          college,
          batch,
          instagramHandle: cleanInsta
        }),
      });
      const data = await res.json();

      if (res.ok) {
        await refreshSession();
        router.push("/dashboard");
      } else {
        if (data.error && typeof data.error === "object") {
          setError(JSON.stringify(data.error));
        } else {
          setError(data.error || "Failed to update profile");
        }
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || !session || !initialFetchDone) return null;

  return (
    <div style={{ minHeight: "100vh", background: '#0d0d0d', paddingBottom: isEditMode ? 80 : 0 }}>
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "48px 24px" }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          {isEditMode && (
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
          )}
          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "36px",
            fontWeight: 500,
            color: "#f5f0ee",
            margin: "0 0 6px",
          }}>
            {isEditMode ? "Edit Profile" : "Complete Your Profile"}
          </h1>
          <p style={{ color: "#7a6b6b", fontSize: "14px", margin: 0 }}>
            {isEditMode
              ? "Update your personal details below."
              : "Just a few details before you can start matching."}
          </p>
        </div>

        {/* Form Card */}
        <div style={{
          background: "#151515",
          border: "1px solid #2a2a2a",
          borderRadius: "12px",
          padding: "28px 24px",
        }}>
          {error && (
            <div style={{
              marginBottom: 20,
              padding: "12px 14px",
              background: "#1e0a0a",
              border: "1px solid #5c1a1a",
              borderRadius: "8px",
              color: "#dc2626",
              fontSize: "13px",
              fontFamily: "monospace",
              overflowX: "auto",
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {/* Name row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
              <div>
                <label style={labelStyle}>First Name</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Last Name</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Gender */}
            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Gender</label>
              <select
                required
                disabled={isEditMode}
                value={gender}
                onChange={(e) => setGender(e.target.value as "MALE" | "FEMALE")}
                style={{
                  ...inputStyle,
                  opacity: isEditMode ? 0.5 : 1,
                  cursor: isEditMode ? "not-allowed" : "default",
                }}
              >
                <option value="" disabled>Select Gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
              {isEditMode && (
                <p style={{ fontSize: "11px", color: "#7a6b6b", marginTop: 4 }}>
                  Gender cannot be changed after registration.
                </p>
              )}
            </div>

            {/* College */}
            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>College</label>
              <select
                required
                disabled={isEditMode}
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                style={{
                  ...inputStyle,
                  opacity: isEditMode ? 0.5 : 1,
                  cursor: isEditMode ? "not-allowed" : "default",
                }}
              >
                <option value="" disabled>Select College</option>
                {COLLEGES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {isEditMode && (
                <p style={{ fontSize: "11px", color: "#7a6b6b", marginTop: 4 }}>
                  College cannot be changed after registration.
                </p>
              )}
            </div>

            {/* Batch */}
            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Batch (Year of Joining)</label>
              <select
                required
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                style={inputStyle}
              >
                <option value="" disabled>Select Batch</option>
                {BATCHES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            {/* Instagram */}
            <div style={{ marginBottom: 28 }}>
              <label style={labelStyle}>Instagram Handle</label>
              <div style={{ display: "flex" }}>
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "0 12px",
                  background: "#2a2a2a",
                  border: "1px solid #2a2a2a",
                  borderRight: "none",
                  borderRadius: "8px 0 0 8px",
                  color: "#7a6b6b",
                  fontSize: "14px",
                  fontFamily: "'Inter', sans-serif",
                }}>
                  @
                </span>
                <input
                  type="text"
                  required
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value.replace(/^@+/, ''))}
                  style={{
                    ...inputStyle,
                    borderRadius: "0 8px 8px 0",
                    flex: 1,
                  }}
                  placeholder="username"
                />
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              {!isEditMode ? (
                <button
                  type="button"
                  onClick={logout}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#7a6b6b",
                    fontSize: "13px",
                    fontFamily: "'Inter', sans-serif",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  Logout instead
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#7a6b6b",
                    fontSize: "13px",
                    fontFamily: "'Inter', sans-serif",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                style={{
                  background: loading ? "#2a1a1a" : "#8b1a1a",
                  color: "#f5f0ee",
                  border: "none",
                  borderRadius: "8px",
                  padding: "12px 28px",
                  fontSize: "14px",
                  fontWeight: 600,
                  fontFamily: "'Inter', sans-serif",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "background 0.2s",
                }}
              >
                {loading ? "Saving..." : isEditMode ? "Save Changes" : "Complete Profile"}
              </button>
            </div>
          </form>
<div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid #2a2a2a' }}>
  <p style={{ color: '#7a6b6b', fontSize: 13, marginBottom: 12 }}>Data & Privacy</p>
  <button 
    onClick={() => {
      if (confirm('This will permanently delete your account and all data. This cannot be undone.')) {
        fetch('/api/profile', { method: 'DELETE' }).then(() => { window.location.href = '/'; });
      }
    }}
    style={{ background: 'none', border: '1px solid #3d1515', color: '#7a6b6b', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13 }}
  >
    Delete Account
  </button>
</div>
        </div>
      </div>

      {isEditMode && <BottomTabBar />}
    </div>
  );
}
