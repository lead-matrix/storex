"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, Loader2, Plus, Trash2, ExternalLink } from "lucide-react";

interface SocialLinks {
    facebook: string;
    instagram: string;
    twitter: string;
    tiktok: string;
    youtube: string;
}

interface ContactInfo {
    email: string;
    phone: string;
    address: string;
    hours: string;
}

interface StoreInfo {
    name: string;
    tagline: string;
    description: string;
    logo_url: string;
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
    columns: FooterColumn[];
}

export default function AdminSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);

    const [storeInfo, setStoreInfo] = useState<StoreInfo>({
        name: "",
        tagline: "",
        description: "",
        logo_url: "",
    });

    const [contactInfo, setContactInfo] = useState<ContactInfo>({
        email: "",
        phone: "",
        address: "",
        hours: "",
    });

    const [socialLinks, setSocialLinks] = useState<SocialLinks>({
        facebook: "",
        instagram: "",
        twitter: "",
        tiktok: "",
        youtube: "",
    });

    const [footerLinks, setFooterLinks] = useState<FooterLinks>({
        columns: [],
    });

    const supabase = createClient();

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);

        const { data, error } = await supabase
            .from("site_settings")
            .select("*");

        if (data) {
            data.forEach((setting) => {
                switch (setting.setting_key) {
                    case "store_info":
                        setStoreInfo(setting.setting_value as StoreInfo);
                        break;
                    case "contact_info":
                        setContactInfo(setting.setting_value as ContactInfo);
                        break;
                    case "social_links":
                        setSocialLinks(setting.setting_value as SocialLinks);
                        break;
                    case "footer_links":
                        setFooterLinks(setting.setting_value as FooterLinks);
                        break;
                }
            });
        }

        setLoading(false);
    };

    const saveSettings = async () => {
        setSaving(true);
        setSuccess(false);

        try {
            // Update all settings
            await supabase
                .from("site_settings")
                .upsert([
                    { setting_key: "store_info", setting_value: storeInfo },
                    { setting_key: "contact_info", setting_value: contactInfo },
                    { setting_key: "social_links", setting_value: socialLinks },
                    { setting_key: "footer_links", setting_value: footerLinks },
                ]);

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            console.error("Error saving settings:", error);
        }

        setSaving(false);
    };

    const addFooterColumn = () => {
        setFooterLinks({
            columns: [
                ...footerLinks.columns,
                { title: "New Section", links: [] },
            ],
        });
    };

    const removeFooterColumn = (index: number) => {
        setFooterLinks({
            columns: footerLinks.columns.filter((_, i) => i !== index),
        });
    };

    const updateColumnTitle = (index: number, title: string) => {
        const newColumns = [...footerLinks.columns];
        newColumns[index].title = title;
        setFooterLinks({ columns: newColumns });
    };

    const addLink = (columnIndex: number) => {
        const newColumns = [...footerLinks.columns];
        newColumns[columnIndex].links.push({ text: "New Link", url: "/" });
        setFooterLinks({ columns: newColumns });
    };

    const removeLink = (columnIndex: number, linkIndex: number) => {
        const newColumns = [...footerLinks.columns];
        newColumns[columnIndex].links = newColumns[columnIndex].links.filter((_, i) => i !== linkIndex);
        setFooterLinks({ columns: newColumns });
    };

    const updateLink = (columnIndex: number, linkIndex: number, field: "text" | "url", value: string) => {
        const newColumns = [...footerLinks.columns];
        newColumns[columnIndex].links[linkIndex][field] = value;
        setFooterLinks({ columns: newColumns });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-gold" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-12">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-serif text-white">Store Settings</h1>
                    <p className="text-sm text-white/40 mt-2">Manage your store information, contact details, and footer content</p>
                </div>
                <Button
                    onClick={saveSettings}
                    disabled={saving}
                    className="bg-gold text-black hover:bg-white"
                >
                    {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                        <Save className="w-4 h-4 mr-2" />
                    )}
                    Save All Changes
                </Button>
            </div>

            {success && (
                <div className="bg-green-500/10 border border-green-500/20 text-green-500 p-4 rounded">
                    Settings saved successfully!
                </div>
            )}

            {/* Store Information */}
            <section className="bg-white/[0.02] border border-white/10 p-8 space-y-6">
                <h2 className="text-xl font-serif text-white border-b border-white/10 pb-4">Store Information</h2>

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label className="text-white/60">Store Name</Label>
                        <Input
                            value={storeInfo.name}
                            onChange={(e) => setStoreInfo({ ...storeInfo, name: e.target.value })}
                            className="bg-black/50 border-white/10 text-white"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-white/60">Tagline</Label>
                        <Input
                            value={storeInfo.tagline}
                            onChange={(e) => setStoreInfo({ ...storeInfo, tagline: e.target.value })}
                            className="bg-black/50 border-white/10 text-white"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-white/60">Description</Label>
                    <Textarea
                        value={storeInfo.description}
                        onChange={(e) => setStoreInfo({ ...storeInfo, description: e.target.value })}
                        className="bg-black/50 border-white/10 text-white"
                        rows={3}
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-white/60">Logo URL</Label>
                    <Input
                        value={storeInfo.logo_url}
                        onChange={(e) => setStoreInfo({ ...storeInfo, logo_url: e.target.value })}
                        className="bg-black/50 border-white/10 text-white"
                        placeholder="/logo.jpg"
                    />
                </div>
            </section>

            {/* Contact Information */}
            <section className="bg-white/[0.02] border border-white/10 p-8 space-y-6">
                <h2 className="text-xl font-serif text-white border-b border-white/10 pb-4">Contact Information</h2>

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label className="text-white/60">Email</Label>
                        <Input
                            type="email"
                            value={contactInfo.email}
                            onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                            className="bg-black/50 border-white/10 text-white"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-white/60">Phone</Label>
                        <Input
                            value={contactInfo.phone}
                            onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                            className="bg-black/50 border-white/10 text-white"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-white/60">Address</Label>
                    <Input
                        value={contactInfo.address}
                        onChange={(e) => setContactInfo({ ...contactInfo, address: e.target.value })}
                        className="bg-black/50 border-white/10 text-white"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-white/60">Business Hours</Label>
                    <Input
                        value={contactInfo.hours}
                        onChange={(e) => setContactInfo({ ...contactInfo, hours: e.target.value })}
                        className="bg-black/50 border-white/10 text-white"
                        placeholder="Monday - Friday: 9:00 AM - 6:00 PM"
                    />
                </div>
            </section>

            {/* Social Media Links */}
            <section className="bg-white/[0.02] border border-white/10 p-8 space-y-6">
                <h2 className="text-xl font-serif text-white border-b border-white/10 pb-4">Social Media Links</h2>

                <div className="grid grid-cols-2 gap-6">
                    {Object.entries(socialLinks).map(([platform, url]) => (
                        <div key={platform} className="space-y-2">
                            <Label className="text-white/60 capitalize">{platform}</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={url}
                                    onChange={(e) => setSocialLinks({ ...socialLinks, [platform]: e.target.value })}
                                    className="bg-black/50 border-white/10 text-white"
                                    placeholder={`https://${platform}.com/yourpage`}
                                />
                                {url && (
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => window.open(url, "_blank")}
                                        className="border-white/10"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer Links */}
            <section className="bg-white/[0.02] border border-white/10 p-8 space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <h2 className="text-xl font-serif text-white">Footer Links</h2>
                    <Button
                        onClick={addFooterColumn}
                        variant="outline"
                        size="sm"
                        className="border-gold text-gold hover:bg-gold hover:text-black"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Column
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {footerLinks.columns.map((column, columnIndex) => (
                        <div key={columnIndex} className="bg-black/30 border border-white/5 p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <Input
                                    value={column.title}
                                    onChange={(e) => updateColumnTitle(columnIndex, e.target.value)}
                                    className="bg-black/50 border-white/10 text-white font-serif"
                                    placeholder="Column Title"
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeFooterColumn(columnIndex)}
                                    className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {column.links.map((link, linkIndex) => (
                                    <div key={linkIndex} className="space-y-2 p-3 bg-black/30 border border-white/5">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-white/40 text-xs">Link {linkIndex + 1}</Label>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeLink(columnIndex, linkIndex)}
                                                className="h-6 w-6 text-red-500 hover:text-red-400"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </div>
                                        <Input
                                            value={link.text}
                                            onChange={(e) => updateLink(columnIndex, linkIndex, "text", e.target.value)}
                                            className="bg-black/50 border-white/10 text-white text-sm"
                                            placeholder="Link Text"
                                        />
                                        <Input
                                            value={link.url}
                                            onChange={(e) => updateLink(columnIndex, linkIndex, "url", e.target.value)}
                                            className="bg-black/50 border-white/10 text-white text-sm"
                                            placeholder="/page-url"
                                        />
                                    </div>
                                ))}
                            </div>

                            <Button
                                onClick={() => addLink(columnIndex)}
                                variant="outline"
                                size="sm"
                                className="w-full border-white/10 text-white/60 hover:text-white"
                            >
                                <Plus className="w-3 h-3 mr-2" />
                                Add Link
                            </Button>
                        </div>
                    ))}
                </div>
            </section>

            {/* Save Button (Bottom) */}
            <div className="flex justify-end">
                <Button
                    onClick={saveSettings}
                    disabled={saving}
                    className="bg-gold text-black hover:bg-white px-8"
                    size="lg"
                >
                    {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                        <Save className="w-4 h-4 mr-2" />
                    )}
                    Save All Changes
                </Button>
            </div>
        </div>
    );
}
