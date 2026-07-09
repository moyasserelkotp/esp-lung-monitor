"use client";

import { useState, useEffect, useCallback } from "react";
import { VentMode } from "./types";

const STORAGE_KEY = "lung-vent-mode";
const DEFAULT_MODE: VentMode = "VCV";

// Module-level listeners for cross-component sync without Context
const listeners = new Set<(mode: VentMode) => void>();

function getStoredMode(): VentMode {
  if (typeof window === "undefined") return DEFAULT_MODE;
  const stored = localStorage.getItem(STORAGE_KEY) as VentMode | null;
  return stored === "VCV" || stored === "PCV" || stored === "SIMV"
    ? stored
    : DEFAULT_MODE;
}

function setStoredMode(mode: VentMode) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, mode);
  listeners.forEach((fn) => fn(mode));
}

export function useModeStore() {
  const [mode, setModeState] = useState<VentMode>(DEFAULT_MODE);

  useEffect(() => {
    // Initialize from storage on mount
    setModeState(getStoredMode());

    // Subscribe to cross-component updates
    const listener = (newMode: VentMode) => setModeState(newMode);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);

  const setMode = useCallback((next: VentMode) => {
    setModeState(next);
    setStoredMode(next);
  }, []);

  return { mode, setMode };
}
