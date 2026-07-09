"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, Bell, AlertTriangle, X } from "lucide-react";
import { useESP32Data } from "@/lib/useESP32Data";
import { useModeStore } from "@/lib/useModeStore";

interface NavbarProps {
  title?: string;
  isOnline?: boolean;
  hasAlarm?: boolean;
  activeMode?: string;
  lastSyncTime?: Date | null;
  alarms?: string[];
}

function LungIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="navbar-lung-icon" aria-hidden="true">
      <rect x="14" y="2" width="4" height="8" rx="2" fill="#06b6d4" />
      <path d="M14 8 Q9 10 7 15" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M18 8 Q23 10 25 15" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M6 16 Q1 20 1 25 Q1 30 6 31 Q11 32 13 28 L13 15 Q11 14 6 16 Z" fill="#10b981" />
      <path d="M26 16 Q31 20 31 25 Q31 30 26 31 Q21 32 19 28 L19 15 Q21 14 26 16 Z" fill="#06b6d4" />
      <path d="M6 16 Q1 20 1 25 Q1 30 6 31 Q11 32 13 28 L13 15 Q11 14 6 16 Z" stroke="#06b6d4" strokeWidth="1.5" fill="none" opacity="0.5" />
      <path d="M26 16 Q31 20 31 25 Q31 30 26 31 Q21 32 19 28 L19 15 Q21 14 26 16 Z" stroke="#06b6d4" strokeWidth="1.5" fill="none" opacity="0.5" />
    </svg>
  );
}

export default function Navbar({ 
  title = "Artificial Lung", 
  isOnline: propIsOnline, 
  hasAlarm: propHasAlarm,
  activeMode: propActiveMode,
  lastSyncTime: propLastSyncTime,
  alarms: propAlarms
}: NavbarProps) {
  const { data, isConnected, lastUpdate } = useESP32Data();
  const { mode: storedMode } = useModeStore();

  const isOnline = propIsOnline !== undefined ? propIsOnline : isConnected;
  const lastSyncTime = propLastSyncTime !== undefined ? propLastSyncTime : lastUpdate;
  const activeMode = propActiveMode !== undefined ? propActiveMode : storedMode;

  const computedAlarms: string[] = [];
  if (data.pressure > 30) computedAlarms.push(`Over-Pressure Detected (${data.pressure} cmH₂O)`);
  else if (data.pressure > 25) computedAlarms.push(`High Pressure Warning (${data.pressure} cmH₂O)`);
  if (data.oxygen < 18) computedAlarms.push(`Critical Low Oxygen (${data.oxygen}%)`);
  else if (data.oxygen < 19.5) computedAlarms.push(`Low Oxygen Warning (${data.oxygen}%)`);
  if (!isConnected) computedAlarms.push("Device Connection Lost");

  const alarms = propAlarms !== undefined ? propAlarms : computedAlarms;
  const actualHasAlarm = propHasAlarm !== undefined ? propHasAlarm : alarms.length > 0;

  const [dismissedAlarms, setDismissedAlarms] = useState<string[]>([]);
  const [syncText, setSyncText] = useState("just now");
  const [isStale, setIsStale] = useState(false);

  // Update sync time string
  useEffect(() => {
    if (!lastSyncTime) return;
    const interval = setInterval(() => {
      const seconds = Math.floor((Date.now() - lastSyncTime.getTime()) / 1000);
      setIsStale(seconds > 5);
      if (seconds < 5) setSyncText("just now");
      else if (seconds < 60) setSyncText(`${seconds}s ago`);
      else setSyncText(`${Math.floor(seconds/60)}m ago`);
    }, 1000);
    return () => clearInterval(interval);
  }, [lastSyncTime]);

  // If alarms prop changes, un-dismiss them if they are still active
  useEffect(() => {
    setDismissedAlarms(prev => {
      const filtered = prev.filter(a => !alarms.includes(a));
      return filtered.length === prev.length ? prev : filtered;
    });
  }, [JSON.stringify(alarms)]);

  const activeAlarms = alarms.filter(a => !dismissedAlarms.includes(a));
  
  // Determine connection dot color
  let dotColor = '#9ca3af'; // offline
  if (isOnline) {
    dotColor = isStale ? '#f59e0b' : '#10b981'; // amber if stale, green if active
  }

  return (
    <>
      <header className="navbar">
        <button className="navbar-menu-btn" aria-label="Open menu">
          <Menu size={24} strokeWidth={2} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center' }}>
          <LungIcon />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="navbar-title">{title}</span>
              {activeMode && (
                <Link href="/settings" style={{ textDecoration: 'none' }}>
                  <span style={{ 
                    background: 'var(--green-bg)', color: 'var(--green-primary)', 
                    fontSize: '10px', fontWeight: 700, padding: '2px 6px', 
                    borderRadius: '10px', letterSpacing: '0.5px', cursor: 'pointer'
                  }}>
                    {activeMode}
                  </span>
                </Link>
              )}
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, boxShadow: isOnline ? 'var(--green-glow)' : 'none' }} />
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {isOnline ? "Connected" : "Offline"}
              </span>
              {isOnline && lastSyncTime && (
                <span style={{ fontSize: '10px', color: 'var(--text-disabled)', fontWeight: 500, marginLeft: 2 }}>
                  • last synced {syncText}
                </span>
              )}
            </div>
          </div>
        </div>

        <button className="navbar-menu-btn" aria-label="Notifications">
          <Bell size={24} strokeWidth={2} />
          {actualHasAlarm && (
            <span style={{ position: 'absolute', top: -4, right: -4, width: 14, height: 14, background: '#ef4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '9px', fontWeight: 700, border: '2px solid var(--bg-card)' }}>!</span>
          )}
        </button>
      </header>

      {/* Alarm Banner */}
      {activeAlarms.length > 0 && (
        <div style={{ 
          position: 'fixed', top: 'var(--nav-height)', left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: '480px', background: '#ef4444', color: 'white',
          padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: 12,
          zIndex: 99, boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
          animation: 'slideDown 0.3s ease-out'
        }}>
          <AlertTriangle size={20} strokeWidth={2.5} style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.3px', marginBottom: 2 }}>Critical Alarm</div>
            <div style={{ fontSize: 12, fontWeight: 500, opacity: 0.9 }}>{activeAlarms[0]}</div>
            {activeAlarms.length > 1 && (
              <div style={{ fontSize: 11, fontWeight: 700, marginTop: 4, background: 'rgba(0,0,0,0.15)', display: 'inline-block', padding: '2px 6px', borderRadius: 4 }}>
                +{activeAlarms.length - 1} more
              </div>
            )}
          </div>
          <button 
            onClick={() => setDismissedAlarms(prev => [...prev, ...activeAlarms])}
            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.8, padding: 4 }}
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>
      )}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideDown { from { transform: translate(-50%, -100%); } to { transform: translate(-50%, 0); } }
      `}} />
    </>
  );
}