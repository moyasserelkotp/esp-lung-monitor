"use client";

import { Wind } from "lucide-react";

interface ValveStatusCardProps {
  inhaleState: "OPEN" | "CLOSED";
  exhaustState: "OPEN" | "CLOSED";
}

export default function ValveStatusCard({ inhaleState, exhaustState }: ValveStatusCardProps) {
  const valves = [
    { label: "Inhale Valve", state: inhaleState },
    { label: "Exhale Valve", state: exhaustState },
  ] as const;

  return (
    <div className="dash-card">
      <div className="dash-section-title">Valve Status</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {valves.map(({ label, state }) => {
          const isOpen = state === "OPEN";
          const color = isOpen ? "var(--green-primary)" : "var(--text-disabled)";
          const bgColor = isOpen ? "var(--green-bg)" : "var(--bg-input)";

          return (
            <div
              key={label}
              style={{
                background: bgColor,
                borderRadius: "var(--radius-lg)",
                padding: "14px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                border: `1px solid ${isOpen ? 'var(--green-border)' : 'var(--border)'}`,
                transition: "all var(--transition-normal)",
              }}
              role="status"
              aria-label={`${label}: ${state}`}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ 
                  width: 36, height: 36, borderRadius: "50%",
                  background: isOpen ? "white" : "var(--bg-card)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: color,
                  boxShadow: isOpen ? "0 4px 12px rgba(16, 185, 129, 0.2)" : "var(--shadow-xs)"
                }}>
                  <Wind size={20} strokeWidth={2.5} style={{ animation: isOpen ? "pulse-dot 2s infinite" : "none" }} />
                </div>
                
                {/* Status Indicator Dot */}
                <div style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: isOpen ? "var(--green-primary)" : "var(--text-disabled)",
                  boxShadow: isOpen ? "var(--green-glow)" : "none",
                  marginTop: 4
                }} />
              </div>
              
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: isOpen ? "var(--green-primary)" : "var(--text-secondary)", letterSpacing: "-0.3px" }}>{label}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: isOpen ? "var(--green-primary)" : "var(--text-muted)", opacity: isOpen ? 0.8 : 1 }}>
                  {state}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
