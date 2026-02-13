import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { Navbar } from "@/components/Navbar";
import { ShoppingBagDrawer } from "@/components/ShoppingBagDrawer";
import { Analytics } from "@vercel/analytics/next"

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "DINA COSMETIC | The Obsidian Palace",
    template: "%s | DINA COSMETIC"
  },
  description: "DINA COSMETIC - Ultra-minimalist, high-end luxury beauty and skincare at the Obsidian Palace.",
  keywords: ["cosmetics", "luxury beauty", "DINA COSMETIC", "LMT", "skincare"],
  authors: [{ name: "DINA COSMETIC" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://dinacosmetic.store",
    siteName: "DINA COSMETIC",
    images: [
      {
        url: "/logo.jpg",
        width: 1200,
        height: 630,
        alt: "DINA COSMETIC Logo",
      },
    ],
  },
};

import { Footer } from "@/components/Footer";

import { Toaster } from 'sonner';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/favicon.jpg" />
      </head>
      <body
        className={`${playfair.variable} ${inter.variable} font-sans antialiased`}
      >
        <CartProvider>
          <div className="min-h-screen flex flex-col pt-20">
            <Navbar />
            <main className="flex-grow">
              {children}
            </main>
            <ShoppingBagDrawer />
            <Footer />
          </div>
          <Toaster position="bottom-right" theme="dark" expand={false} richColors />
          <Analytics />
        </CartProvider>
      </body>
    </html>
  );
}
