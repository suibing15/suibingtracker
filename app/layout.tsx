import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "suibingtracker — daily expenses",
  description: "A personal daily expense tracker with dashboard, filters and PDF export.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
