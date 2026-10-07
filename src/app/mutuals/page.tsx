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

  // The directory page already handles showing read-only choices when results are open
  return <DirectoryPage />;
}
