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

// Validate env vars at boot
validateEnv();

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
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
        url: "/logo.jpg",
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
    images: ["/logo.jpg"],
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
    // Add other verification codes as needed
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();

  // Fetch navs
  let headerNavItems = [];
  let footerShopItems = [];
  let footerLegalItems = [];
  let socialLinks = null;

  try {
    const [headerRes, shopLinksRes, legalLinksRes, socialRes] = await Promise.all([
      supabase.from('navigation_menus').select('menu_items').eq('menu_key', 'header_main').single(),
      supabase.from('navigation_menus').select('menu_items').eq('menu_key', 'footer_shop').single(),
      supabase.from('navigation_menus').select('menu_items').eq('menu_key', 'footer_legal').single(),
      supabase.from('site_settings').select('setting_value').eq('setting_key', 'social_media').single(),
    ]);
    if (headerRes.data) headerNavItems = headerRes.data.menu_items || [];
    if (shopLinksRes.data) footerShopItems = shopLinksRes.data.menu_items || [];
    if (legalLinksRes.data) footerLegalItems = legalLinksRes.data.menu_items || [];
    if (socialRes.data) socialLinks = socialRes.data.setting_value;
  } catch (err) {
    console.error("Navigation fetch failed:", err);
  }

  return (
    <html lang="en" className="bg-black">
      <body
        className={`${playfair.variable} ${inter.variable} bg-black text-white antialiased selection:bg-gold/30 selection:text-white`}
      >
        <CartProvider>
          <div className="relative flex flex-col min-h-screen">
            <Header navItems={headerNavItems} />
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
        <Analytics />
      </body>
    </html>
  );
}
