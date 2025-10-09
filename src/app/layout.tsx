import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import SessionProvider from '@/components/SessionProvider';
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

export const metadata: Metadata = {
  title: "CricScore",
  description: "CricScore - Made for gully cricket",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}
      >
        <SessionProvider>
          <Toaster position="top-center" />
          <Header />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
