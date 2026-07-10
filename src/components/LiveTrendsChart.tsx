"use client";

import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Label, ReferenceLine
} from "recharts";
import { HistoricalPoint } from "@/lib/types";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface LiveTrendsChartProps {
  data: HistoricalPoint[];
}

interface TooltipPayload {
  color: string;
  name: string;
  value: number;
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(255, 255, 255, 0.9)", backdropFilter: "blur(10px)",
      border: "1px solid rgba(255, 255, 255, 0.5)",
      borderRadius: 12, padding: "10px 14px",
      boxShadow: "0 8px 32px rgba(15,23,42,0.08)",
      fontSize: 11, fontFamily: "Inter, sans-serif",
    }}>
      <div style={{ color: "var(--text-muted)", marginBottom: 6, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", fontSize: 10 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 2 }}>
          <span style={{ width: 8, height: 8, background: p.color, display: "inline-block", borderRadius: "50%" }} />
          <span style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 12 }}>{p.name}: {p.value?.toFixed?.(1)}</span>
        </div>
      ))}
    </div>
  );
}

export default function LiveTrendsChart({ data }: LiveTrendsChartProps) {
  return (
    <div className="dash-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div className="dash-section-title" style={{ marginBottom: 2 }}>Live Trends</div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 500, paddingLeft: 4 }}>Last 15 Minutes</div>
        </div>
        <Link href="/analytics/trends" style={{ 
          display: "flex", alignItems: "center", gap: 4, 
          fontSize: 12, fontWeight: 700, color: "var(--green-primary)",
          textDecoration: "none", background: "var(--green-bg)",
          padding: "6px 10px", borderRadius: "var(--radius-full)"
        }}>
          View All
          <ChevronRight size={14} strokeWidth={2.5} />
        </Link>
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 16, paddingLeft: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, color: "var(--text-secondary)" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--green-primary)" }} />
          Pressure (cmH₂O)
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, color: "var(--text-secondary)" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--cyan-primary)" }} />
          Oxygen (%)
        </div>
      </div>

      <div style={{ height: 160, margin: "0 -8px" }}>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 16, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="pressureGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--green-primary)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--green-primary)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="oxygenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--cyan-primary)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--cyan-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: "var(--text-muted)", fontWeight: 500 }} tickLine={false} axisLine={false} interval="preserveStartEnd" dy={8} />
              <YAxis yAxisId="left" domain={[0, 40]} tick={{ fontSize: 10, fill: "var(--text-muted)", fontWeight: 500 }} tickLine={false} axisLine={false} tickCount={4} dx={-8}>
                <Label value="Pressure" angle={-90} position="insideLeft" offset={0} style={{ fill: 'var(--green-primary)', fontSize: 11, fontWeight: 700 }} />
              </YAxis>
              <YAxis yAxisId="right" orientation="right" domain={[18, 22]} tick={{ fontSize: 10, fill: "var(--text-muted)", fontWeight: 500 }} tickLine={false} axisLine={false} tickCount={4} dx={8}>
                <Label value="O₂ %" angle={90} position="insideRight" offset={0} style={{ fill: 'var(--cyan-primary)', fontSize: 11, fontWeight: 700 }} />
              </YAxis>
              <ReferenceLine yAxisId="right" y={21} stroke="var(--cyan-primary)" strokeDasharray="3 3" />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "var(--border-strong)", strokeWidth: 1, strokeDasharray: "3 3" }} />
              <Area yAxisId="left" type="monotone" dataKey="pressure" name="Pressure" stroke="var(--green-primary)" strokeWidth={2.5} fill="url(#pressureGrad)" dot={false} activeDot={{ r: 4, fill: "white", stroke: "var(--green-primary)", strokeWidth: 2 }} />
              <Area yAxisId="right" type="monotone" dataKey="oxygen" name="Oxygen" stroke="var(--cyan-primary)" strokeWidth={2.5} fill="url(#oxygenGrad)" dot={false} activeDot={{ r: 4, fill: "white", stroke: "var(--cyan-primary)", strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-disabled)", fontSize: 12, fontWeight: 600 }}>
            Loading trends...
          </div>
        )}
      </div>
    </div>
  );
}
