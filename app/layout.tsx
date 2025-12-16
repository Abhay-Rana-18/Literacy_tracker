import type React from "react";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Digital Skills Tracker",
  description:
    "Track and evaluate students digital skills through assessments and progress records",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/logo2.png",
        type: "image/svg+xml",
      },
    ],
    apple: "/logo2.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#1e40af",
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
