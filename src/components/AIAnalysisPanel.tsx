"use client";

import { AIAnalysisResult, AIInsight } from "@/lib/aiAnalysis";
import { ShieldCheck, Activity, Lightbulb, TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";
import StatusIcon from "./StatusIcon";

interface AIAnalysisPanelProps {
  analysis: AIAnalysisResult;
}

const statusColors: Record<AIAnalysisResult["overallStatus"], string> = {
  Excellent: "var(--green-primary)",
  Good:      "var(--green-primary)",
  Warning:   "var(--yellow-primary)",
  Critical:  "var(--red-primary)",
};

const insightColors: Record<AIInsight["type"], string> = {
  success:  "var(--green-primary)",
  info:     "var(--green-primary)",
  warning:  "var(--yellow-primary)",
  critical: "var(--red-primary)",
};

export default function AIAnalysisPanel({ analysis }: AIAnalysisPanelProps) {
  const color = statusColors[analysis.overallStatus];

  const getInsightStatus = (type: AIInsight["type"]) => {
    switch (type) {
      case "success":  return "Healthy";
      case "info":     return "Attention";
      case "warning":  return "Attention";
      case "critical": return "Critical";
      default:         return "Attention";
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Overall Status - Apple Health Style */}
      <div className="card" style={{ padding: "20px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: `linear-gradient(135deg, ${color}, ${color}99)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", flexShrink: 0,
            boxShadow: `0 8px 16px ${color}30`
          }}>
            <StatusIcon status={analysis.overallStatus === "Excellent" || analysis.overallStatus === "Good" ? "Healthy" : analysis.overallStatus === "Warning" ? "Attention" : "Critical"} size={28} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>System Health</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.5px", marginTop: 2 }}>{analysis.overallStatus}</div>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, marginTop: 4 }}>
              {analysis.summary}
            </p>
          </div>
        </div>
      </div>

      {/* O2 Prediction - Activity Widget Style */}
      <div className="card" style={{ padding: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <Activity size={16} color="var(--cyan-primary)" strokeWidth={2.5} />
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>O₂ Trend Prediction</div>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
          {/* Connecting line */}
          <div style={{ position: "absolute", top: "24px", left: "10%", right: "10%", height: 2, background: "var(--border)", zIndex: 0 }} />
          
          {[
            { label: "Now", rawValue: analysis.predictedO2in5min + analysis.oxygenConsumptionRate * 5 },
            { label: "In 5 min", rawValue: analysis.predictedO2in5min },
            { label: "In 10 min", rawValue: analysis.predictedO2in10min },
          ].map(({ label, rawValue }, i) => {
            const color2 = rawValue >= 20.5 ? "var(--green-primary)" : rawValue >= 19.5 ? "var(--orange-primary)" : "var(--red-primary)";
            return (
              <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 1 }}>
                <div style={{ 
                  background: "var(--bg-card)", padding: "0 8px",
                  fontSize: 18, fontWeight: 800, color: color2, letterSpacing: "-0.5px",
                  display: "flex", alignItems: "center", gap: 4
                }}>
                  {rawValue.toFixed(1)}<span style={{ fontSize: 12, fontWeight: 600 }}>%</span>
                  {i > 0 && analysis.oxygenConsumptionRate < -0.1 ? <TrendingUp size={14} color={color2} /> :
                   i > 0 && analysis.oxygenConsumptionRate > 0.1 ? <TrendingDown size={14} color={color2} /> :
                   i > 0 ? <Minus size={14} color={color2} /> : null}
                </div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, marginTop: 4 }}>{label}</div>
              </div>
            );
          })}
        </div>
        {analysis.oxygenConsumptionRate > 0 && (
          <div style={{ marginTop: 12, fontSize: 11, color: "var(--text-muted)", textAlign: "center", background: "var(--bg-input)", padding: "6px", borderRadius: 8 }}>
            Consumption rate: ~<span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{(analysis.oxygenConsumptionRate * 60).toFixed(3)}%/hr</span>
          </div>
        )}
      </div>

      {/* Insights - iOS Settings Group Style */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8, paddingLeft: 4 }}>System Insights</div>
        <div style={{ 
          background: "var(--bg-card)", border: "1px solid var(--border)", 
          borderRadius: "var(--radius-lg)", overflow: "hidden",
          boxShadow: "var(--shadow-sm)"
        }}>
          {analysis.insights.map((insight, i) => (
            <div key={i} style={{
              display: "flex", gap: 12, alignItems: "center",
              padding: "12px 16px",
              borderBottom: i < analysis.insights.length - 1 ? "1px solid var(--border)" : "none",
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                background: `${insightColors[insight.type]}15`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <StatusIcon status={getInsightStatus(insight.type)} size={16} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{insight.title}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2, lineHeight: 1.4 }}>{insight.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Suggestions - Actionable Cards */}
      {analysis.suggestions.length > 0 && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8, paddingLeft: 4 }}>Recommendations</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {analysis.suggestions.map((s, i) => (
              <div key={i} style={{ 
                display: "flex", gap: 12, alignItems: "flex-start",
                background: "var(--bg-card)", border: "1px solid var(--border)",
                padding: "12px 16px", borderRadius: "var(--radius-lg)",
                boxShadow: "var(--shadow-xs)"
              }}>
                <div style={{ color: "var(--green-primary)", marginTop: 2 }}>
                  <Lightbulb size={18} strokeWidth={2.5} />
                </div>
                <span style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fault Detection */}
      {analysis.faults.length > 0 && (
        <div style={{ 
          background: "var(--red-bg)", border: "1px solid var(--red-border)",
          borderRadius: "var(--radius-lg)", padding: "16px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, color: "var(--red-primary)" }}>
            <AlertTriangle size={16} strokeWidth={2.5} />
            <div style={{ fontSize: 13, fontWeight: 700 }}>Faults Detected</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {analysis.faults.map((f, i) => (
              <div key={i} style={{
                fontSize: 13, color: "var(--red-primary)", lineHeight: 1.5,
                fontWeight: 500, display: "flex", gap: 8
              }}>
                <span style={{ opacity: 0.5 }}>•</span> {f}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
