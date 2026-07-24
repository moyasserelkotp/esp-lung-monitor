"use client";

import { createContext, useContext, ReactNode } from "react";
import { useESP32Data } from "./useESP32Data";

// ─── Context type mirrors the useESP32Data return shape ───────────────────────
type ESP32ContextValue = ReturnType<typeof useESP32Data>;

const ESP32Context = createContext<ESP32ContextValue | null>(null);

/**
 * Wrap your root layout (or page) with this provider.
 * All descendant components (Navbar, ExperimentSession, etc.) that call
 * useESP32() will share the SAME single Firebase RTDB subscription.
 */
export function ESP32Provider({ children }: { children: ReactNode }) {
  const value = useESP32Data();
  return <ESP32Context.Provider value={value}>{children}</ESP32Context.Provider>;
}

/**
 * Call this hook in any component that needs ESP32 data.
 * Replaces direct useESP32Data() calls — avoids duplicate Firebase listeners.
 */
export function useESP32(): ESP32ContextValue {
  const ctx = useContext(ESP32Context);
  if (!ctx) {
    throw new Error("useESP32() must be used inside <ESP32Provider>. Wrap your layout.");
  }
  return ctx;
}
