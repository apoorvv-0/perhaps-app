"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { SessionPayload } from "@/lib/auth/session-core";

interface AuthContextType {
  session: SessionPayload | null;
  isLoading: boolean;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  isLoading: true,
  refreshSession: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setSession(data.session);
      } else {
        setSession(null);
      }
    } catch (error) {
      console.error("Failed to fetch session", error);
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    const roviaraUrl = process.env.NEXT_PUBLIC_ROVIARA_URL || 'https://roviara-web.vercel.app';
    window.location.href = `${roviaraUrl}/api/auth/logout?redirect=` + encodeURIComponent(window.location.origin);
  };

  useEffect(() => {
    refreshSession();
  }, []);

  return (
    <AuthContext.Provider value={{ session, isLoading, refreshSession, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
