import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import { Navigation, DesktopTopControls } from "@/components/layout/Navigation";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "sonner";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Family Finance Management",
  description: "Property financial dashboard with income, expenses, and distribution tracking",
};

import { ThemeProvider } from "@/components/ThemeProvider";
import { LanguageProvider } from "@/context/LanguageContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${outfit.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 overflow-x-hidden font-body" suppressHydrationWarning>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <Toaster position="top-right" richColors closeButton />
              <div className="flex min-h-screen flex-col lg:flex-row">
                <Navigation />
                <div className="flex-1 flex flex-col lg:ml-0 lg:pl-72 transition-all duration-300">
                  <header className="hidden lg:flex items-center justify-end px-8 pt-6 w-full">
                     <DesktopTopControls />
                  </header>
                  <main className="flex-1 p-4 md:p-6 lg:px-8 lg:pb-8 lg:pt-6 transition-all duration-300">
                    {children}
                  </main>
                </div>
              </div>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
