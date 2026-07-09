"use client";

import { useState, useEffect, useCallback } from "react";
import {
  collection, query, where, orderBy, getDocs, limit, Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { HistoricalPoint, TimeRange } from "./types";
import { format } from "date-fns";

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

//  Generate mock history for demo mode 
function generateDemoHistory(points = 60): HistoricalPoint[] {
  const now = Date.now();
  return Array.from({ length: points }, (_, i) => {
    const ts = now - (points - i) * 60_000; // one point per minute
    const t  = i / points;
    return {
      time:          format(new Date(ts), "HH:mm"),
      oxygen:        parseFloat((20.6 + Math.sin(t * Math.PI * 4) * 0.4 + (Math.random() - 0.5) * 0.1).toFixed(2)),
      pressure:      parseFloat((17.5 + Math.sin(t * Math.PI * 6) * 1.2 + (Math.random() - 0.5) * 0.3).toFixed(2)),
      breathingRate: Math.round(12 + Math.sin(t * Math.PI * 2) * 2),
      pumpUsage:     Math.round(55 + Math.sin(t * Math.PI * 3) * 15 + (Math.random() - 0.5) * 5),
      timestamp:     ts,
    };
  });
}

function getRangeStart(range: TimeRange): Date {
  const now = new Date();
  switch (range) {
    case "1H":  return new Date(now.getTime() - 60 * 60 * 1000);
    case "6H":  return new Date(now.getTime() - 6 * 60 * 60 * 1000);
    case "24H": return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case "7D":  return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    default:    return new Date(now.getTime() - 60 * 60 * 1000);
  }
}

function getTimeFormat(range: TimeRange): string {
  switch (range) {
    case "1H":
    case "6H":  return "HH:mm";
    case "24H": return "HH:mm";
    case "7D":  return "MMM dd";
    default:    return "HH:mm";
  }
}

function downsample<T>(arr: T[], maxPoints: number): T[] {
  if (arr.length <= maxPoints) return arr;
  const step = Math.ceil(arr.length / maxPoints);
  return arr.filter((_, i) => i % step === 0);
}

export function useHistoricalData(range: TimeRange) {
  const [data, setData] = useState<HistoricalPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (range === "Live") return;

    setLoading(true);
    setError(null);

    try {
      //  DEMO MODE: return generated mock history 
      if (IS_DEMO) {
        await new Promise((r) => setTimeout(r, 300)); // fake load delay
        setData(generateDemoHistory(60));
        return;
      }

      //  LIVE MODE: query Firestore 
      const rangeStart = getRangeStart(range);
      const fmt = getTimeFormat(range);

      const q = query(
        collection(db, "readings"),
        where("timestamp", ">=", Timestamp.fromDate(rangeStart)),
        orderBy("timestamp", "asc"),
        limit(2000)
      );

      const snapshot = await getDocs(q);
      const raw: HistoricalPoint[] = snapshot.docs.map((doc) => {
        const d = doc.data();
        const ts: Date = d.timestamp.toDate();
        return {
          time: format(ts, fmt),
          oxygen: Number(d.oxygen.toFixed(2)),
          pressure: Number(d.pressure.toFixed(2)),
          breathingRate: Number(d.breathingRate.toFixed(1)),
          pumpUsage: Number(d.pumpUsage.toFixed(1)),
          timestamp: ts.getTime(),
        };
      });

      setData(downsample(raw, 200));
    } catch (err) {
      console.error("Firestore fetch error:", err);
      setError("Failed to load historical data.");
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
