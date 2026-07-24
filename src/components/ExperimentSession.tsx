"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Square } from "lucide-react";
import { useESP32 } from "@/lib/ESP32Context";
import { useModeStore } from "@/lib/useModeStore";
import {
  startSession as firestoreStartSession,
  finishSession as firestoreFinishSession,
} from "@/lib/useSessions";
import { SensorReading } from "@/lib/types";

interface ExperimentSessionProps {
  sampleCount: number;
  breathCount: number;
  data: SensorReading;   // ← passed from parent, no extra RTDB listener
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function ExperimentSession({ sampleCount, breathCount, data }: ExperimentSessionProps) {
  const [isRunning, setIsRunning]       = useState(false);
  const [elapsed, setElapsed]           = useState(0);
  const [startSamples, setStartSamples] = useState(0);
  const [isSaving, setIsSaving]         = useState(false);

  // Track session stats while running
  const sessionIdRef   = useRef<string | null>(null);
  const intervalRef    = useRef<NodeJS.Timeout | null>(null);
  const maxPressureRef = useRef(0);
  const minPressureRef = useRef(999);
  const o2SumRef       = useRef(0);
  const o2CountRef     = useRef(0);

  const { mode } = useModeStore();
  // data comes from props (parent already has the shared context subscription)

  // Accumulate stats from live sensor data while recording
  useEffect(() => {
    if (!isRunning) return;
    if (data.pressure > maxPressureRef.current) maxPressureRef.current = data.pressure;
    if (data.pressure < minPressureRef.current && data.pressure > 0) minPressureRef.current = data.pressure;
    o2SumRef.current   += data.oxygen;
    o2CountRef.current += 1;
  }, [data, isRunning]);

  async function handleStart() {
    // Reset accumulators
    maxPressureRef.current = 0;
    minPressureRef.current = 999;
    o2SumRef.current       = 0;
    o2CountRef.current     = 0;

    setIsRunning(true);
    setElapsed(0);
    setStartSamples(sampleCount);

    try {
      sessionIdRef.current = await firestoreStartSession(mode);
    } catch (err) {
      console.error("Failed to create Firestore session:", err);
    }
  }

  async function handleStop() {
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (!sessionIdRef.current) return;

    const avgOxygen   = o2CountRef.current > 0
      ? parseFloat((o2SumRef.current / o2CountRef.current).toFixed(2))
      : 0;
    const maxPressure = parseFloat(maxPressureRef.current.toFixed(2));
    const minPressure = minPressureRef.current === 999 ? 0 : parseFloat(minPressureRef.current.toFixed(2));

    // Derive flags
    const flags: { type: "overpressure" | "low-oxygen" | "anomaly" | "info"; label: string }[] = [];
    if (maxPressure > 25) flags.push({ type: "overpressure", label: "Over-pressure detected" });
    if (avgOxygen < 19.5) flags.push({ type: "low-oxygen",  label: "Low O₂ average" });

    setIsSaving(true);
    try {
      await firestoreFinishSession(sessionIdRef.current, {
        avgOxygen,
        maxPressure,
        minPressure,
        breathCount,
        pumpRuntime: elapsed,
        flags,
      });
    } catch (err) {
      console.error("Failed to save session to Firestore:", err);
    } finally {
      setIsSaving(false);
      sessionIdRef.current = null;
    }
  }

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning]);

  const sessionSamples = isRunning ? sampleCount - startSamples : 0;

  return (
    <div className="dash-card">
      <div className="dash-section-title">Experiment Session</div>

      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: isRunning ? "var(--green-bg)" : "var(--bg-input)",
        border: `1px solid ${isRunning ? "var(--green-border)" : "var(--border)"}`,
        borderRadius: "var(--radius-xl)", padding: "20px",
        transition: "all var(--transition-normal)"
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{
              width: 10, height: 10, borderRadius: "50%",
              background: isRunning ? "var(--red-primary)" : "var(--text-disabled)",
              boxShadow: isRunning ? "0 0 12px rgba(239, 68, 68, 0.4)" : "none",
              animation: isRunning ? "pulse-dot 2s ease-in-out infinite" : "none"
            }} />
            <div style={{
              fontSize: 13, fontWeight: 700,
              color: isRunning ? "var(--red-primary)" : "var(--text-secondary)",
              letterSpacing: "-0.3px"
            }}>
              {isSaving ? "Saving session…" : isRunning ? "Recording Active" : "No Session"}
            </div>
          </div>
          <div style={{
            fontSize: 28, fontWeight: 600, color: "var(--text-primary)",
            fontFamily: "Inter, sans-serif", fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.5px", lineHeight: 1
          }}>
            {formatDuration(elapsed)}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          {isRunning ? (
            <button
              onClick={handleStop}
              aria-label="Stop experiment session"
              disabled={isSaving}
              style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "var(--red-bg)", color: "var(--red-primary)",
                border: "2px solid var(--red-border)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: isSaving ? "default" : "pointer",
                opacity: isSaving ? 0.6 : 1,
                transition: "transform 0.2s ease"
              }}
              onMouseDown={(e) => { if (!isSaving) e.currentTarget.style.transform = "scale(0.9)"; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
            >
              <Square size={24} fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={handleStart}
              aria-label="Start experiment session"
              style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "var(--green-bg)", color: "var(--green-primary)",
                border: "2px solid var(--green-border)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", transition: "transform 0.2s ease", paddingLeft: 4
              }}
              onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.9)"}
              onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
            >
              <Play size={26} fill="currentColor" />
            </button>
          )}
          <span style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)" }}>
            {isSaving ? "Saving…" : isRunning ? "Recording..." : "Tap to start recording"}
          </span>
        </div>
      </div>

      {isRunning && (
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12,
        }}>
          {[
            { label: "Samples Logged", value: sessionSamples.toString() },
            { label: "Total Breaths",  value: breathCount.toString() },
          ].map(({ label, value }) => (
            <div key={label} style={{
              background: "var(--bg-input)", border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)", padding: "12px", textAlign: "center"
            }}>
              <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--green-primary)", marginTop: 4, letterSpacing: "-0.5px" }}>{value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
