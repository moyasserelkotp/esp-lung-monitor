"use client";

import { useState, useEffect, useCallback } from "react";
import {
  collection, query, orderBy, limit, getDocs,
  addDoc, updateDoc, doc, serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { Session, SessionFlag, VentMode } from "./types";

// ─── Firestore sessions collection ────────────────────────────────────────────
// Each document shape stored by startSession():
// {
//   startTime:    Firestore Timestamp (serverTimestamp)
//   endTime?:     Firestore Timestamp (serverTimestamp)
//   avgOxygen:    number
//   maxPressure:  number
//   minPressure:  number
//   breathCount:  number
//   pumpRuntime:  number  (seconds elapsed)
//   mode:         VentMode
//   flags:        SessionFlag[]
// }

// ─── Date helpers ──────────────────────────────────────────────────────────────
function formatDuration(startMs: number, endMs: number): string {
  const secs = Math.floor((endMs - startMs) / 1000);
  if (secs < 60)   return `${secs} sec`;
  if (secs < 3600) return `${Math.floor(secs / 60)} min`;
  return `${(secs / 3600).toFixed(1)} hr`;
}

function formatStartTime(date: Date): string {
  const now   = new Date();
  const today = now.getDate();
  const month = now.getMonth();
  const year  = now.getFullYear();

  // Calendar-day comparison (not ms-diff) to correctly handle midnight boundaries
  if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === today) {
    return `Today, ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth()    === yesterday.getMonth()    &&
    date.getDate()     === yesterday.getDate()
  ) {
    return `Yesterday, ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
  }

  return date.toLocaleDateString("en-US", {
    month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

function tsToDate(val: unknown): Date {
  if (!val) return new Date(0);
  // Firestore Timestamp
  if (typeof (val as any).toDate === "function") return (val as any).toDate();
  return new Date(Number(val));
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = query(
        collection(db, "sessions"),
        orderBy("startTime", "desc"),
        limit(50)
      );
      const snap = await getDocs(q);

      const list: Session[] = snap.docs.map((d) => {
        const raw       = d.data();
        const startDate = tsToDate(raw.startTime);
        const endDate   = raw.endTime ? tsToDate(raw.endTime) : null;

        return {
          id:          d.id,
          startTime:   formatStartTime(startDate),
          endTime:     endDate ? endDate.toISOString() : undefined,
          duration:    endDate
            ? formatDuration(startDate.getTime(), endDate.getTime())
            : "In progress",
          avgOxygen:   Number(raw.avgOxygen   ?? 0),
          maxPressure: Number(raw.maxPressure ?? 0),
          minPressure: Number(raw.minPressure ?? 0),
          breathCount: Number(raw.breathCount ?? 0),
          pumpRuntime: Number(raw.pumpRuntime ?? 0),
          mode:        (raw.mode as VentMode)       ?? "VCV",
          flags:       (raw.flags as SessionFlag[]) ?? [],
        };
      });

      setSessions(list);
    } catch (err) {
      console.error("Firestore sessions fetch error:", err);
      setError("Failed to load sessions. Check Firestore rules & composite indexes.");
    } finally {
      setLoading(false);
    }
  }, []);   // ← stable reference — won't cause unnecessary re-renders

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return { sessions, loading, error, refetch: fetchSessions };
}

// ─── Session recording helpers ─────────────────────────────────────────────────
export async function startSession(mode: VentMode): Promise<string> {
  const docRef = await addDoc(collection(db, "sessions"), {
    startTime:   serverTimestamp(),
    mode,
    flags:       [],
    avgOxygen:   0,
    maxPressure: 0,
    minPressure: 999,
    breathCount: 0,
    pumpRuntime: 0,
  });
  return docRef.id;
}

export async function finishSession(
  sessionId: string,
  stats: {
    avgOxygen:   number;
    maxPressure: number;
    minPressure: number;
    breathCount: number;
    pumpRuntime: number;
    flags:       SessionFlag[];
  }
) {
  await updateDoc(doc(db, "sessions", sessionId), {
    endTime: serverTimestamp(),
    ...stats,
  });
}
