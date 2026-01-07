import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

export const viewport: Viewport = {
  themeColor: "#0b1220",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export const metadata: Metadata = {
  title: {
    default: "Tybelos",
    template: "%s · Tybelos"
  },
  description:
    "Decision OS: riduce il carico decisionale con 1–2 opzioni e memoria decisionale.",
  manifest: "/manifest.json",
  applicationName: "Tybelos",
  appleWebApp: {
    capable: true,
    title: "Tybelos",
    statusBarStyle: "black-translucent"
  },
  icons: {
    icon: [{ url: "/icons/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/apple-touch-icon.svg" }]
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className="dark">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

