"use client";

import { useState } from "react";
import { useESP32 } from "@/lib/ESP32Context";
import { useHistoricalData } from "@/lib/useHistoricalData";
import { TimeRange } from "@/lib/types";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import LiveTrendsChart from "@/components/LiveTrendsChart";
import ExperimentSession from "@/components/ExperimentSession";
import Link from "next/link";
import { TrendingUp } from "lucide-react";

const TIME_RANGES: TimeRange[] = ["Live", "1H", "6H", "24H", "7D"];

export default function AnalyticsPage() {
  const [activeRange, setActiveRange] = useState<TimeRange>("1H");
  const { data: live, isConnected, sampleCount, lastUpdate } = useESP32();
  const { data: histData, loading } = useHistoricalData(activeRange);

  const alarms: string[] = [];
  if (live.pressure > 30) alarms.push(`Over-Pressure Detected (${live.pressure} cmH₂O)`);
  else if (live.pressure > 25) alarms.push(`High Pressure Warning (${live.pressure} cmH₂O)`);
  if (live.oxygen < 18) alarms.push(`Critical Low Oxygen (${live.oxygen}%)`);
  else if (live.oxygen < 19.5) alarms.push(`Low Oxygen Warning (${live.oxygen}%)`);
  if (!isConnected) alarms.push("Device Connection Lost");

  return (
    <>
      <Navbar
        title="Historical Statistics"
        isOnline={isConnected}
        hasAlarm={alarms.length > 0}

        lastSyncTime={lastUpdate}
        alarms={alarms}
      />

      <main className="page-content page-fade-in" id="analytics-main">
        <section className="page-hero">
          <p className="page-hero-title">
            Review sensor trends and session statistics across different time ranges.
          </p>
        </section>

        <div className="time-tabs" role="tablist" aria-label="Time range selection">
          {TIME_RANGES.map((range) => (
            <button
              key={range}
              role="tab"
              aria-selected={activeRange === range}
              className={`time-tab${activeRange === range ? " active" : ""}`}
              onClick={() => setActiveRange(range)}
              id={`tab-${range}`}
            >
              {range}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[180, 100, 100].map((h, i) => (
              <div key={i} className="skeleton" style={{ height: h, borderRadius: "var(--radius-xl)" }} />
            ))}
          </div>
        ) : (
          <>
            <div className="dash-card settings-card">
              <div className="settings-section-head">
                <div>
                  <div className="dash-section-title">Current State Snapshot</div>
                  <p className="settings-section-sub">Live readings from the ESP32</p>
                </div>
              </div>

              <div className="stat-grid">
                {[
                  { label: "O₂", value: `${live.oxygen.toFixed(1)}%`, color: "var(--cyan-primary)", sub: "Target: 21.0%" },
                  { label: "Pressure", value: `${live.pressure.toFixed(1)}`, color: "var(--green-primary)", sub: "cmH₂O" },
                  { label: "Rate", value: `${live.breathingRate} BPM`, color: "var(--green-primary)", sub: "Cycles / min" },
                  { label: "Pump", value: `${live.pumpUsage}%`, color: "var(--orange-primary)", sub: "Duty cycle" },
                ].map(({ label, value, color, sub }) => (
                  <div key={label} className="stat-cell">
                    <div className="stat-cell-label">{label}</div>
                    <div className="stat-cell-value" style={{ color }}>{value}</div>
                    <div className="stat-cell-sub">{sub}</div>
                  </div>
                ))}
              </div>
            </div>

            <LiveTrendsChart data={histData} />

            <div className="dash-card settings-card">
              <div className="settings-section-head">
                <div>
                  <div className="dash-section-title">Experiment Log</div>
                  <p className="settings-section-sub">Session activity summary</p>
                </div>
                <Link
                  href="/analytics/trends"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    color: "var(--green-primary)",
                    fontWeight: 700,
                    fontSize: 13,
                    textDecoration: "none",
                  }}
                >
                  <TrendingUp size={16} />
                  Full trends
                </Link>
              </div>
              <ExperimentSession sampleCount={sampleCount} breathCount={Math.floor(sampleCount / 8)} data={live} />
            </div>
          </>
        )}
      </main>

      <BottomNav />
    </>
  );
}
