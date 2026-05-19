// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { Providers } from "./components/Providers";
import { CurrencyProvider } from "./components/CurrencyProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Salex | Honest Ticket Exchange",
  description: "Secure ticket resale marketplace.",
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
      <body className="min-h-full flex flex-col font-sans bg-white text-gray-900">
        <Providers>
          {/* 🛠 NEW: Wrap the app in the Currency Provider */}
          <CurrencyProvider>
            <Navbar />
            <main className="flex-1 w-full">
              {children}
            </main>
            <Footer />
          </CurrencyProvider>
        </Providers>
      </body>
    </html>
  );
}
