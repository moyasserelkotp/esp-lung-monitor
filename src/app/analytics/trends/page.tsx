"use client";

import { useState } from "react";
import { useESP32Data } from "@/lib/useESP32Data";
import { useHistoricalData } from "@/lib/useHistoricalData";
import { TimeRange } from "@/lib/types";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { ChevronLeft, TrendingUp, TrendingDown, Minus, Activity, Droplets } from "lucide-react";
import Link from "next/link";
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Label, ReferenceLine
} from "recharts";

const TIME_RANGES: TimeRange[] = ["1H", "6H", "24H", "7D"];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(255, 255, 255, 0.95)", backdropFilter: "blur(10px)",
      border: "1px solid rgba(255, 255, 255, 0.5)",
      borderRadius: 12, padding: "10px 14px",
      boxShadow: "0 8px 32px rgba(15,23,42,0.08)",
      fontSize: 11, fontFamily: "Inter, sans-serif",
    }}>
      <div style={{ color: "var(--text-muted)", marginBottom: 6, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", fontSize: 10 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 2 }}>
          <span style={{ width: 8, height: 8, background: p.color, display: "inline-block", borderRadius: "50%" }} />
          <span style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 12 }}>{p.name}: {p.value?.toFixed?.(1)}</span>
        </div>
      ))}
    </div>
  );
}

export default function TrendsPage() {
  const [activeRange, setActiveRange] = useState<TimeRange>("6H");
  const { data: live, isConnected } = useESP32Data();
  const { data: histData, loading } = useHistoricalData(activeRange);

  // Compute stats from historical data
  const pressureValues = histData.map((d) => d.pressure).filter(Boolean);
  const oxygenValues = histData.map((d) => d.oxygen).filter(Boolean);
  const avgPressure = pressureValues.length ? pressureValues.reduce((a, b) => a + b, 0) / pressureValues.length : 0;
  const maxPressure = pressureValues.length ? Math.max(...pressureValues) : 0;
  const minPressure = pressureValues.length ? Math.min(...pressureValues) : 0;
  const avgOxygen = oxygenValues.length ? oxygenValues.reduce((a, b) => a + b, 0) / oxygenValues.length : 0;

  const oxygenTrend = oxygenValues.length > 4
    ? oxygenValues[oxygenValues.length - 1] - oxygenValues[Math.floor(oxygenValues.length / 2)]
    : 0;

  return (
    <>
      <Navbar title="Trends (Full View)" isOnline={isConnected} />

      <main className="page-content page-fade-in" style={{ paddingBottom: 100 }}>
        {/* Back link */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
          <Link href="/analytics" style={{ display: "flex", alignItems: "center", gap: 4, textDecoration: "none", color: "var(--green-primary)", fontWeight: 700, fontSize: 14 }}>
            <ChevronLeft size={20} />
            Back to Analytics
          </Link>
        </div>

        {/* Time Range Tabs */}
        <div className="time-tabs" role="tablist" aria-label="Time range selection" style={{ marginBottom: 16 }}>
          {TIME_RANGES.map((range) => (
            <button
              key={range}
              role="tab"
              aria-selected={activeRange === range}
              className={`time-tab${activeRange === range ? " active" : ""}`}
              onClick={() => setActiveRange(range)}
            >
              {range}
            </button>
          ))}
        </div>

        {/* Main Chart Card */}
        <div className="dash-card" style={{ padding: "16px 8px", marginBottom: 16 }}>
          {/* Legend */}
          <div style={{ display: "flex", gap: 16, marginBottom: 16, paddingLeft: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--green-primary)" }} />
              Pressure (cmH₂O)
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--cyan-primary)" }} />
              Oxygen (%)
            </div>
          </div>

          <div style={{ height: 260, margin: "0 -8px" }}>
            {loading ? (
              <div className="skeleton" style={{ width: "100%", height: "100%", borderRadius: "var(--radius-xl)" }} />
            ) : histData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={histData} margin={{ top: 10, right: 16, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="pressureGradFull" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--green-primary)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="var(--green-primary)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="oxygenGradFull" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--cyan-primary)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="var(--cyan-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: "var(--text-muted)", fontWeight: 500 }} tickLine={false} axisLine={false} interval="preserveStartEnd" dy={8} />
                  <YAxis yAxisId="left" domain={[0, 40]} tick={{ fontSize: 10, fill: "var(--text-muted)", fontWeight: 500 }} tickLine={false} axisLine={false} tickCount={5} dx={-8}>
                    <Label value="Pressure" angle={-90} position="insideLeft" offset={0} style={{ fill: 'var(--green-primary)', fontSize: 11, fontWeight: 700 }} />
                  </YAxis>
                  <YAxis yAxisId="right" orientation="right" domain={[15, 25]} tick={{ fontSize: 10, fill: "var(--text-muted)", fontWeight: 500 }} tickLine={false} axisLine={false} tickCount={5} dx={8}>
                    <Label value="O₂ %" angle={90} position="insideRight" offset={0} style={{ fill: 'var(--cyan-primary)', fontSize: 11, fontWeight: 700 }} />
                  </YAxis>
                  <ReferenceLine yAxisId="right" y={21} stroke="var(--cyan-primary)" strokeDasharray="3 3" strokeOpacity={0.5} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: "var(--border-strong)", strokeWidth: 1, strokeDasharray: "3 3" }} />
                  <Area yAxisId="left" type="monotone" dataKey="pressure" name="Pressure" stroke="var(--green-primary)" strokeWidth={2.5} fill="url(#pressureGradFull)" dot={false} activeDot={{ r: 4, fill: "white", stroke: "var(--green-primary)", strokeWidth: 2 }} />
                  <Area yAxisId="right" type="monotone" dataKey="oxygen" name="Oxygen" stroke="var(--cyan-primary)" strokeWidth={2.5} fill="url(#oxygenGradFull)" dot={false} activeDot={{ r: 4, fill: "white", stroke: "var(--cyan-primary)", strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, color: "var(--text-disabled)" }}>
                <Activity size={32} strokeWidth={1.5} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>No data for this range yet</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        {!loading && histData.length > 0 && (
          <>
            {/* Pressure Stats */}
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", marginBottom: 10, paddingLeft: 4, textTransform: "uppercase", letterSpacing: "0.5px"}}>
              Pressure Analysis
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
              {[
                { label: "Avg", value: avgPressure.toFixed(1), unit: "cmH₂O", color: "var(--green-primary)" },
                { label: "Peak", value: maxPressure.toFixed(1), unit: "cmH₂O", color: "var(--orange-primary)" },
                { label: "Min", value: minPressure.toFixed(1), unit: "cmH₂O", color: "var(--green-primary)" },
              ].map(({ label, value, unit, color }) => (
                <div key={label} style={{
                  background: "var(--bg-card)", border: "1px solid var(--border)",
                  borderRadius: "var(--radius-lg)", padding: "12px",
                  textAlign: "center", boxShadow: "var(--shadow-xs)"
                }}>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color, letterSpacing: "-0.5px", marginTop: 4 }}>{value}</div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 500, marginTop: 2 }}>{unit}</div>
                </div>
              ))}
            </div>

            {/* Oxygen Summary Card */}
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 10, paddingLeft: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Oxygen Summary
            </div>
            <div style={{
              background: "var(--bg-card)", border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)", padding: "16px",
              boxShadow: "var(--shadow-xs)", display: "flex", alignItems: "center", gap: 16
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                background: "var(--cyan-bg)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Droplets size={24} color="var(--cyan-primary)" strokeWidth={2} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Average O₂ Concentration</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
                  <span style={{ fontSize: 26, fontWeight: 800, color: avgOxygen >= 20.5 ? "var(--green-primary)" : avgOxygen >= 19.5 ? "var(--orange-primary)" : "var(--red-primary)", letterSpacing: "-1px" }}>
                    {avgOxygen.toFixed(2)}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-muted)" }}>%</span>
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                  {oxygenTrend > 0.05 ? (
                    <><TrendingUp size={12} color="var(--green-primary)" /> <span style={{ color: "var(--green-primary)", fontWeight: 600 }}>Rising</span></>
                  ) : oxygenTrend < -0.05 ? (
                    <><TrendingDown size={12} color="var(--red-primary)" /> <span style={{ color: "var(--red-primary)", fontWeight: 600 }}>Declining</span></>
                  ) : (
                    <><Minus size={12} /> <span>Stable</span></>
                  )}
                  <span>· Target: 21.0%</span>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700 }}>SAMPLES</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.5px" }}>{histData.length}</div>
              </div>
            </div>
          </>
        )}

        {/* Empty state when no data */}
        {!loading && histData.length === 0 && (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: 12, padding: "48px 24px", textAlign: "center",
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-xs)"
          }}>
            <div style={{ width: 56, height: 56, borderRadius: 18, background: "var(--green-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Activity size={28} color="var(--green-primary)" strokeWidth={2} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.3px" }}>No Historical Data</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 6, lineHeight: 1.5 }}>
                Data will appear here once the device starts logging. Try a different time range or connect your ESP32.
              </div>
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </>
  );
}
