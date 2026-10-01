"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import BottomTabBar from "@/components/BottomTabBar";

type MatchStatus =
  | { state: "loading" }
  | { state: "not_open" }
  | { state: "no_match" }
  | { state: "matched_hidden"; hint: { college: string; batch: string } }
  | { state: "matched_revealed"; matchedUser: { firstName: string; lastName: string; instagramHandle: string; college: string; batch: string } };

export default function ResultsPage() {
  const { session, isLoading } = useAuth();
  const router = useRouter();

  const [matchStatus, setMatchStatus] = useState<MatchStatus>({ state: "loading" });
  const [couponCode, setCouponCode] = useState("");
  const [revealing, setRevealing] = useState(false);
  const [revealError, setRevealError] = useState("");

  useEffect(() => {
    if (!isLoading) {
      if (!session) router.push("/");
      else if (!session.phoneVerified) router.push("/verify-phone");
      else if (!session.profileComplete) router.push("/profile");
      else fetchResult();
    }
  }, [session, isLoading, router]);

  const fetchResult = async () => {
    setMatchStatus({ state: "loading" });
    try {
      const res = await fetch("/api/results");
      if (res.status === 403) {
        setMatchStatus({ state: "not_open" });
        return;
      }
      const data = await res.json();
      if (!data.matched) {
        setMatchStatus({ state: "no_match" });
      } else if (data.revealed) {
        setMatchStatus({ state: "matched_revealed", matchedUser: data.matchedUser });
      } else {
        setMatchStatus({ state: "matched_hidden", hint: data.hint });
      }
    } catch {
      setMatchStatus({ state: "not_open" });
    }
  };

  const handleReveal = async (e: React.FormEvent) => {
    e.preventDefault();
    setRevealing(true);
    setRevealError("");
    try {
      const res = await fetch("/api/results/reveal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ couponCode: couponCode.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (res.ok) {
        setMatchStatus({ state: "matched_revealed", matchedUser: data.matchedUser });
        setCouponCode("");
      } else {
        setRevealError(data.error || "Invalid or already used coupon.");
      }
    } catch {
      setRevealError("Network error. Please try again.");
    } finally {
      setRevealing(false);
    }
  };

  if (isLoading || !session) return null;

  return (
    <div style={{ minHeight: "100vh", paddingBottom: '80px', background: '#0d0d0d' }}>

      {/* Header */}
      <div style={{ padding: "32px 24px 0", maxWidth: 480, margin: "0 auto" }}>
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
            marginBottom: 24,
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
      </div>

      <main style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 24px 24px",
        minHeight: "calc(100vh - 120px)",
      }}>
        <div style={{ width: "100%", maxWidth: 440 }}>

          {/* Loading */}
          {matchStatus.state === "loading" && (
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: 36,
                height: 36,
                border: "2px solid #8b1a1a",
                borderTopColor: "transparent",
                borderRadius: "50%",
                margin: "0 auto 16px",
                animation: "spin 1s linear infinite",
              }} />
              <p style={{ color: "#7a6b6b", fontSize: "14px" }}>Checking your results...</p>
            </div>
          )}

          {/* Not open yet */}
          {matchStatus.state === "not_open" && (
            <div style={{
              textAlign: "center",
              background: "#151515",
              border: "1px solid #2a2a2a",
              borderRadius: "12px",
              padding: "40px 32px",
            }}>
              <div style={{
                width: 56,
                height: 56,
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
                fontSize: "26px",
                color: "#f5f0ee",
                fontWeight: 500,
                marginBottom: 8,
              }}>
                Results Not Available
              </h2>
              <p style={{ color: "#7a6b6b", fontSize: "14px", marginBottom: 28 }}>
                Results haven&apos;t been published yet. Check back soon.
              </p>
              <Link href="/dashboard" style={{
                display: "inline-block",
                background: "#8b1a1a",
                color: "#f5f0ee",
                borderRadius: "8px",
                padding: "12px 24px",
                fontSize: "14px",
                fontWeight: 600,
                textDecoration: "none",
                fontFamily: "'Inter', sans-serif",
              }}>
                Back to Dashboard
              </Link>
            </div>
          )}

          {/* No match */}
          {matchStatus.state === "no_match" && (
            <div style={{
              textAlign: "center",
              background: "#151515",
              border: "1px solid #2a2a2a",
              borderRadius: "12px",
              padding: "40px 32px",
            }}>
              <div style={{
                width: 56,
                height: 56,
                border: "1px solid #2a2a2a",
                borderRadius: "50%",
                margin: "0 auto 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7a6b6b" strokeWidth="1.5">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </div>
              <h2 style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "26px",
                color: "#f5f0ee",
                fontWeight: 500,
                marginBottom: 8,
              }}>
                No Mutual Match This Time
              </h2>
              <p style={{ color: "#7a6b6b", fontSize: "14px", lineHeight: 1.6, marginBottom: 28 }}>
                None of your choices picked you back. Don&apos;t worry — there&apos;s always the next event.
              </p>
              <Link href="/dashboard" style={{
                display: "inline-block",
                background: "#8b1a1a",
                color: "#f5f0ee",
                borderRadius: "8px",
                padding: "12px 24px",
                fontSize: "14px",
                fontWeight: 600,
                textDecoration: "none",
                fontFamily: "'Inter', sans-serif",
              }}>
                Back to Dashboard
              </Link>
            </div>
          )}

          {/* Matched — hidden (needs coupon) */}
          {matchStatus.state === "matched_hidden" && (
            <div style={{
              background: "#151515",
              border: "1px solid #5c1a1a",
              borderRadius: "12px",
              padding: "32px 28px",
            }}>
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <div style={{
                  width: 56,
                  height: 56,
                  border: "1px solid #5c1a1a",
                  borderRadius: "50%",
                  margin: "0 auto 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#1a0a0a",
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c9a0a0" strokeWidth="1.5">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </div>
                <h2 style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "28px",
                  color: "#f5f0ee",
                  fontWeight: 500,
                  margin: "0 0 8px",
                }}>
                  You Have a Mutual Match
                </h2>
                <p style={{ color: "#7a6b6b", fontSize: "13px" }}>
                  Someone from{" "}
                  <span style={{ color: "#c9a0a0", fontWeight: 600 }}>{matchStatus.hint.college}</span>
                  {" "}(Batch {matchStatus.hint.batch}) chose you back.
                </p>
              </div>

              <div style={{
                background: "#1a0d0d",
                border: "1px solid #3a1a1a",
                borderRadius: "8px",
                padding: "14px 16px",
                marginBottom: 20,
                fontSize: "12px",
                color: "#7a6b6b",
                lineHeight: 1.6,
              }}>
                To reveal their Instagram handle, enter the 8-character coupon code you received from the cashier.
              </div>

              <form onSubmit={handleReveal}>
                {revealError && (
                  <div style={{
                    marginBottom: 14,
                    padding: "10px 14px",
                    background: "#1e0a0a",
                    border: "1px solid #5c1a1a",
                    borderRadius: "8px",
                    color: "#dc2626",
                    fontSize: "13px",
                  }}>
                    {revealError}
                  </div>
                )}
                <div style={{ marginBottom: 16 }}>
                  <label style={{
                    display: "block",
                    fontSize: "12px",
                    color: "#7a6b6b",
                    marginBottom: "6px",
                    textTransform: "uppercase" as const,
                    letterSpacing: "0.08em",
                    fontWeight: 600,
                  }}>
                    Coupon Code
                  </label>
                  <input
                    type="text"
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                    maxLength={8}
                    style={{
                      width: "100%",
                      padding: "14px",
                      background: "#1e1e1e",
                      border: "1px solid #2a2a2a",
                      borderRadius: "8px",
                      color: "#f5f0ee",
                      fontSize: "22px",
                      fontFamily: "monospace",
                      letterSpacing: "0.25em",
                      textAlign: "center",
                      outline: "none",
                      boxSizing: "border-box" as const,
                    }}
                    placeholder="XXXXXXXX"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={revealing || couponCode.length !== 8}
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: "8px",
                    background: (revealing || couponCode.length !== 8) ? "#2a1a1a" : "#8b1a1a",
                    color: "#f5f0ee",
                    border: "none",
                    fontWeight: 700,
                    fontSize: "15px",
                    fontFamily: "'Inter', sans-serif",
                    cursor: (revealing || couponCode.length !== 8) ? "not-allowed" : "pointer",
                    transition: "background 0.2s",
                  }}
                >
                  {revealing ? "Unlocking..." : "Reveal My Match"}
                </button>
              </form>
            </div>
          )}

          {/* Matched — revealed */}
          {matchStatus.state === "matched_revealed" && (
            <div style={{
              background: "#151515",
              border: "1px solid #5c1a1a",
              borderRadius: "12px",
              padding: "32px 28px",
            }}>
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <div style={{
                  width: 56,
                  height: 56,
                  border: "1px solid #8b1a1a",
                  borderRadius: "50%",
                  margin: "0 auto 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#1a0808",
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#8b1a1a" stroke="#8b1a1a" strokeWidth="1">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </div>
                <h2 style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "28px",
                  color: "#f5f0ee",
                  fontWeight: 500,
                  margin: "0 0 6px",
                }}>
                  It&apos;s a Match
                </h2>
                <p style={{ color: "#7a6b6b", fontSize: "13px" }}>
                  You and your match chose each other.
                </p>
              </div>

              <div style={{
                background: "#1a0d0d",
                border: "1px solid #5c1a1a",
                borderRadius: "10px",
                padding: "24px",
                textAlign: "center",
                marginBottom: 20,
              }}>
                <p style={{ fontSize: "12px", color: "#7a6b6b", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Your mutual match is
                </p>
                <p style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "28px",
                  color: "#f5f0ee",
                  fontWeight: 500,
                  margin: "0 0 4px",
                }}>
                  {matchStatus.matchedUser.firstName} {matchStatus.matchedUser.lastName}
                </p>
                <p style={{ fontSize: "12px", color: "#7a6b6b", margin: "0 0 16px" }}>
                  {matchStatus.matchedUser.college} · Batch {matchStatus.matchedUser.batch}
                </p>
                <a
                  href={`https://instagram.com/${matchStatus.matchedUser.instagramHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    background: "#151515",
                    border: "1px solid #5c1a1a",
                    borderRadius: "8px",
                    padding: "10px 18px",
                    textDecoration: "none",
                  }}
                >
                  <span style={{ color: "#7a6b6b", fontSize: "12px" }}>Instagram</span>
                  <span style={{ color: "#c9a0a0", fontWeight: 700, fontSize: "16px" }}>
                    @{matchStatus.matchedUser.instagramHandle}
                  </span>
                </a>
              </div>

              <p style={{ textAlign: "center", fontSize: "11px", color: "#3d3030", marginBottom: 12 }}>
                Remember to be respectful and kind.
              </p>
              <Link href="/dashboard" style={{
                display: "block",
                textAlign: "center",
                fontSize: "13px",
                color: "#7a6b6b",
                textDecoration: "none",
              }}>
                Back to Dashboard
              </Link>
            </div>
          )}

        </div>
      </main>

      <BottomTabBar />
    </div>
  );
}
