import Link from "next/link";
import { Instagram, Facebook, Twitter, MapPin, Phone, Mail, Youtube } from "lucide-react";
import { FaTiktok } from "react-icons/fa";
import { createClient } from "@/utils/supabase/server";

interface SocialLinks {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    tiktok?: string;
    youtube?: string;
}

interface ContactInfo {
    email?: string;
    phone?: string;
    address?: string;
    hours?: string;
}

interface StoreInfo {
    name?: string;
    tagline?: string;
    description?: string;
}

interface FooterLink {
    text: string;
    url: string;
}

interface FooterColumn {
    title: string;
    links: FooterLink[];
}

interface FooterLinks {
    columns?: FooterColumn[];
}

export async function Footer() {
    const supabase = await createClient();

    // Fetch site settings and footer content
    const [settingsResult, footerContentResult] = await Promise.all([
        supabase.from("site_settings").select("*"),
        supabase.from("frontend_content").select("content_data").eq("content_key", "footer_main").single()
    ]);

    const { data: settings } = settingsResult;
    const { data: footerContentData } = footerContentResult;
    const footerContent = footerContentData?.content_data;

    let storeInfo: StoreInfo = {
        name: footerContent?.tagline || "DINA COSMETIC",
        tagline: "The Obsidian Palace",
        description: footerContent?.tagline || "Ultra-minimalist luxury beauty and skincare curated at the Obsidian Palace.",
    };

    let contactInfo: ContactInfo = {
        email: "concierge@dinacosmetic.store",
        phone: "+1 (800) 123-4567",
        address: "123 Obsidian Avenue",
        hours: "Mon-Fri: 9AM-6PM",
    };

    let socialLinks: SocialLinks = {
        facebook: footerContent?.social_links?.facebook || "",
        instagram: footerContent?.social_links?.instagram || "",
        twitter: footerContent?.social_links?.twitter || "",
        tiktok: footerContent?.social_links?.tiktok || "",
        youtube: footerContent?.social_links?.youtube || "",
    };

    let footerLinks: FooterLinks = {
        columns: footerContent?.columns || [
            {
                title: "THE COLLECTION",
                links: [
                    { text: "All Products", url: "/shop" },
                    { text: "Curated Sets", url: "/collections" },
                ],
            },
            {
                title: "THE PALACE",
                links: [
                    { text: "Our Story", url: "/about" },
                    { text: "Boutique", url: "/shop" },
                    { text: "Contact", url: "/contact" },
                ],
            },
        ],
    };

    // Parse settings if available (settings take precedence for operational info)
    if (settings) {
        settings.forEach((setting) => {
            switch (setting.setting_key) {
                case "store_info":
                    storeInfo = { ...storeInfo, ...setting.setting_value };
                    break;
                case "contact_info":
                    contactInfo = { ...contactInfo, ...setting.setting_value };
                    break;
                case "social_links":
                    // If social links are defined in site_settings, they override footer_content
                    socialLinks = { ...socialLinks, ...setting.setting_value };
                    break;
                case "footer_links":
                    footerLinks = { ...footerLinks, ...setting.setting_value };
                    break;
            }
        });
    }

    return (
        <footer className="bg-background-primary border-t border-gold-primary/10 pt-20 pb-10 px-6">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
                {/* Brand */}
                <div className="space-y-6">
                    <h2 className="text-xl font-serif tracking-[0.3em] text-text-headingDark">
                        {storeInfo.name}
                    </h2>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-text-mutedDark leading-relaxed">
                        {storeInfo.description}
                    </p>
                    <div className="flex gap-4">
                        {socialLinks.instagram && (
                            <Link
                                href={socialLinks.instagram}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-text-mutedDark hover:text-gold-primary transition-colors"
                                aria-label="Instagram"
                            >
                                <Instagram size={18} />
                            </Link>
                        )}
                        {socialLinks.facebook && (
                            <Link
                                href={socialLinks.facebook}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-text-mutedDark hover:text-gold-primary transition-colors"
                                aria-label="Facebook"
                            >
                                <Facebook size={18} />
                            </Link>
                        )}
                        {socialLinks.twitter && (
                            <Link
                                href={socialLinks.twitter}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-text-mutedDark hover:text-gold-primary transition-colors"
                                aria-label="Twitter"
                            >
                                <Twitter size={18} />
                            </Link>
                        )}
                        {socialLinks.tiktok && (
                            <Link
                                href={socialLinks.tiktok}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-text-mutedDark hover:text-gold-primary transition-colors"
                                aria-label="TikTok"
                            >
                                <FaTiktok size={18} />
                            </Link>
                        )}
                        {socialLinks.youtube && (
                            <Link
                                href={socialLinks.youtube}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-text-mutedDark hover:text-gold-primary transition-colors"
                                aria-label="YouTube"
                            >
                                <Youtube size={18} />
                            </Link>
                        )}
                    </div>
                </div>

                {/* Dynamic Footer Columns */}
                {footerLinks.columns?.map((column, index) => (
                    <div key={index} className="space-y-6">
                        <h3 className="text-[10px] uppercase tracking-[0.4em] text-gold-primary font-bold">
                            {column.title}
                        </h3>
                        <nav className="flex flex-col gap-4 text-[10px] uppercase tracking-[0.2em] text-text-mutedDark">
                            {column.links.map((link, linkIndex) => (
                                <Link
                                    key={linkIndex}
                                    href={link.url}
                                    className="hover:text-text-headingDark transition-colors"
                                >
                                    {link.text}
                                </Link>
                            ))}
                        </nav>
                    </div>
                ))}

                {/* Contact */}
                <div className="space-y-6">
                    <h3 className="text-[10px] uppercase tracking-[0.4em] text-gold-primary font-bold">
                        Inquiries
                    </h3>
                    <div className="flex flex-col gap-4 text-[10px] uppercase tracking-[0.2em] text-text-mutedDark">
                        {contactInfo.address && (
                            <div className="flex items-start gap-3">
                                <MapPin size={14} className="text-gold-primary mt-0.5 flex-shrink-0" />
                                <span>{contactInfo.address}</span>
                            </div>
                        )}
                        {contactInfo.email && (
                            <div className="flex items-center gap-3">
                                <Mail size={14} className="text-gold-primary flex-shrink-0" />
                                <a
                                    href={`mailto:${contactInfo.email}`}
                                    className="hover:text-text-headingDark transition-colors break-all"
                                >
                                    {contactInfo.email}
                                </a>
                            </div>
                        )}
                        {contactInfo.phone && (
                            <div className="flex items-center gap-3">
                                <Phone size={14} className="text-gold-primary flex-shrink-0" />
                                <a
                                    href={`tel:${contactInfo.phone.replace(/\s/g, "")}`}
                                    className="hover:text-text-headingDark transition-colors"
                                    suppressHydrationWarning
                                >
                                    {contactInfo.phone}
                                </a>
                            </div>
                        )}
                        {contactInfo.hours && (
                            <div className="flex items-start gap-3 pt-2 border-t border-text-headingDark/5">
                                <span className="text-gold-primary text-[9px]">HOURS:</span>
                                <span className="text-[9px]">{contactInfo.hours}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto border-t border-white/5 pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
                <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-600" suppressHydrationWarning>
                    © {new Date().getFullYear()} {storeInfo.name}. All rights reserved.
                </p>
                <div className="flex items-center gap-8 grayscale opacity-30">
                    <img
                        src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg"
                        alt="PayPal"
                        className="h-4"
                    />
                    <img
                        src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg"
                        alt="Visa"
                        className="h-3"
                    />
                    <img
                        src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg"
                        alt="Mastercard"
                        className="h-4"
                    />
                </div>
            </div>
        </footer>
    );
}
