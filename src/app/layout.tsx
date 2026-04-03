import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "family-fin-management",
  description: "Family financial management dashboard with income, expenses, and distribution tracking",
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
      <body className="min-h-screen bg-slate-50 text-slate-900" suppressHydrationWarning>
        <div className="min-h-screen flex">
          <aside className="w-72 bg-white border-r border-slate-200 p-6">
            <div className="mb-8">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">family-fin-management</h1>
              <p className="text-sm text-slate-600">Financial management dashboard</p>
            </div>
            <nav className="flex flex-col gap-2">
              <Link href="/" className="rounded-lg px-4 py-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900">Dashboard</Link>
              <Link href="/properties" className="rounded-lg px-4 py-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900">Properties</Link>
              <Link href="/family-members" className="rounded-lg px-4 py-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900">Family Members</Link>
              <Link href="/ownership-shares" className="rounded-lg px-4 py-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900">Ownership Shares</Link>
              <Link href="/income" className="rounded-lg px-4 py-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900">Income</Link>
              <Link href="/expenses" className="rounded-lg px-4 py-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900">Expenses</Link>
              <Link href="/payouts" className="rounded-lg px-4 py-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900">Member Payouts</Link>
              <Link href="/distribution" className="rounded-lg px-4 py-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900">Distribution</Link>
            </nav>
          </aside>
          <main className="flex-1 p-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
