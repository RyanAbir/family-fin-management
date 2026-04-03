import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/layout/Navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Family Finance Management",
  description: "Property financial dashboard with income, expenses, and distribution tracking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden" suppressHydrationWarning>
        <div className="flex min-h-screen flex-col lg:flex-row">
          <Navigation />
          <main className="flex-1 lg:ml-72 p-4 md:p-6 lg:p-8 pt-6 lg:pt-8 transition-spacing duration-300">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
