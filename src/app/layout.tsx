import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "تاکسی ویژه سیوان | Sivan VIP Taxi",
  description: "رزرو آنلاین تاکسی بین شهری VIP - سفری لوکس، راحت و ایمن با سیوان",
  keywords: ["تاکسی VIP", "تاکسی بین شهری", "سیوان", "رزرو تاکسی", "سفر لوکس", "Sivan Taxi"],
  authors: [{ name: "Sivan VIP Taxi" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "تاکسی ویژه سیوان | Sivan VIP Taxi",
    description: "رزرو آنلاین تاکسی بین شهری VIP - سفری لوکس، راحت و ایمن با سیوان",
    siteName: "سیوان",
    type: "website",
  },
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
      </body>
    </html>
  );
}
