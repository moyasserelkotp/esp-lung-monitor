import type { Metadata } from "next";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import { ESP32Provider } from "@/lib/ESP32Context";

export const metadata: Metadata = {
  title: "Artificial Lung Monitor",
  description: "Real-time closed-loop respiratory simulation monitoring dashboard powered by ESP32",
  keywords: ["respiratory", "lung simulator", "ESP32", "monitoring", "biomedical"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning data-theme="light">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('theme');
                  var theme = (stored === 'dark' || stored === 'light') ? stored : 'light';
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          {/* Single Firebase RTDB subscription for the entire app */}
          <ESP32Provider>
            <div className="app-shell">
              {children}
            </div>
          </ESP32Provider>
        </ThemeProvider>
      </body>
    </html>
  );
}
