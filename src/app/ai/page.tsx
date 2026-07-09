"use client";

import { useState, useMemo } from "react";
import { useESP32Data } from "@/lib/useESP32Data";
import { useHistoricalData } from "@/lib/useHistoricalData";
import { analyzeSystemData } from "@/lib/aiAnalysis";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import AIAnalysisPanel from "@/components/AIAnalysisPanel";
import AIChat from "@/components/AIChat";

type AITab = "analysis" | "chat";

export default function AIPage() {
  const [activeTab, setActiveTab] = useState<AITab>("analysis");
  const { data: live, status, isConnected } = useESP32Data();
  const { data: history } = useHistoricalData("1H");

  const analysis = useMemo(
    () => analyzeSystemData(live, history),
    [live.oxygen, live.pressure, live.pumpUsage, history.length]
  );

  return (
    <>
      <Navbar title="AI Consultation" isOnline={isConnected} hasAlarm={status.status === "Alarm"} />

      <main className="page-content page-fade-in" id="ai-main">
        {/* Glassmorphic Header */}
        <div className="ai-glass-header">
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div className="ai-orb">
              <span style={{ fontSize: 20 }}>✨</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.5px" }}>AI Assistant</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>
                Real-time system intelligence
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>O₂ Level</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--cyan-primary)", letterSpacing: "-0.5px" }}>{live.oxygen.toFixed(1)}%</div>
            </div>
          </div>
        </div>

        {/* iOS-Style Segmented Control */}
        <div className="segmented-control" role="tablist" aria-label="AI mode">
          <div 
            className="segmented-indicator" 
            style={{ 
              width: "50%", 
              left: activeTab === "analysis" ? "4px" : "calc(50% - 4px)" 
            }} 
          />
          {(["analysis", "chat"] as AITab[]).map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === tab}
              className={`segmented-btn ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
              id={`ai-tab-${tab}`}
            >
              {tab === "analysis" ? "Auto Analysis" : "AI Chat"}
            </button>
          ))}
        </div>

        {activeTab === "analysis" && (
          <AIAnalysisPanel analysis={analysis} />
        )}

        {activeTab === "chat" && (
          <AIChat sensorData={live} />
        )}
      </main>

      <BottomNav />
    </>
  );
}
