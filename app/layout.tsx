import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "@/styles/globals.css";
import { CartProvider } from "@/context/CartContext";
import Header from "@/components/Header";
import { ShoppingBagDrawer } from "@/components/ShoppingBagDrawer";
import { Analytics } from "@vercel/analytics/next";
import { createClient } from "@/lib/supabase/server";
import { Footer } from "@/components/Footer";
import { Toaster } from 'sonner';
import { validateEnv } from "@/lib/env";
import Script from 'next/script';
import { getLayoutData } from "@/lib/data/layout";
import AnalyticsBeacon from '@/components/AnalyticsBeacon';


const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient();
  const { data: storeInfo } = await supabase.from('site_settings').select('setting_value').eq('setting_key', 'store_info').maybeSingle();
  const logoUrl = (storeInfo?.setting_value as any)?.logo_url || "/logo.jpg";

  return {
    metadataBase: new URL('https://dinacosmetic.store'),
    title: {
      default: "DINA COSMETIC | The Obsidian Palace - Luxury Beauty & Cosmetics",
      template: "%s | DINA COSMETIC"
    },
    description: "Discover premium beauty products and cosmetics at DINA COSMETIC - The Obsidian Palace. Shop luxury skincare, makeup, and beauty essentials with ultra-minimalist, high-end design.",
    keywords: [
      "DINA COSMETIC",
      "luxury cosmetics",
      "premium beauty products",
      "high-end skincare",
      "luxury makeup",
      "beauty essentials",
      "The Obsidian Palace",
      "luxury beauty store",
      "premium cosmetics online",
      "designer beauty products"
    ],
    authors: [{ name: "DINA COSMETIC", url: "https://dinacosmetic.store" }],
    creator: "DINA COSMETIC",
    publisher: "DINA COSMETIC",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: "https://dinacosmetic.store",
      siteName: "DINA COSMETIC - The Obsidian Palace",
      title: "DINA COSMETIC | Luxury Beauty & Cosmetics",
      description: "Discover premium beauty products and cosmetics at The Obsidian Palace. Shop luxury skincare, makeup, and beauty essentials.",
      images: [
        {
          url: logoUrl,
          width: 1200,
          height: 630,
          alt: "DINA COSMETIC - The Obsidian Palace",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "DINA COSMETIC | Luxury Beauty & Cosmetics",
      description: "Discover premium beauty products at The Obsidian Palace",
      images: [logoUrl],
      creator: "@dinacosmetic",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: {
      google: "your-google-verification-code",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Validate critical env vars at runtime (not build time) so missing vars
  // produce an immediate hard error rather than a silent broken deployment.
  validateEnv();

  const { headerNavItems, footerShopItems, footerLegalItems, socialLinks, logoUrl } =
      await getLayoutData();

  return (
    <html lang="en" className="bg-black">
      <body
        className={`${playfair.variable} ${inter.variable} bg-black text-white antialiased selection:bg-gold/30 selection:text-white`}
      >
        <CartProvider>
          <div className="relative flex flex-col min-h-screen">
            <Header navItems={headerNavItems} logoUrl={logoUrl} />
            <main className="flex-grow">
              {children}
            </main>
            <ShoppingBagDrawer />
            <Footer shopLinks={footerShopItems} legalLinks={footerLegalItems} social={socialLinks} />
          </div>
          <Toaster
            position="bottom-right"
            theme="dark"
            expand={false}
            richColors
            toastOptions={{
              className: 'bg-obsidian border-luxury-border text-white',
            }}
          />
        </CartProvider>
        <AnalyticsBeacon />
        <Analytics />
      </body>
    </html>
  );
}
