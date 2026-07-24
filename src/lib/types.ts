// TypeScript types for the Artificial Lung Monitor system

export type ValveState = "OPEN" | "CLOSED";
export type BreathState = "INHALE" | "HOLD" | "EXHALE";
export type SystemStatus = "Normal" | "Warning" | "Alarm" | "Offline";
export type VentMode = "VCV" | "PCV" | "SIMV";
export type TimeRange = "Live" | "1H" | "6H" | "24H" | "7D";

export interface SensorReading {
  oxygen: number;           // %  e.g. 20.6
  pressure: number;         // cmH2O e.g. 17.8
  breathingRate: number;    // BPM e.g. 12  (also aliased as cycleRate in Firebase)
  pumpUsage: number;        // % 0-100 e.g. 62  (also pumpPwm in Firebase)
  inhaleValve: ValveState;
  exhaleValve: ValveState;
  breathState: BreathState;

  timestamp: number;        // Unix ms
  ieRatio: string;          // e.g. "1:2"
  mode: VentMode;           // active ventilation mode
}

export interface HistoricalPoint {
  time: string;             // formatted label
  oxygen: number;
  pressure: number;
  breathingRate: number;
  pumpUsage: number;
  timestamp: number;
}

export interface SystemHealth {
  status: SystemStatus;
  message: string;
  sampleCount: number;
  uptimeSeconds: number;
}

export interface SessionFlag {
  type: "overpressure" | "low-oxygen" | "anomaly" | "info";
  label: string;
}

export interface Session {
  id: string;
  startTime: string;
  endTime?: string;
  duration: string;
  avgOxygen: number;
  maxPressure: number;
  minPressure: number;
  breathCount: number;
  pumpRuntime: number;
  mode: VentMode;
  flags: SessionFlag[];
}
