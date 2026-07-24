"use client";

import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import Link from "next/link";
import { Download, FlaskConical, RefreshCw, AlertCircle } from "lucide-react";
import { Session } from "@/lib/types";
import { useSessions } from "@/lib/useSessions";

const FLAG_COLORS: Record<string, { bg: string; text: string }> = {
  overpressure: { bg: "var(--red-bg)",    text: "var(--red-primary)" },
  "low-oxygen": { bg: "var(--orange-bg)", text: "var(--orange-primary)" },
  anomaly:      { bg: "var(--yellow-bg)", text: "var(--yellow-primary)" },
  info:         { bg: "var(--blue-bg)",   text: "var(--blue-primary)" },
};

function exportCSV(session: Session) {
  const rows = [
    ["Session ID",           session.id],
    ["Start Time",           session.startTime],
    ["Duration",             session.duration],
    ["Mode",                 session.mode],
    ["Avg O2 (%)",           session.avgOxygen.toFixed(1)],
    ["Max Pressure (cmH2O)", session.maxPressure.toFixed(1)],
    ["Min Pressure (cmH2O)", session.minPressure.toFixed(1)],
    ["Breath Count",         session.breathCount.toString()],
    ["Pump Runtime (s)",     session.pumpRuntime.toString()],
    ["Flags",                session.flags.map((f) => f.label).join("; ") || "None"],
  ];
  const csv  = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `session-${session.id}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function HistoryPage() {
  const { sessions, loading, error, refetch } = useSessions();

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
              <p className="settings-section-sub">
                {loading
                  ? "Loading sessions…"
                  : error
                  ? "Error loading sessions"
                  : `${sessions.length} session${sessions.length === 1 ? "" : "s"} recorded`}
              </p>
            </div>
            {/* Refresh button */}
            <button
              type="button"
              onClick={refetch}
              disabled={loading}
              aria-label="Refresh sessions"
              style={{
                background: "none", border: "none", cursor: loading ? "default" : "pointer",
                color: "var(--text-muted)", padding: 6, borderRadius: 8,
                transition: "color 150ms ease",
                animation: loading ? "spin 1s linear infinite" : "none",
              }}
            >
              <RefreshCw size={18} strokeWidth={2} />
            </button>
          </div>

          {/* ── Error state ── */}
          {error && (
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "14px 16px", borderRadius: 12,
              background: "var(--red-bg)", color: "var(--red-primary)",
              fontSize: 13, fontWeight: 600, marginBottom: 12,
            }}>
              <AlertCircle size={18} strokeWidth={2} />
              {error}
            </div>
          )}

          {/* ── Skeleton loading ── */}
          {loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton" style={{ height: 72, borderRadius: 14 }} />
              ))}
            </div>
          )}

          {/* ── Empty state ── */}
          {!loading && !error && sessions.length === 0 && (
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
          )}

          {/* ── Session list ── */}
          {!loading && !error && sessions.length > 0 && (
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

                      {/* In-progress badge */}
                      {s.duration === "In progress" && (
                        <span style={{
                          background: "var(--blue-bg)", color: "var(--blue-primary)",
                          fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 10,
                          letterSpacing: "0.3px", display: "flex", alignItems: "center", gap: 4,
                        }}>
                          <span style={{
                            width: 6, height: 6, borderRadius: "50%",
                            background: "var(--blue-primary)",
                            animation: "pulse 1.5s ease infinite",
                          }} />
                          Live
                        </span>
                      )}

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
