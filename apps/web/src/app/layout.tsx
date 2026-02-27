import type { Metadata } from "next";

import AppShell from "@/components/layout/app-shell";

import "./globals.css";

export const metadata: Metadata = {
  title: "Performance Manager",
  description: "Performance management workflows for reviews, evidence, and calibration.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
