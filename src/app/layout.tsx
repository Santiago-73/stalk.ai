import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stalk.ai – Monitor Everything, Miss Nothing",
  description: "Track YouTube channels, Reddit threads, blogs and more. Get AI-powered daily digests so you never miss what matters.",
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
  openGraph: {
    title: "Stalk.ai – Monitor Everything, Miss Nothing",
    description: "Track YouTube channels, Reddit threads, blogs and more. Get AI-powered daily digests so you never miss what matters.",
    url: "https://stalk-ai.com",
    siteName: "Stalk.ai",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Stalk.ai – Monitor Everything, Miss Nothing",
    description: "Track YouTube channels, Reddit threads, blogs and more. Get AI-powered daily digests so you never miss what matters.",
  },
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
