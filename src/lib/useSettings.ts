"use client";

import { useState, useEffect } from "react";
import { ref, onValue, off } from "firebase/database";
import { rtdb } from "./firebase";

export interface SystemSettings {
  targetOxygen: number;
  targetPressure: number;
  ieRatio: string;
  firebaseSync: boolean;
  alertsEnabled: boolean;
  pidAutoTune: boolean;
}

const DEFAULT_SETTINGS: SystemSettings = {
  targetOxygen: 21,
  targetPressure: 5,
  ieRatio: "1:2",
  firebaseSync: true,
  alertsEnabled: true,
  pidAutoTune: false,
};

export function useSettings() {
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const settingsRef = ref(rtdb, "settings");
    const unsubscribe = onValue(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        setSettings({
          ...DEFAULT_SETTINGS,
          ...val,
          // ensure numbers are parsed correctly if they were saved as strings
          targetOxygen: val.targetOxygen ? Number(val.targetOxygen) : DEFAULT_SETTINGS.targetOxygen,
          targetPressure: val.targetPressure ? Number(val.targetPressure) : DEFAULT_SETTINGS.targetPressure,
        });
      }
      setLoading(false);
    });

    return () => off(settingsRef, "value", unsubscribe);
  }, []);

  return { settings, loading };
}
