"use client";

import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import Link from "next/link";
import { Clock, Download, FlaskConical } from "lucide-react";
import { Session, VentMode } from "@/lib/types";

// Mock session data matching the Session type with real flags arrays
const MOCK_SESSIONS: Session[] = [
  {
    id: "S-104",
    startTime: "Today, 10:45 AM",
    duration: "15 min",
    avgOxygen: 20.8,
    maxPressure: 24.1,
    minPressure: 12.3,
    breathCount: 224,
    pumpRuntime: 780,
    mode: "VCV",
    flags: [{ type: "overpressure", label: "1 flag" }],
  },
  {
    id: "S-103",
    startTime: "Yesterday, 3:20 PM",
    duration: "45 min",
    avgOxygen: 21.1,
    maxPressure: 19.8,
    minPressure: 14.2,
    breathCount: 675,
    pumpRuntime: 2340,
    mode: "PCV",
    flags: [],
  },
  {
    id: "S-102",
    startTime: "Jul 6, 09:15 AM",
    duration: "30 min",
    avgOxygen: 20.9,
    maxPressure: 20.5,
    minPressure: 13.9,
    breathCount: 450,
    pumpRuntime: 1560,
    mode: "VCV",
    flags: [],
  },
  {
    id: "S-101",
    startTime: "Jul 5, 11:00 AM",
    duration: "60 min",
    avgOxygen: 21.0,
    maxPressure: 18.9,
    minPressure: 14.5,
    breathCount: 902,
    pumpRuntime: 3120,
    mode: "SIMV",
    flags: [{ type: "low-oxygen", label: "1 flag" }],
  },
];

const FLAG_COLORS: Record<string, { bg: string; text: string }> = {
  overpressure: { bg: "var(--red-bg)",    text: "var(--red-primary)" },
  "low-oxygen": { bg: "var(--orange-bg)", text: "var(--orange-primary)" },
  anomaly:      { bg: "var(--yellow-bg)", text: "var(--yellow-primary)" },
  info:         { bg: "var(--blue-bg)",   text: "var(--blue-primary)" },
};

function exportCSV(session: Session) {
  const rows = [
    ["Session ID", session.id],
    ["Start Time", session.startTime],
    ["Duration", session.duration],
    ["Mode", session.mode],
    ["Avg O2 (%)", session.avgOxygen.toFixed(1)],
    ["Max Pressure (cmH2O)", session.maxPressure.toFixed(1)],
    ["Min Pressure (cmH2O)", session.minPressure.toFixed(1)],
    ["Breath Count", session.breathCount.toString()],
    ["Pump Runtime (s)", session.pumpRuntime.toString()],
    ["Flags", session.flags.map((f) => f.label).join("; ") || "None"],
  ];
  const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `session-${session.id}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function HistoryPage() {
  const sessions = MOCK_SESSIONS;

  return (
    <>
      <Navbar title="Session History" />

      <main className="page-content page-fade-in" style={{ paddingBottom: 100 }}>
        <section className="page-hero">
          <p className="page-hero-title">
            Browse past experiment sessions, review anomalies, and export reports.
          </p>
        </section>

        <div className="dash-card settings-card">
          <div className="settings-section-head">
            <div>
              <div className="dash-section-title">Past Experiments</div>
              <p className="settings-section-sub">{sessions.length} sessions recorded</p>
            </div>
          </div>

          {sessions.length === 0 ? (
            /* ── Empty state ─── */
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", gap: 12, padding: "40px 16px", textAlign: "center",
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: 18,
                background: "var(--green-bg)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <FlaskConical size={28} color="var(--green-primary)" strokeWidth={1.8} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.3px" }}>
                  No experiments yet
                </div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 6, lineHeight: 1.5 }}>
                  Start a recording session on the Charts screen to capture your first experiment.
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {sessions.map((s) => (
                <div key={s.id} className="history-session-card">
                  {/* Clickable row body */}
                  <Link
                    href={`/history/${s.id}`}
                    style={{ flex: 1, textDecoration: "none", color: "inherit" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <div className="history-session-title">{s.startTime}</div>

                      {/* Mode badge */}
                      <span style={{
                        background: "var(--green-bg)", color: "var(--green-primary)",
                        fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 10,
                        border: "1px solid var(--green-border)", letterSpacing: "0.3px",
                      }}>
                        {s.mode}
                      </span>

                      {/* Flag badges */}
                      {s.flags.map((flag, fi) => {
                        const colors = FLAG_COLORS[flag.type] ?? FLAG_COLORS.anomaly;
                        return (
                          <span
                            key={fi}
                            style={{
                              background: colors.bg, color: colors.text,
                              fontSize: 10, fontWeight: 700, padding: "2px 7px",
                              borderRadius: 10, letterSpacing: "0.3px",
                            }}
                          >
                            ⚠ {flag.label}
                          </span>
                        );
                      })}
                    </div>

                    <div className="history-session-meta">
                      {s.duration} · Avg O₂: {s.avgOxygen.toFixed(1)}% · Peak: {s.maxPressure.toFixed(1)} cmH₂O
                    </div>
                  </Link>

                  {/* Download button */}
                  <button
                    type="button"
                    className="history-download-btn"
                    aria-label={`Download CSV report for ${s.id}`}
                    title="Export as CSV"
                    onClick={() => exportCSV(s)}
                    style={{ transition: "transform 150ms ease" }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.1)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                  >
                    <Download size={18} strokeWidth={2} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </>
  );
}
