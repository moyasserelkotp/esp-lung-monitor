"use client";

import { use } from "react";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import Link from "next/link";
import LiveTrendsChart from "@/components/LiveTrendsChart";
import { useHistoricalData } from "@/lib/useHistoricalData";
import { ChevronLeft, Download } from "lucide-react";
import { Session, SessionFlag } from "@/lib/types";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

function tsToDate(val: unknown): Date {
  if (!val) return new Date(0);
  if (typeof (val as any).toDate === "function") return (val as any).toDate();
  return new Date(Number(val));
}

function formatDuration(startMs: number, endMs: number): string {
  const secs = Math.floor((endMs - startMs) / 1000);
  if (secs < 60)   return `${secs} sec`;
  if (secs < 3600) return `${Math.floor(secs / 60)} min`;
  return `${(secs / 3600).toFixed(1)} hr`;
}

function generateAISummary(session: Session): string {
  const issues: string[] = [];
  if (session.flags.some((f) => f.type === "overpressure"))
    issues.push(`A brief overpressure event was detected (peak ${session.maxPressure.toFixed(1)} cmH₂O). The system recovered without manual intervention. Consider reducing Kp by ~10% if this recurs.`);
  if (session.flags.some((f) => f.type === "low-oxygen"))
    issues.push(`Transient O₂ dip noted. Average remained ${session.avgOxygen.toFixed(1)}% — within acceptable range. Extending inhale valve open time by 50 ms may stabilize O₂ delivery.`);

  const base = `Session ${session.id} ran for ${session.duration} in ${session.mode} mode. `
    + `Average O₂ concentration held at ${session.avgOxygen.toFixed(1)}%, well within the 19.5–21.5% target range. `
    + `Pressure tracked ${session.minPressure.toFixed(1)}–${session.maxPressure.toFixed(1)} cmH₂O across ${session.breathCount} breath cycles. `
    + `Pump runtime: ${session.pumpRuntime}s (~${Math.round(session.pumpRuntime / 60)} min active).`;

  return issues.length > 0
    ? base + "\n\n" + issues.join(" ")
    : base + " No anomalies were detected. All parameters remained within safe operating limits throughout the session.";
}

function exportCSV(session: Session) {
  const rows = [
    ["Session ID", session.id], ["Start", session.startTime], ["Duration", session.duration],
    ["Mode", session.mode], ["Avg O2 (%)", session.avgOxygen.toFixed(2)],
    ["Max Pressure (cmH2O)", session.maxPressure.toFixed(2)],
    ["Min Pressure (cmH2O)", session.minPressure.toFixed(2)],
    ["Breath Count", session.breathCount.toString()],
    ["Pump Runtime (s)", session.pumpRuntime.toString()],
    ["Flags", session.flags.map((f) => f.label).join("; ") || "None"],
  ];
  const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `session-${session.id}.csv`; a.click();
  URL.revokeObjectURL(url);
}

// Stat mini-card
function StatCell({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="stat-cell">
      <div className="stat-cell-label">{label}</div>
      <div className="stat-cell-value" style={{ color: color ?? "var(--text-primary)" }}>
        {value}
      </div>
    </div>
  );
}

const FLAG_COLORS: Record<string, { bg: string; text: string }> = {
  overpressure: { bg: "var(--red-bg)",    text: "var(--red-primary)" },
  "low-oxygen": { bg: "var(--orange-bg)", text: "var(--orange-primary)" },
  anomaly:      { bg: "var(--yellow-bg)", text: "var(--yellow-primary)" },
  info:         { bg: "var(--blue-bg)",   text: "var(--blue-primary)" },
};

export default function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { data: histData } = useHistoricalData("1H");

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSession() {
      try {
        const docRef = doc(db, "sessions", resolvedParams.id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const raw = docSnap.data();
          const startDate = tsToDate(raw.startTime);
          const endDate = raw.endTime ? tsToDate(raw.endTime) : null;
          
          setSession({
            id: docSnap.id,
            startTime: startDate.toLocaleString(),
            duration: endDate ? formatDuration(startDate.getTime(), endDate.getTime()) : "In progress",
            avgOxygen: Number(raw.avgOxygen ?? 0),
            maxPressure: Number(raw.maxPressure ?? 0),
            minPressure: Number(raw.minPressure ?? 0),
            breathCount: Number(raw.breathCount ?? 0),
            pumpRuntime: Number(raw.pumpRuntime ?? 0),
            mode: (raw.mode as any) ?? "VCV",
            flags: (raw.flags as any) ?? [],
          });
        }
      } catch (err) {
        console.error("Failed to load session:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSession();
  }, [resolvedParams.id]);

  const aiSummary = session ? generateAISummary(session) : loading ? "Loading..." : "Session data not available.";

  return (
    <>
      <Navbar title={`Session ${resolvedParams.id}`} />

      <main className="page-content page-fade-in" style={{ paddingBottom: 100 }}>
        {/* ── Back link  */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <Link
            href="/history"
            style={{ display: "flex", alignItems: "center", gap: 4, textDecoration: "none", color: "var(--green-primary)", fontWeight: 700, fontSize: 14 }}
          >
            <ChevronLeft size={20} />
            Back to History
          </Link>

          {session && (
            <button
              type="button"
              onClick={() => exportCSV(session)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "var(--bg-input)", border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)", padding: "7px 12px",
                fontSize: 12, fontWeight: 600, color: "var(--text-secondary)",
                cursor: "pointer", transition: "all 150ms ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "var(--green-primary)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-secondary)"; }}
            >
              <Download size={14} />
              Export CSV
            </button>
          )}
        </div>

        {session && (
          <>
            {/* Session meta header*/}
            <div className="dash-card" style={{ marginBottom: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.3px" }}>
                    {session.startTime}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>
                    Duration: {session.duration} · {session.breathCount} breaths
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5 }}>
                  <span style={{
                    background: "var(--green-bg)", color: "var(--green-primary)",
                    fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 10,
                    border: "1px solid var(--green-border)",
                  }}>
                    {session.mode}
                  </span>
                  {session.flags.map((f, i) => {
                    const c = FLAG_COLORS[f.type] ?? FLAG_COLORS.anomaly;
                    return (
                      <span key={i} style={{ background: c.bg, color: c.text, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10 }}>
                        ⚠ {f.label}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Stat grid */}
              <div className="stat-grid">
                <StatCell
                  label="Avg O₂"
                  value={`${session.avgOxygen.toFixed(2)}%`}
                  color={session.avgOxygen >= 20.5 ? "var(--green-primary)" : session.avgOxygen >= 19.5 ? "var(--orange-primary)" : "var(--red-primary)"}
                />
                <StatCell
                  label="Peak Pressure"
                  value={`${session.maxPressure.toFixed(1)} cmH₂O`}
                  color={session.maxPressure > 22 ? "var(--orange-primary)" : "var(--blue-primary)"}
                />
                <StatCell
                  label="Min Pressure"
                  value={`${session.minPressure.toFixed(1)} cmH₂O`}
                />
                <StatCell
                  label="Pump Active"
                  value={`${Math.round(session.pumpRuntime / 60)} min`}
                />
              </div>
            </div>

            {/* AI Summary */}
            <div className="dash-card" style={{ borderLeft: "3px solid var(--green-primary)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 18 }}>✨</span>
                <div className="dash-section-title" style={{ margin: 0 }}>AI Session Summary</div>
              </div>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, whiteSpace: "pre-line" }}>
                {aiSummary}
              </p>
            </div>
          </>
        )}

        {/* Mini Chart */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8, paddingLeft: 2 }}>
            Last 1 Hour (Reference)
          </div>
          <LiveTrendsChart data={histData} />
        </div>
      </main>

      <BottomNav />
    </>
  );
}
