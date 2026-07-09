"use client";

import { useRef, useState } from "react";
import { useESP32Data } from "@/lib/useESP32Data";
import { useHistoricalData } from "@/lib/useHistoricalData";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import BreathingHeroCard from "@/components/BreathingHeroCard";
import GaugeCard from "@/components/GaugeCard";
import ValveCard from "@/components/ValveCard";
import PumpModeCard from "@/components/PumpModeCard";
import LiveTrendsChart from "@/components/LiveTrendsChart";

const MODE_FULL_NAMES: Record<string, string> = {
  VCV: "Volume Control Ventilation",
  PCV: "Pressure Control Ventilation",
  SIMV: "Synchronized IMV",
};

export default function DashboardPage() {
  const { data, status, isConnected, sampleCount, lastUpdate } = useESP32Data();
  const { data: histData } = useHistoricalData("1H");

  // Safe breath state cast
  const breathState = (["INHALE", "HOLD", "EXHALE"].includes(data.breathState)
    ? data.breathState
    : "INHALE") as "INHALE" | "HOLD" | "EXHALE";

  // Get AI analysis summary for preview
  const aiSummary =
    data.oxygen > 20.5 && data.pressure > 14 && data.pressure < 22
      ? "System is operating within normal parameters. All vital indicators are stable."
      : data.oxygen < 19.5
      ? "⚠ Oxygen below threshold — consider extending inhale duration."
      : "Monitoring active — minor deviations detected. View AI analysis.";

  const alarms: string[] = [];
  if (data.pressure > 30) alarms.push(`Over-Pressure Detected (${data.pressure} cmH₂O)`);
  else if (data.pressure > 25) alarms.push(`High Pressure Warning (${data.pressure} cmH₂O)`);
  if (data.oxygen < 18) alarms.push(`Critical Low Oxygen (${data.oxygen}%)`);
  else if (data.oxygen < 19.5) alarms.push(`Low Oxygen Warning (${data.oxygen}%)`);
  if (!isConnected) alarms.push("Device Connection Lost");

  return (
    <>
      <Navbar
        isOnline={isConnected}
        hasAlarm={alarms.length > 0}
        lastSyncTime={lastUpdate}
        alarms={alarms}
      />

      <main className="page-content page-fade-in" id="dashboard-main">

        <BreathingHeroCard
          breathState={breathState}
          breathingRate={data.breathingRate}
          ieRatio={data.ieRatio}
        />

        <div className="page-stack">

        <div className="gauge-grid">
          <GaugeCard
            title="Airway Pressure"
            subtitle="cmH₂O"
            value={data.pressure}
            min={0}
            max={40}
            target={18}
            unit="cmH₂O"
            color="#10b981"
            warningThreshold={25}
            criticalThreshold={35}
          />
          <GaugeCard
            title="Oxygen Conc."
            subtitle="%"
            value={data.oxygen}
            min={0}
            max={100}
            target={21}
            unit="%"
            color="#06b6d4"
            criticalThreshold={95}
          />
        </div>

        {/*  Valve Status  */}
        <ValveCard
          inhaleState={data.inhaleValve as "OPEN" | "CLOSED"}
          exhaustState={data.exhaleValve as "OPEN" | "CLOSED"}
        />

        {/*  Pump + Mode  */}
        <PumpModeCard
          pumpUsage={data.pumpUsage}
          mode={MODE_FULL_NAMES[data.mode] ?? "Volume Control Ventilation"}
          modeAbbrev={data.mode}
        />

        {/*  Live Trends Chart  */}
        <LiveTrendsChart data={histData} />

        {/*  AI Consultation Preview  */}
          <a href="/ai" className="ai-insight-card" aria-label="Open AI Consultation">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12, background: "var(--green-primary)",
                display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0,
                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.4)"
              }}>
                <span style={{ fontSize: 20 }}>✨</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.3px" }}>AI Insights</span>
                  <span style={{ background: "var(--green-primary)", color: "white", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 10, textTransform: "uppercase", letterSpacing: "0.5px" }}>Live</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4, lineHeight: 1.4 }}>{aiSummary}</div>
              </div>
              <div style={{ color: "var(--text-disabled)" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
            </div>
          </a>

        </div>
      </main>

      <BottomNav />
    </>
  );
}
