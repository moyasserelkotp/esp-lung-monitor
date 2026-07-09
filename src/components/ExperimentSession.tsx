"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Square } from "lucide-react";

interface ExperimentSessionProps {
  sampleCount: number;
  breathCount: number;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function ExperimentSession({ sampleCount, breathCount }: ExperimentSessionProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [startSamples, setStartSamples] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  function startSession() {
    setIsRunning(true);
    setElapsed(0);
    setStartSamples(sampleCount);
  }

  function stopSession() {
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
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
        border: `1px solid ${isRunning ? 'var(--green-border)' : 'var(--border)'}`,
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
            <div style={{ fontSize: 13, fontWeight: 700, color: isRunning ? "var(--red-primary)" : "var(--text-secondary)", letterSpacing: "-0.3px" }}>
              {isRunning ? "Recording Active" : "No Session"}
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

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          {isRunning ? (
            <button 
              onClick={stopSession} 
              aria-label="Stop experiment session"
              style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "var(--red-bg)", color: "var(--red-primary)",
                border: "2px solid var(--red-border)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", transition: "transform 0.2s ease"
              }}
              onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.9)"}
              onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
            >
              <Square size={24} fill="currentColor" />
            </button>
          ) : (
            <button 
              onClick={startSession} 
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
            {isRunning ? "Recording..." : "Tap to start recording"}
          </span>
        </div>
      </div>

      {isRunning && (
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12,
        }}>
          {[
            { label: "Samples Logged", value: sessionSamples.toString() },
            { label: "Total Breaths", value: breathCount.toString() },
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
