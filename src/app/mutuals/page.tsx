"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import DirectoryPage from "../directory/page";
import ResultsPage from "../results/page";

export default function MutualsRouter() {
  const { session, isLoading } = useAuth();
  const router = useRouter();
  const [phase, setPhase] = useState<string>("LOADING");

  useEffect(() => {
    if (!isLoading && !session) {
      router.push("/");
      return;
    }
    if (!isLoading && session) {
      fetch("/api/admin/event")
        .then(res => res.json())
        .then(data => {
          setPhase(data.event?.status || "UNKNOWN");
        })
        .catch(() => setPhase("UNKNOWN"));
    }
  }, [session, isLoading, router]);

  if (isLoading || phase === "LOADING") return <div className="min-h-screen bg-brand-wine" />;

  // If results are open, show results!
  if (phase === "RESULTS_OPEN") {
    return <ResultsPage />;
  }

  // Otherwise (registration, choosing, matching), show the directory
  // The directory page already handles showing "Directory Locked" if it's not CHOOSING_OPEN
  return <DirectoryPage />;
}
