import type { Metadata, Viewport } from "next";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import "@/styles/leaflet.css";
import { Toaster } from "@/components/ui/sonner";
import { PWARegister } from "@/components/sivan/PWARegister";

const ICON_VERSION = 'v2';

export const metadata: Metadata = {
  title: "تاکسی ویژه سیوان | Sivan VIP Taxi",
  description: "رزرو آنلاین تاکسی بین شهری VIP - سفری لوکس، راحت و ایمن با سیوان",
  keywords: ["تاکسی VIP", "تاکسی بین شهری", "سیوان", "رزرو تاکسی", "سفر لوکس", "Sivan Taxi"],
  authors: [{ name: "Sivan VIP Taxi" }],
  manifest: "/manifest.json",
  applicationName: "تاکسی ویژه سیوان",
  appleWebApp: {
    capable: true,
    title: "تاکسی ویژه سیوان",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: true,
  },
  icons: {
    icon: [
      { url: `/favicon-32.png?v=${ICON_VERSION}`, sizes: "32x32", type: "image/png" },
      { url: `/icon-192.png?v=${ICON_VERSION}`, sizes: "192x192", type: "image/png" },
      { url: `/icon-512.png?v=${ICON_VERSION}`, sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: `/apple-touch-icon.png?v=${ICON_VERSION}`, sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "تاکسی ویژه سیوان | Sivan VIP Taxi",
    description: "رزرو آنلاین تاکسی بین شهری VIP - سفری لوکس، راحت و ایمن با سیوان",
    siteName: "سیوان",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground min-h-screen">
        {children}
        <Toaster position="top-left" dir="rtl" />
        <PWARegister />
      </body>
    </html>
  );
}
