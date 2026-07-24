"use client";

import { useState, useEffect, useCallback } from "react";
import {
  collection, query, where, orderBy, getDocs, limit, Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { HistoricalPoint, TimeRange } from "./types";
import { format } from "date-fns";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getRangeStart(range: TimeRange): Date {
  const now = new Date();
  switch (range) {
    case "1H":  return new Date(now.getTime() - 60 * 60 * 1000);
    case "6H":  return new Date(now.getTime() - 6  * 60 * 60 * 1000);
    case "24H": return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case "7D":  return new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000);
    default:    return new Date(now.getTime() - 60 * 60 * 1000);
  }
}

function getTimeFormat(range: TimeRange): string {
  switch (range) {
    case "7D": return "MMM dd";
    default:   return "HH:mm";
  }
}

// Reduce point density for large queries so Recharts stays responsive
function downsample<T>(arr: T[], maxPoints: number): T[] {
  if (arr.length <= maxPoints) return arr;
  const step = Math.ceil(arr.length / maxPoints);
  return arr.filter((_, i) => i % step === 0);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useHistoricalData(range: TimeRange) {
  const [data, setData]     = useState<HistoricalPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (range === "Live") return;

    setLoading(true);
    setError(null);

    try {
      const rangeStart = getRangeStart(range);
      const fmt        = getTimeFormat(range);

      // Query Firestore `readings` collection written by useESP32Data's write-back
      const q = query(
        collection(db, "readings"),
        where("timestamp", ">=", Timestamp.fromDate(rangeStart)),
        orderBy("timestamp", "asc"),
        limit(2000)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setData([]);
        return;
      }

      const raw: HistoricalPoint[] = snapshot.docs.map((doc) => {
        const d  = doc.data();
        // timestamp field is a Firestore Timestamp or number
        const ts: Date = d.timestamp?.toDate
          ? d.timestamp.toDate()
          : new Date(Number(d.timestamp));

        return {
          time:          format(ts, fmt),
          oxygen:        parseFloat(Number(d.oxygen        ?? 0).toFixed(2)),
          pressure:      parseFloat(Number(d.pressure      ?? 0).toFixed(2)),
          breathingRate: parseFloat(Number(d.breathingRate ?? 0).toFixed(1)),
          pumpUsage:     parseFloat(Number(d.pumpUsage     ?? 0).toFixed(1)),
          timestamp:     ts.getTime(),
        };
      });

      setData(downsample(raw, 200));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Firestore fetch error:", msg);
      setError("Failed to load historical data. Check Firestore rules or connection.");
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
