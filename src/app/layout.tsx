import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RestoERP — Sistem Manajemen Restoran",
  description: "ERP multi-outlet untuk restoran, cafe, dan bar.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
