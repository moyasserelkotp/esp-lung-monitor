"use client";

import { useEffect } from "react";
import { applyTheme, getInitialTheme } from "@/lib/useTheme";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    applyTheme(getInitialTheme());
  }, []);

  return <>{children}</>;
}
