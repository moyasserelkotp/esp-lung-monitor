import React from "react";

interface BreathingStateCardProps {
  breathState?: "INHALE" | "EXHALE" | "HOLD";
  breathingRate?: number;
  mode?: string;
}

function SmallLungIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="14" y="2" width="4" height="8" rx="2" fill="#10b981" />
      <path d="M14 8 Q9 10 7 15" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 8 Q23 10 25 15" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 16 Q1 20 1 25 Q1 30 6 31 Q11 32 13 28 L13 15 Q11 14 6 16 Z" fill="#10b981" />
      <path d="M26 16 Q31 20 31 25 Q31 30 26 31 Q21 32 19 28 L19 15 Q21 14 26 16 Z" fill="#10b981" />
    </svg>
  );
}

function Sparkline() {
  return (
    <svg width="60" height="16" viewBox="0 0 60 16" fill="none">
      <path d="M0 12 L4 12 L6 8 L10 14 L14 4 L18 12 L22 12 L26 14 L30 10 L34 14 L38 6 L42 12 L46 12 L50 9 L54 12 L60 12" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function BreathingStateCard({
  breathState = "INHALE",
  breathingRate = 12,
  mode = "VCV"
}: BreathingStateCardProps) {
  
  let stateColor = "#10b981";
  let stateText = "Taking air in...";
  if (breathState === "EXHALE") {
    stateColor = "#06b6d4";
    stateText = "Letting air out...";
  } else if (breathState === "HOLD") {
    stateColor = "#f59e0b";
    stateText = "Holding pressure...";
  }

  return (
    <div style={{
      background: 'var(--bg-card)',
      borderRadius: '24px',
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      margin: '16px 20px',
      boxShadow: 'var(--shadow-sm)',
      border: '1px solid var(--border)'
    }}>
      
      {/* Left Section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'var(--green-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <SmallLungIcon />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Breathing State</span>
          <span style={{ fontSize: '20px', fontWeight: 700, color: stateColor, marginTop: '2px', letterSpacing: '0.5px' }}>{breathState}</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {stateText}
          </span>
          <div style={{ marginTop: '4px' }}>
            <Sparkline />
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ width: '1px', height: '60px', background: 'var(--border)', margin: '0 16px' }} />

      {/* Right Section */}
      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)' }}>Cycle</span>
          <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: '2px 0' }}>{breathingRate}</span>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>/ min</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)' }}>Mode</span>
          <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: '2px 0' }}>{mode}</span>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Ventilation</span>
        </div>
      </div>

    </div>
  );
}
