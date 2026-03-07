import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stalk.ai – Monitor Everything, Miss Nothing",
  description: "Track YouTube channels, Reddit threads, blogs and more. Get AI-powered daily digests so you never miss what matters.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
