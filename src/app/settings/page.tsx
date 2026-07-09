"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { Wind, Gauge, Settings2, Cloud, BellRing, Cpu, Check, Info, Loader2, Activity, Moon, Sun } from "lucide-react";
import { useESP32Data } from "@/lib/useESP32Data";
import { useTheme } from "@/lib/useTheme";
import { useModeStore } from "@/lib/useModeStore";
import { VentMode } from "@/lib/types";

const VENT_MODES = ["VCV", "PCV", "SIMV"] as const;
const IE_RATIOS = ["1:1", "1:2", "1:3", "1:4"] as const;

function getDeltaMeta(live: number, target: number, tolerance: number) {
  const delta = live - target;
  const abs = Math.abs(delta);
  if (abs <= tolerance) {
    return { label: "On target", className: "live-target-delta--ok", delta };
  }
  if (abs <= tolerance * 2) {
    return {
      label: delta > 0 ? `${abs.toFixed(1)} above` : `${abs.toFixed(1)} below`,
      className: "live-target-delta--warn",
      delta,
    };
  }
  return {
    label: delta > 0 ? `${abs.toFixed(1)} above` : `${abs.toFixed(1)} below`,
    className: "live-target-delta--bad",
    delta,
  };
}

export default function SettingsPage() {
  const [targetO2, setTargetO2] = useState<number | string>(21);
  const [targetPressure, setTargetPressure] = useState<number | string>(10);
  const [ieRatio, setIeRatio] = useState("1:2");
  const [ventMode, setVentMode] = useState("VCV");

  const { data, isConnected, lastUpdate } = useESP32Data();
  const { theme, setTheme } = useTheme();
  const { mode: storedMode, setMode } = useModeStore();
  const [syncText, setSyncText] = useState("just now");
  const [pulseChips, setPulseChips] = useState(false);

  // Sync initial ventMode from the mode store
  useEffect(() => {
    setVentMode(storedMode);
  }, [storedMode]);

  useEffect(() => {
    if (!lastUpdate) return;
    const interval = setInterval(() => {
      const seconds = Math.floor((Date.now() - lastUpdate.getTime()) / 1000);
      if (seconds < 5) setSyncText("just now");
      else if (seconds < 60) setSyncText(`${seconds}s ago`);
      else setSyncText(`${Math.floor(seconds / 60)}m ago`);
    }, 1000);
    return () => clearInterval(interval);
  }, [lastUpdate]);

  const [firebaseSync, setFirebaseSync] = useState(true);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [pidAutoTune, setPidAutoTune] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const o2Fill = ((Number(targetO2) - 15) / (30 - 15)) * 100;
  const pressureFill = ((Number(targetPressure) - 5) / (30 - 5)) * 100;

  const o2Delta = getDeltaMeta(data.oxygen, Number(targetO2), 0.5);
  const pressureDelta = getDeltaMeta(data.pressure, Number(targetPressure), 2);

  const handleSave = () => {
    setIsSaving(true);
    setSaved(false);
    setTimeout(() => {
      setMode(ventMode as VentMode);
      setIsSaving(false);
      setSaved(true);
      setPulseChips(true);
      setTimeout(() => setPulseChips(false), 400);
      setTimeout(() => setSaved(false), 2500);
    }, 1000);
  };

  const clampO2 = (raw: string) => {
    let val = parseFloat(raw);
    if (isNaN(val)) val = 21;
    setTargetO2(Math.max(15, Math.min(30, val)));
  };

  const clampPressure = (raw: string) => {
    let val = parseFloat(raw);
    if (isNaN(val)) val = 10;
    setTargetPressure(Math.max(5, Math.min(30, val)));
  };

  return (
    <>
      <Navbar title="Settings" />

      <main className="page-content page-fade-in" style={{ paddingBottom: 120 }}>
        <section className="settings-hero">

          <div className="settings-preview-chips">
            <span className={`settings-chip${pulseChips ? " settings-chip--pulse" : ""}`}>
              <span className="settings-chip-dot" />
              {ventMode}
            </span>
            <span className={`settings-chip${pulseChips ? " settings-chip--pulse" : ""}`}>{Number(targetO2)}% O₂</span>
            <span className={`settings-chip${pulseChips ? " settings-chip--pulse" : ""}`}>{Number(targetPressure)} cmH₂O</span>
            <span className={`settings-chip${pulseChips ? " settings-chip--pulse" : ""}`}>I:E {ieRatio}</span>
          </div>
        </section>

        <div className="dash-card settings-card">
          <div className="settings-section-head">
            <div>
              <div className="dash-section-title">Live vs Target</div>
              <p className="settings-section-sub">
                {isConnected ? "Comparing ESP32 readings to your setpoints" : "Waiting for device connection…"}
              </p>
            </div>
          </div>

          <div className="live-target-grid">
            <div className="live-target-card live-target-card--cyan">
              <div className="live-target-label">Oxygen</div>
              <div className="live-target-row">
                <span>Live</span>
                <span style={{ color: "var(--cyan-primary)" }}>{data.oxygen.toFixed(1)}%</span>
              </div>
              <div className="live-target-row">
                <span>Target</span>
                <span>{Number(targetO2)}%</span>
              </div>
              <span className={`live-target-delta ${o2Delta.className}`}>{o2Delta.label}</span>
            </div>

            <div className="live-target-card live-target-card--green">
              <div className="live-target-label">Pressure</div>
              <div className="live-target-row">
                <span>Live</span>
                <span style={{ color: "var(--green-primary)" }}>{data.pressure.toFixed(1)}</span>
              </div>
              <div className="live-target-row">
                <span>Target</span>
                <span>{Number(targetPressure)} cmH₂O</span>
              </div>
              <span className={`live-target-delta ${pressureDelta.className}`}>{pressureDelta.label}</span>
            </div>
          </div>
        </div>

        <div className="dash-card settings-card">
          <div className="settings-section-head">
            <div>
              <div className="dash-section-title">Control Parameters</div>
              <p className="settings-section-sub">Ventilation mode and target setpoints</p>
            </div>
          </div>

          <div className="settings-fields">
            <div className="settings-field">
              <div className="settings-field-head">
                <div className="settings-field-label">
                  <div className="settings-icon-badge settings-icon-badge--green">
                    <Activity size={16} strokeWidth={2.5} />
                  </div>
                  <span>Ventilation Mode</span>
                </div>
              </div>

              <div className="segmented-control segmented-control--3" role="group" aria-label="Ventilation mode">
                {VENT_MODES.map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setVentMode(mode)}
                    className={`segmented-btn segmented-btn--green${ventMode === mode ? " active" : ""}`}
                    aria-pressed={ventMode === mode}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <div className="settings-field">
              <div className="settings-field-head">
                <div className="settings-field-label">
                  <div className="settings-icon-badge settings-icon-badge--cyan">
                    <Wind size={16} strokeWidth={2.5} />
                  </div>
                  <span>Target Oxygen (O₂)</span>
                </div>
                <div className="settings-value-badge settings-value-badge--cyan">
                  <input
                    type="number"
                    className="settings-value-input"
                    value={targetO2}
                    onChange={(e) => setTargetO2(e.target.value)}
                    onBlur={(e) => clampO2(e.target.value)}
                    aria-label="Target oxygen percentage"
                  />
                  <span className="settings-value-unit">%</span>
                </div>
              </div>

              <div className="slider-wrap">
                <input
                  type="range"
                  className="premium-slider premium-slider--cyan"
                  min="15"
                  max="30"
                  step="0.5"
                  value={Number(targetO2)}
                  onChange={(e) => setTargetO2(parseFloat(e.target.value))}
                  style={{ "--slider-fill": `${o2Fill}%` } as React.CSSProperties}
                  aria-label="Target oxygen slider"
                />
              </div>
              <div className="slider-range-labels">
                <span>15%</span>
                <span>30%</span>
              </div>
            </div>

            <div className="settings-field">
              <div className="settings-field-head">
                <div className="settings-field-label">
                  <div className="settings-icon-badge settings-icon-badge--green">
                    <Gauge size={16} strokeWidth={2.5} />
                  </div>
                  <span>Target Pressure</span>
                </div>
                <div className="settings-value-badge settings-value-badge--green">
                  <input
                    type="number"
                    className="settings-value-input"
                    value={targetPressure}
                    onChange={(e) => setTargetPressure(e.target.value)}
                    onBlur={(e) => clampPressure(e.target.value)}
                    aria-label="Target pressure"
                  />
                  <span className="settings-value-unit settings-value-unit--wide">cmH₂O</span>
                </div>
              </div>

              <div className="slider-wrap">
                <input
                  type="range"
                  className="premium-slider premium-slider--green"
                  min="5"
                  max="30"
                  step="0.5"
                  value={Number(targetPressure)}
                  onChange={(e) => setTargetPressure(parseFloat(e.target.value))}
                  style={{ "--slider-fill": `${pressureFill}%` } as React.CSSProperties}
                  aria-label="Target pressure slider"
                />
              </div>
              <div className="slider-range-labels">
                <span>5</span>
                <span>30</span>
              </div>
            </div>

            <div className="settings-field">
              <div className="settings-field-head">
                <div className="settings-field-label">
                  <div className="settings-icon-badge settings-icon-badge--purple">
                    <Settings2 size={16} strokeWidth={2.5} />
                  </div>
                  <span>I:E Ratio</span>
                </div>
              </div>

              <div className="segmented-control segmented-control--4" role="group" aria-label="Inspiratory to expiratory ratio">
                {IE_RATIOS.map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setIeRatio(ratio)}
                    className={`segmented-btn segmented-btn--purple${ieRatio === ratio ? " active" : ""}`}
                    aria-pressed={ieRatio === ratio}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="dash-card settings-card">
          <div className="settings-section-head">
            <div>
              <div className="dash-section-title">System Settings</div>
              <p className="settings-section-sub">Cloud sync, alerts, and appearance</p>
            </div>
          </div>

            <div className="settings-field" style={{ paddingTop: 0 }}>
              <div className="settings-field-head">
                <div className="settings-field-label">
                  <div className="settings-icon-badge settings-icon-badge--purple">
                    {theme === "dark" ? <Moon size={16} strokeWidth={2.5} /> : <Sun size={16} strokeWidth={2.5} />}
                  </div>
                  <span>Appearance</span>
                </div>
              </div>
              <div className="theme-toggle-row">
                <button
                  type="button"
                  className={`theme-toggle-btn${theme === "light" ? " active" : ""}`}
                  onClick={() => setTheme("light")}
                >
                  Light
                </button>
                <button
                  type="button"
                  className={`theme-toggle-btn${theme === "dark" ? " active" : ""}`}
                  onClick={() => setTheme("dark")}
                >
                  Dark
                </button>
              </div>
            </div>

            <div className="settings-toggle-list">
              <div className="settings-toggle-row">
                <div className="settings-toggle-copy">
                  <div className="settings-icon-badge settings-icon-badge--blue">
                    <Cloud size={18} strokeWidth={2} />
                  </div>
                  <div>
                    <div className="settings-toggle-title">Firebase Sync</div>
                    <div className="settings-toggle-desc">Sync data to cloud</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  className="ios-toggle"
                  checked={firebaseSync}
                  onChange={(e) => setFirebaseSync(e.target.checked)}
                  aria-label="Toggle Firebase Sync"
                />
              </div>

            <div className="settings-toggle-row">
              <div className="settings-toggle-copy">
                <div className="settings-icon-badge settings-icon-badge--red">
                  <BellRing size={18} strokeWidth={2} />
                </div>
                <div>
                  <div className="settings-toggle-title">Alert Notifications</div>
                  <div className="settings-toggle-desc">Push critical alerts</div>
                </div>
              </div>
              <input
                type="checkbox"
                className="ios-toggle"
                checked={alertsEnabled}
                onChange={(e) => setAlertsEnabled(e.target.checked)}
                aria-label="Toggle Alert Notifications"
              />
            </div>

            <div className="settings-toggle-row">
              <div className="settings-toggle-copy">
                <div className="settings-icon-badge settings-icon-badge--orange">
                  <Cpu size={18} strokeWidth={2} />
                </div>
                <div>
                  <div className="settings-toggle-title">
                    PID Auto-Tuning
                    <span style={{ color: "var(--text-disabled)", cursor: "help" }} title="Dynamically adjusts pump power curve based on lung resistance to hit target accurately">
                      <Info size={14} strokeWidth={2.5} />
                    </span>
                  </div>
                  <div className="settings-toggle-desc">Dynamic adjustment</div>
                </div>
              </div>
              <input
                type="checkbox"
                className="ios-toggle"
                checked={pidAutoTune}
                onChange={(e) => setPidAutoTune(e.target.checked)}
                aria-label="Toggle PID Auto-Tuning"
              />
            </div>
          </div>
        </div>

        <div className="settings-save-area">
          {saved && <div className="settings-save-toast">Configuration saved successfully</div>}
          <button type="button" onClick={handleSave} disabled={isSaving} className="settings-save-btn">
            {isSaving ? (
              <Loader2 size={20} strokeWidth={3} style={{ animation: "spin 1s linear infinite" }} />
            ) : (
              <Check size={20} strokeWidth={3} />
            )}
            {isSaving ? "Saving..." : saved ? "Saved" : "Save Configuration"}
          </button>

          {lastUpdate && (
            <div className="settings-sync-note">Last synced {syncText}</div>
          )}
        </div>
      </main>

      <BottomNav />
    </>
  );
}
