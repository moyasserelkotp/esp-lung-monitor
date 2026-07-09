import type { Metadata } from "next";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "Artificial Lung Monitor",
  description: "Real-time closed-loop respiratory simulation monitoring dashboard powered by ESP32",
  keywords: ["respiratory", "lung simulator", "ESP32", "monitoring", "biomedical"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <div className="app-shell">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
