import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "collab // private workspace",
  description: "Invite-only collaboration platform for the technically inclined.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
