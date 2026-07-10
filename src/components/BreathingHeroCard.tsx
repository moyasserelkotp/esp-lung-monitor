import React from "react";
import { Activity, RefreshCw, Hexagon } from "lucide-react";

interface BreathingHeroCardProps {
  breathState?: "INHALE" | "EXHALE" | "HOLD";
  breathingRate?: number;
  ieRatio?: string;
}

function LungsImage({ className }: { className?: string }) {
  return (
    <svg className={`lung-svg ${className || ""}`} width="100%" height="100%" style={{ maxWidth: '280px', maxHeight: '300px' }} viewBox="0 0 200 220" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="lung-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>
      {/* Left Lung Outline */}
      <path d="M90 60 C50 60, 20 100, 20 160 C20 200, 60 210, 85 190 C95 180, 95 100, 90 60 Z" stroke="url(#lung-grad)" strokeWidth="2" fill="url(#lung-grad)" fillOpacity="0.1" />
      {/* Right Lung Outline */}
      <path d="M110 60 C150 60, 180 100, 180 160 C180 200, 140 210, 115 190 C105 180, 105 100, 110 60 Z" stroke="url(#lung-grad)" strokeWidth="2" fill="url(#lung-grad)" fillOpacity="0.1" />
      
      {/* Trachea */}
      <rect x="94" y="20" width="12" height="40" fill="url(#lung-grad)" fillOpacity="0.7" rx="3" />
      <path d="M90 25 L110 25 M90 35 L110 35 M90 45 L110 45 M90 55 L110 55" stroke="#fff" strokeWidth="2" strokeOpacity="0.3" />
      
      {/* Bronchi Left */}
      <path d="M98 60 L75 90 L60 100 M75 90 L75 120 L50 140 M75 120 L80 150 M60 100 L50 90 M60 100 L45 110" stroke="url(#lung-grad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {/* Bronchi Right */}
      <path d="M102 60 L125 90 L140 100 M125 90 L125 120 L150 140 M125 120 L120 150 M140 100 L150 90 M140 100 L155 110" stroke="url(#lung-grad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function BreathingHeroCard({
  breathState = "INHALE",
  breathingRate = 12,
  ieRatio = "1:2"
}: BreathingHeroCardProps) {
  
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
    <div className="dash-glass-panel" style={{
      display: 'flex',
      flexDirection: 'column',
      margin: '0 4px', // Aligns with page-stack padding of 0 4px
      padding: '20px',
      position: 'relative'
    }}>
      
      {/* Background ambient glow matching the light theme */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(6,182,212,0.05) 0%, rgba(255,255,255,0) 70%)',
        zIndex: 0
      }} />

      {/* Top Section: All Text */}
      <div style={{ display: 'flex', justifyContent: 'space-between', zIndex: 1, width: '100%', alignItems: 'flex-start' }}>
        
        {/* Left: Breathing State */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ 
              width: '28px', height: '28px', borderRadius: '50%', border: '1px solid #e5e7eb',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Activity size={14} color="#10b981" />
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>BREATHING STATE</span>
          </div>
          
          <div style={{ marginTop: '16px' }}>
            <div style={{ fontSize: '32px', fontWeight: 800, color: stateColor, letterSpacing: '-0.5px' }}>{breathState}</div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px', fontWeight: 500 }}>{stateText}</div>
          </div>
        </div>

        {/* Right: Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-end' }}>
          {/* Cycle Stats */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Cycle</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>{breathingRate}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>/min</span>
              </div>
            </div>
            <div style={{ 
              width: '36px', height: '36px', borderRadius: '50%', background: '#f0fdf4',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <RefreshCw size={18} color="#10b981" />
            </div>
          </div>

          {/* IE Ratio Stats */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>I:E Ratio</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>{ieRatio}</div>
            </div>
            <div style={{ 
              width: '36px', height: '36px', borderRadius: '50%', background: '#f0fdfa',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Hexagon size={18} color="#06b6d4" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Lungs Image */}
      <div style={{ 
        width: '100%',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        marginTop: '28px',
        marginBottom: '10px',
        zIndex: 1
      }}>
        <LungsImage className={breathState.toLowerCase()} />
      </div>

    </div>
  );
}
