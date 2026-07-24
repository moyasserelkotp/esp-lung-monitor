"use client";

import { Settings2, Activity } from "lucide-react";

interface PumpModeCardProps {
  pumpUsage: number;
}

export default function PumpModeCard({
  pumpUsage,
}: PumpModeCardProps) {
  return (
    <div className="dash-card">
      <div className="dash-section-title">System Controls</div>
      
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        
        {/* Pump PWM Row */}
        <div style={{ 
          background: "var(--bg-input)", border: "1px solid var(--border)", 
          borderRadius: "var(--radius-lg)", padding: "14px 16px",
          display: "flex", alignItems: "center", gap: 16
        }}>
          <div style={{ 
            width: 36, height: 36, borderRadius: "50%", background: "white",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--green-primary)", flexShrink: 0,
            boxShadow: "var(--shadow-xs)"
          }}>
            <Settings2 size={20} strokeWidth={2.5} />
          </div>
          
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.3px" }}>Pump PWM</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: "var(--green-primary)", letterSpacing: "-0.3px" }}>{pumpUsage}%</span>
            </div>
            {/* Progress Bar */}
            <div className="pump-bar-track">
              <div className="pump-bar-fill" style={{ width: `${pumpUsage}%` }} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
