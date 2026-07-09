import { SensorReading, HistoricalPoint } from "./types";

// Rule-based AI analysis engine 

export interface AIInsight {
  type: "info" | "warning" | "critical" | "success";
  title: string;
  detail: string;
}

export interface AIAnalysisResult {
  overallStatus: "Excellent" | "Good" | "Warning" | "Critical";
  summary: string;
  insights: AIInsight[];
  suggestions: string[];
  faults: string[];
  oxygenConsumptionRate: number;  // % per minute
  predictedO2in5min: number;
  predictedO2in10min: number;
}

export function analyzeSystemData(
  live: SensorReading,
  history: HistoricalPoint[]
): AIAnalysisResult {
  const insights: AIInsight[] = [];
  const suggestions: string[] = [];
  const faults: string[] = [];

  //  Oxygen Analysis 
  const o2Deficit = 21 - live.oxygen;
  if (live.oxygen >= 20.5) {
    insights.push({ type: "success", title: "Oxygen Level", detail: `O₂ at ${live.oxygen}% — within optimal range (20.5–21%).` });
  } else if (live.oxygen >= 19.5) {
    insights.push({ type: "warning", title: "Oxygen Declining", detail: `O₂ at ${live.oxygen}%, deficit of ${o2Deficit.toFixed(2)}% below target. Iron oxidation is consuming faster than intake.` });
    suggestions.push("Increase inhale duration by 10–15% to deliver more fresh air per cycle.");
  } else {
    insights.push({ type: "critical", title: "Low Oxygen Alert", detail: `O₂ at ${live.oxygen}% — critically below threshold. Immediate intervention recommended.` });
    faults.push("Oxygen below 19.5% — possible air leak, insufficient pump flow, or valve timing error.");
    suggestions.push("Increase pump PWM to maximum and extend inhale phase duration.");
  }

  //  Pressure Analysis 
  if (live.pressure >= 15 && live.pressure <= 22) {
    insights.push({ type: "success", title: "Pressure Control", detail: `Pressure at ${live.pressure.toFixed(1)} cmH₂O — PID control effective.` });
  } else if (live.pressure > 22) {
    insights.push({ type: "warning", title: "Overpressure", detail: `Pressure at ${live.pressure.toFixed(1)} cmH₂O exceeds 22 cmH₂O safe limit.` });
    suggestions.push("Reduce PID Kp by 15–20% to limit pressure overshoot.");
    suggestions.push("Check AR3000 regulator setpoint — may be set too high.");
  } else if (live.pressure < 5 && live.breathState !== "EXHALE") {
    insights.push({ type: "warning", title: "Low Pressure", detail: `Pressure at ${live.pressure.toFixed(1)} cmH₂O during ${live.breathState} — pump may not be delivering sufficient flow.` });
    faults.push("Low pressure during inhale — check tubing connections and pump operation.");
  }

  //  Pump Analysis 
  if (live.pumpUsage > 85) {
    insights.push({ type: "warning", title: "High Pump Load", detail: `Pump at ${live.pumpUsage}% duty cycle — approaching maximum. May indicate a restriction or leak in the pneumatic circuit.` });
    faults.push("Pump working at >85% — inspect: Teflon seals, 8mm tubing connections, regulator setting.");
    suggestions.push("Inspect all brass NPT fittings for leaks using soapy water test.");
  } else {
    insights.push({ type: "info", title: "Pump Efficiency", detail: `Pump at ${live.pumpUsage}% — operating efficiently within normal range.` });
  }

  //  Breathing Rate 
  if (live.breathingRate >= 8 && live.breathingRate <= 25) {
    insights.push({ type: "success", title: "Breathing Rate", detail: `${live.breathingRate} BPM — within normal physiological range (8–25 BPM).` });
  } else {
    insights.push({ type: "warning", title: "Abnormal Rate", detail: `${live.breathingRate} BPM outside normal range. Adjust FSM timing parameters.` });
    suggestions.push("Adjust FSM inhale/hold/exhale timings to bring rate within 8–25 BPM.");
  }

  //  Historical Trend Analysis Fallback Defaults
  let oxygenConsumptionRate = 0;
  let predictedO2in5min = live.oxygen;
  let predictedO2in10min = live.oxygen;

  if (history.length >= 5) {
    const recent = history.slice(-10);
    const first = recent[0].oxygen;
    const last = recent[recent.length - 1].oxygen;
    const timeDiffMin = (recent[recent.length - 1].timestamp - recent[0].timestamp) / 60000;

    if (timeDiffMin > 0) {
      oxygenConsumptionRate = Math.max(0, (first - last) / timeDiffMin);

      // Pressure stability check
      const pressures = recent.map((d) => d.pressure);
      const avgPressure = pressures.reduce((a, b) => a + b, 0) / pressures.length;
      const variance = pressures.reduce((a, b) => a + Math.pow(b - avgPressure, 2), 0) / pressures.length;
      const stdDev = Math.sqrt(variance);

      if (stdDev > 3) {
        insights.push({ type: "warning", title: "Pressure Oscillation", detail: `Pressure std dev: ${stdDev.toFixed(2)} cmH₂O — PID may be oscillating. Consider reducing Kp.` });
        suggestions.push(`Reduce PID Kp by ~${Math.round(stdDev * 5)}% to dampen pressure oscillations.`);
      }
    }

    //  O₂ Prediction 
    predictedO2in5min = Math.max(15, live.oxygen - oxygenConsumptionRate * 5);
    predictedO2in10min = Math.max(15, live.oxygen - oxygenConsumptionRate * 10);
  }

  //  Overall Status (Evaluated regardless of history length)
  const criticals = insights.filter((i) => i.type === "critical").length;
  const warnings = insights.filter((i) => i.type === "warning").length;

  let overallStatus: AIAnalysisResult["overallStatus"] = "Excellent";
  let summary = "All parameters are within safe operating range. System performance is excellent.";

  if (criticals > 0) {
    overallStatus = "Critical";
    summary = `${criticals} critical issue(s) detected. Immediate action required.`;
  } else if (warnings > 1) {
    overallStatus = "Warning";
    summary = `${warnings} parameter(s) need attention. System is functional but requires monitoring.`;
  } else if (warnings === 1) {
    overallStatus = "Good";
    summary = "System is operating well with one minor parameter to watch.";
  }

  return {
    overallStatus,
    summary,
    insights,
    suggestions: Array.from(new Set(suggestions)), // deduplicate
    faults,
    oxygenConsumptionRate,
    predictedO2in5min,
    predictedO2in10min,
  };
}