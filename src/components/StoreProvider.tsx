"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useStore } from "@/store/useStore";
import { useAuth } from "@/lib/auth-context";
import { Toast } from "./Toast";

interface StoreProviderProps {
  children: ReactNode;
}

export function StoreProvider({ children }: StoreProviderProps) {
  const { hydrate, syncFromServer, isLoading, isHydrated, settings } = useStore();
  const { currentFamily, user, isLoading: authLoading } = useAuth();
  const prevFamilyIdRef = useRef<number | null>(null);

  // Hydrate on initial mount (after auth is ready)
  useEffect(() => {
    if (!authLoading) {
      hydrate();
    }
  }, [hydrate, authLoading]);

  // Re-sync when family changes (e.g., after login)
  useEffect(() => {
    if (currentFamily && currentFamily.id !== prevFamilyIdRef.current) {
      prevFamilyIdRef.current = currentFamily.id;
      // Force re-fetch from server when family changes
      syncFromServer();
    }
  }, [currentFamily?.id, syncFromServer]);

  // Apply dark mode on mount and changes
  useEffect(() => {
    if (isHydrated && typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", settings.darkMode);
    }
  }, [isHydrated, settings.darkMode]);

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">טוען...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toast />
      <main className="min-h-screen pb-24">{children}</main>
    </>
  );
}

