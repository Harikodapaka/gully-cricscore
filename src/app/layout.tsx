import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Hammersmith_One,
  Roboto_Condensed,
} from "next/font/google";
import SessionProvider from "@/components/SessionProvider";
import "./globals.css";
import Header from "@/components/Header";
import Toaster from "@/components/Toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const hammersmithOne = Hammersmith_One({
  variable: "--font-head",
  subsets: ["latin"],
  weight: "400",
});

const robotoCondensed = Roboto_Condensed({
  variable: "--font-cond",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
});

export const metadata: Metadata = {
  title: "CricScore",
  description: "CricScore - Made for gully cricket",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${hammersmithOne.variable} ${robotoCondensed.variable} antialiased font-sans`}
      >
        <SessionProvider>
          <Toaster position="bottom-center" />
          <Header />
          {children}
          <Analytics />
        </SessionProvider>
      </body>
    </html>
  );
}
