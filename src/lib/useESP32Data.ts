"use client";

import { useState, useEffect, useRef } from "react";
import { ref, onValue, off } from "firebase/database";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { rtdb, db } from "./firebase";
import { SensorReading, SystemStatus, SystemHealth, VentMode } from "./types";
import { useSettings, SystemSettings } from "./useSettings";

// ─── Derived status ────────────────────────────────────────────────────────────
function deriveStatus(reading: SensorReading, settings: SystemSettings): SystemStatus {
  if (reading.oxygen < 18 || reading.pressure >= settings.targetPressure + 4) return "Alarm";
  if (reading.oxygen < 19.5 || reading.pressure >= settings.targetPressure + 3) return "Warning";
  return "Normal";
}

const STATUS_MESSAGES: Record<SystemStatus, string> = {
  Normal:  "All parameters within safe operating range.",
  Warning: "One or more parameters approaching limits.",
  Alarm:   "ALERT: Critical parameter detected!",
  Offline: "Device offline.",
};

// ─── Defaults ─────────────────────────────────────────────────────────────────
const DEFAULT_READING: SensorReading = {
  oxygen: 0, pressure: 0, breathingRate: 0,
  pumpUsage: 0, inhaleValve: "CLOSED", exhaleValve: "CLOSED",
  breathState: "EXHALE", timestamp: 0,
  ieRatio: "1:2", mode: "VCV",
};

// ─── Write interval: max 1 Firestore write per 5 s to avoid quota burn ─────────
const FIRESTORE_WRITE_INTERVAL_MS = 5_000;

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useESP32Data() {
  const [data, setData]               = useState<SensorReading>(DEFAULT_READING);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate]   = useState<Date | null>(null);
  const [sampleCount, setSampleCount] = useState(0);
  const [status, setStatus]           = useState<SystemHealth>({
    status:        "Offline",
    message:       "Connecting to device…",
    sampleCount:   0,
    uptimeSeconds: 0,
  });

  const { settings } = useSettings();
  const settingsRef = useRef(settings);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const lastWriteRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const sensorRef = ref(rtdb, "liveData");

    const unsubscribe = onValue(
      sensorRef,
      (snapshot) => {                          // ← NOT async (Firebase doesn't await it)
        if (!snapshot.exists()) {
          setIsConnected(false);
          setStatus((s) => ({ ...s, status: "Offline", message: "No data received from device." }));
          return;
        }

        const raw = snapshot.val();

        const reading: SensorReading = {
          oxygen:        Number(raw.oxygen        ?? 0),
          pressure:      Number(raw.pressure      ?? 0),
          breathingRate: Number(raw.cycleRate     ?? raw.breathingRate ?? 0),
          pumpUsage:     Number(raw.pumpPwm       ?? raw.pumpUsage    ?? 0),
          inhaleValve:   raw.inhaleValve  ?? "CLOSED",
          exhaleValve:   raw.exhaleValve  ?? "CLOSED",
          breathState:   raw.breathState  ?? "EXHALE",

          timestamp:     Number(raw.timestamp    ?? Date.now()),
          ieRatio:       raw.ieRatio      ?? "1:2",
          mode:          (raw.mode as VentMode)  ?? "VCV",
        };

        setData(reading);
        setIsConnected(true);
        setLastUpdate(new Date());
        setSampleCount((c) => c + 1);

        const sysStatus = deriveStatus(reading, settingsRef.current);
        setStatus((s) => ({
          status:        sysStatus,
          message:       STATUS_MESSAGES[sysStatus],
          sampleCount:   s.sampleCount + 1,
          uptimeSeconds: Math.floor((Date.now() - startTimeRef.current) / 1000),
        }));

        // ── Throttled Firestore write-back for history charts ─────────────────
        // Wrapped in a self-invoking async IIFE so the synchronous onValue
        // callback stays non-async (Firebase requirement) while we can still await.
        const now = Date.now();
        if (now - lastWriteRef.current >= FIRESTORE_WRITE_INTERVAL_MS) {
          lastWriteRef.current = now;
          void (async () => {
            try {
              await addDoc(collection(db, "readings"), {
                oxygen:        reading.oxygen,
                pressure:      reading.pressure,
                breathingRate: reading.breathingRate,
                pumpUsage:     reading.pumpUsage,

                breathState:   reading.breathState,
                mode:          reading.mode,
                ieRatio:       reading.ieRatio,
                timestamp:     serverTimestamp(), // server-side for accurate ordering
              });
            } catch (err) {
              // Non-fatal: history just misses this sample
              console.warn("Firestore write-back failed:", err);
            }
          })();
        }
      },
      (error) => {
        console.error("Firebase RTDB error:", error);
        setIsConnected(false);
        setStatus((s) => ({ ...s, status: "Offline", message: "Connection error." }));
      }
    );

    return () => off(sensorRef, "value", unsubscribe);
  }, []);

  return { data, status, isConnected, lastUpdate, sampleCount };
}
