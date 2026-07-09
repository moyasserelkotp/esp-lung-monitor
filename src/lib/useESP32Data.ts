"use client";

import { useState, useEffect, useRef } from "react";
import { ref, onValue, off } from "firebase/database";
import { rtdb } from "./firebase";
import { SensorReading, SystemStatus, SystemHealth, VentMode } from "./types";

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

//  Mock data generator 
const BREATH_CYCLE_MS = 4000; // 15 BPM ≈ 4 s per breath

function generateMockReading(tick: number, startTime: number): SensorReading {
  const elapsed = (Date.now() - startTime) / 1000;
  const cyclePos = (elapsed % (BREATH_CYCLE_MS / 1000)) / (BREATH_CYCLE_MS / 1000); // 0..1

  const isInhale = cyclePos < 0.4;
  const isHold   = cyclePos >= 0.4 && cyclePos < 0.55;

  // Pressure: rises during inhale, holds, drops on exhale
  const pressureTarget = 18;
  let pressure: number;
  if (isInhale)      pressure = pressureTarget * (cyclePos / 0.4);
  else if (isHold)   pressure = pressureTarget + Math.sin(elapsed * 8) * 0.3;
  else               pressure = pressureTarget * Math.max(0, 1 - (cyclePos - 0.55) / 0.45);
  pressure = Math.max(0, pressure + (Math.random() - 0.5) * 0.4);

  // Oxygen: slowly oscillates around 20.6% with tiny noise
  const oxygen = 20.6 + Math.sin(elapsed * 0.15) * 0.4 + (Math.random() - 0.5) * 0.1;

  // Pump: active during inhale
  const pumpUsage = isInhale
    ? Math.round(55 + (cyclePos / 0.4) * 25 + (Math.random() - 0.5) * 5)
    : isHold ? 30 : 0;

  const breathState = isInhale ? "INHALE" : isHold ? "HOLD" : "EXHALE";

  return {
    oxygen:        parseFloat(oxygen.toFixed(2)),
    pressure:      parseFloat(pressure.toFixed(2)),
    breathingRate: 15,
    pumpUsage:     Math.max(0, Math.min(100, pumpUsage)),
    inhaleValve:   isInhale || isHold ? "OPEN" : "CLOSED",
    exhaleValve:   (!isInhale && !isHold) ? "OPEN" : "CLOSED",
    breathState,
    temperature:   28.4 + (Math.random() - 0.5) * 0.2,
    timestamp:     Date.now(),
    ieRatio:       "1:2",
    mode:          "VCV",
  };
}

const DEFAULT_READING: SensorReading = {
  oxygen: 20.6, pressure: 0, breathingRate: 15,
  pumpUsage: 0, inhaleValve: "CLOSED", exhaleValve: "CLOSED",
  breathState: "EXHALE", temperature: 28.4, timestamp: Date.now(),
  ieRatio: "1:2", mode: "VCV",
};

function deriveStatus(reading: SensorReading): SystemStatus {
  if (reading.oxygen < 18 || reading.pressure > 25) return "Alarm";
  if (reading.oxygen < 19.5 || reading.pressure > 22) return "Warning";
  return "Normal";
}

export function useESP32Data() {
  const [data, setData] = useState<SensorReading>(DEFAULT_READING);
  const [status, setStatus] = useState<SystemHealth>({
    status: IS_DEMO ? "Normal" : "Offline",
    message: IS_DEMO ? "All parameters within safe operating range." : "Connecting to device...",
    sampleCount: 0,
    uptimeSeconds: 0,
  });
  const [isConnected, setIsConnected] = useState(IS_DEMO);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(IS_DEMO ? new Date() : null);
  const [sampleCount, setSampleCount] = useState(0);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    //  DEMO MODE: use animated mock data 
    if (IS_DEMO) {
      let tick = 0;
      const interval = setInterval(() => {
        const reading = generateMockReading(tick++, startTimeRef.current);
        setData(reading);
        setIsConnected(true);
        setLastUpdate(new Date());
        setSampleCount((c) => c + 1);
        const sysStatus = deriveStatus(reading);
        const messages: Record<SystemStatus, string> = {
          Normal: "All parameters within safe operating range.",
          Warning: "One or more parameters approaching limits.",
          Alarm: "ALERT: Critical parameter detected!",
          Offline: "Device offline.",
        };
        setStatus((s) => ({
          status: sysStatus,
          message: messages[sysStatus],
          sampleCount: s.sampleCount + 1,
          uptimeSeconds: Math.floor((Date.now() - startTimeRef.current) / 1000),
        }));
      }, 500); // update every 500 ms
      return () => clearInterval(interval);
    }

    //  LIVE MODE: subscribe to Firebase Realtime Database 
    // Path matches the Firebase data model spec: /liveData
    const sensorRef = ref(rtdb, "liveData");
    const unsubscribe = onValue(
      sensorRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const raw = snapshot.val();
          const reading: SensorReading = {
            oxygen:        Number(raw.oxygen ?? 0),
            pressure:      Number(raw.pressure ?? 0),
            breathingRate: Number(raw.cycleRate ?? raw.breathingRate ?? 15),
            pumpUsage:     Number(raw.pumpPwm ?? raw.pumpUsage ?? 0),
            inhaleValve:   raw.inhaleValve ?? "CLOSED",
            exhaleValve:   raw.exhaleValve ?? "CLOSED",
            breathState:   raw.breathState ?? "EXHALE",
            temperature:   Number(raw.temperature ?? 25),
            timestamp:     Number(raw.timestamp ?? Date.now()),
            ieRatio:       raw.ieRatio ?? "1:2",
            mode:          (raw.mode as VentMode) ?? "VCV",
          };
          setData(reading);
          setIsConnected(true);
          setLastUpdate(new Date());
          setSampleCount((c) => c + 1);
          const sysStatus = deriveStatus(reading);
          const messages: Record<SystemStatus, string> = {
            Normal: "All parameters within safe operating range.",
            Warning: "One or more parameters approaching limits.",
            Alarm: "ALERT: Critical parameter detected!",
            Offline: "Device offline.",
          };
          setStatus((s) => ({
            status: sysStatus,
            message: messages[sysStatus],
            sampleCount: s.sampleCount + 1,
            uptimeSeconds: Math.floor((Date.now() - reading.timestamp) / 1000),
          }));
        } else {
          setIsConnected(false);
          setStatus((s) => ({ ...s, status: "Offline", message: "No data received from device." }));
        }
      },
      (error) => {
        console.error("Firebase read error:", error);
        setIsConnected(false);
        setStatus((s) => ({ ...s, status: "Offline", message: "Connection error." }));
      }
    );
    return () => off(sensorRef, "value", unsubscribe);
  }, []);

  return { data, status, isConnected, lastUpdate, sampleCount };
}
