import Link from "next/link";
import { Instagram, Youtube, Twitter, Facebook } from "lucide-react";

interface FooterProps {
    shopLinks?: { label: string, href: string }[];
    legalLinks?: { label: string, href: string }[];
    social?: { instagram?: string, tiktok?: string, facebook?: string, pinterest?: string, youtube?: string };
}

export async function Footer({ shopLinks = [], legalLinks = [], social }: FooterProps) {
    const currentYear = new Date().getFullYear();

    const fallbackLegal = [
        { label: 'Privacy', href: '/privacy' },
        { label: 'Terms', href: '/terms' },
        { label: 'Contact', href: '/contact' }
    ];

    const legal = legalLinks.length > 0 ? legalLinks : fallbackLegal;

    return (
        <footer className="bg-background border-t border-border pt-20 pb-10 px-6 mt-10">
            <div className="container-luxury flex flex-col items-center">

                <Link href="/" className="group mb-8">
                    <h2 className="font-playfair text-3xl md:text-5xl tracking-widest text-primary uppercase transition-all duration-700 hover:text-textPrimary text-center">
                        DINA COSMETIC
                    </h2>
                </Link>

                <div className="flex items-center gap-8 mb-12">
                    {legal.map(link => (
                        <Link key={link.href} href={link.href} className="text-xs uppercase tracking-widest text-textSecondary hover:text-primary transition-colors">
                            {link.label}
                        </Link>
                    ))}
                </div>

                <div className="flex flex-col items-center space-y-6">
                    <div className="flex gap-4">
                        {social?.instagram && (
                            <Link href={social.instagram} target="_blank" className="text-textSecondary hover:text-primary transition-colors">
                                <Instagram size={18} strokeWidth={1.5} />
                            </Link>
                        )}
                        {social?.facebook && (
                            <Link href={social.facebook} target="_blank" className="text-textSecondary hover:text-primary transition-colors">
                                <Facebook size={18} strokeWidth={1.5} />
                            </Link>
                        )}
                        {social?.youtube && (
                            <Link href={social.youtube} target="_blank" className="text-textSecondary hover:text-primary transition-colors">
                                <Youtube size={18} strokeWidth={1.5} />
                            </Link>
                        )}
                    </div>

                    <p className="text-[10px] uppercase tracking-widest text-textSecondary opacity-50">
                        © {currentYear} DINA COSMETIC. All Rights Reserved.
                    </p>
                </div>

            </div>
        </footer>
    );
}
