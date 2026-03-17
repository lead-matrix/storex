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
    const [headerRes, shopLinksRes, legalLinksRes, socialRes] = await Promise.allSettled([
      supabase.from('navigation_menus').select('menu_items').eq('menu_key', 'header_main').maybeSingle(),
      supabase.from('navigation_menus').select('menu_items').eq('menu_key', 'footer_shop').maybeSingle(),
      supabase.from('navigation_menus').select('menu_items').eq('menu_key', 'footer_legal').maybeSingle(),
      supabase.from('site_settings').select('setting_value').eq('setting_key', 'social_media').maybeSingle(),
    ]);

    if (headerRes.status === 'fulfilled' && headerRes.value.data) {
      headerNavItems = headerRes.value.data.menu_items || [];
    }
    if (shopLinksRes.status === 'fulfilled' && shopLinksRes.value.data) {
      footerShopItems = shopLinksRes.value.data.menu_items || [];
    }
    if (legalLinksRes.status === 'fulfilled' && legalLinksRes.value.data) {
      footerLegalItems = legalLinksRes.value.data.menu_items || [];
    }
    if (socialRes.status === 'fulfilled' && socialRes.value.data) {
      socialLinks = socialRes.value.data.setting_value;
    }
  } catch (err) {
    console.error("Critical Layout Error:", err);
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
        <Script id="chatbase-loader" strategy="afterInteractive">
          {`(function(){if(!window.chatbase||window.chatbase("getState")!=="initialized"){window.chatbase=(...arguments)=>{if(!window.chatbase.q){window.chatbase.q=[]}window.chatbase.q.push(arguments)};window.chatbase=new Proxy(window.chatbase,{get(target,prop){if(prop==="q"){return target.q}return(...args)=>target(prop,...args)}})}const onLoad=function(){const script=document.createElement("script");const host="${process.env.NEXT_PUBLIC_CHATBASE_HOST || 'https://www.chatbase.co/'}";script.src=host.replace(/\\/$/, '') + '/embed.min.js';script.id="${process.env.NEXT_PUBLIC_CHATBOT_ID}";script.domain="www.chatbase.co";document.body.appendChild(script)};if(document.readyState==="complete"){onLoad()}else{window.addEventListener("load",onLoad)}})();`}
        </Script>
      </body>
    </html>
  );
}
