"use client";

import { useState } from "react";
import { MapPin, Phone, Mail, User } from "lucide-react";

interface WarehouseInfo {
    name: string;
    street1: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone: string;
    email: string;
    parcel_l?: string;
    parcel_w?: string;
    parcel_h?: string;
    parcel_wt?: string;
}

export default function WarehouseEditor({ initialData }: { initialData: WarehouseInfo }) {
    const [info, setInfo] = useState<WarehouseInfo>(initialData || {
        name: "DINA COSMETIC",
        street1: "",
        city: "",
        state: "",
        zip: "",
        country: "US",
        phone: "",
        email: "support@dinacosmetic.store",
        parcel_l: "8",
        parcel_w: "6",
        parcel_h: "4",
        parcel_wt: "1"
    });

    const handleChange = (field: keyof WarehouseInfo, value: string) => {
        setInfo(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="space-y-6">
            <input type="hidden" name="warehouse_info" value={JSON.stringify(info)} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-luxury text-gold font-bold flex items-center gap-2">
                        <User className="w-3 h-3" /> Sender Name
                    </label>
                    <input
                        type="text"
                        value={info.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        className="w-full bg-pearl border border-charcoal/10 rounded px-4 py-2 text-xs outline-none focus:border-gold transition-all"
                        placeholder="Dina Cosmetic | Warehouse 1"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-luxury text-gold font-bold flex items-center gap-2">
                        <Mail className="w-3 h-3" /> Support Email
                    </label>
                    <input
                        type="email"
                        value={info.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        className="w-full bg-pearl border border-charcoal/10 rounded px-4 py-2 text-xs outline-none focus:border-gold transition-all"
                    />
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-luxury text-gold font-bold flex items-center gap-2">
                    <MapPin className="w-3 h-3" /> Street Address
                </label>
                <input
                    type="text"
                    value={info.street1}
                    onChange={(e) => handleChange("street1", e.target.value)}
                    className="w-full bg-pearl border border-charcoal/10 rounded px-4 py-2 text-xs outline-none focus:border-gold transition-all"
                    placeholder="2417 Galveston Rd"
                />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-luxury text-gold font-bold">City</label>
                    <input
                        type="text"
                        value={info.city}
                        onChange={(e) => handleChange("city", e.target.value)}
                        className="w-full bg-pearl border border-charcoal/10 rounded px-4 py-2 text-xs outline-none focus:border-gold transition-all"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-luxury text-gold font-bold">State</label>
                    <input
                        type="text"
                        value={info.state}
                        onChange={(e) => handleChange("state", e.target.value)}
                        className="w-full bg-pearl border border-charcoal/10 rounded px-4 py-2 text-xs outline-none focus:border-gold transition-all"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-luxury text-gold font-bold">Zip</label>
                    <input
                        type="text"
                        value={info.zip}
                        onChange={(e) => handleChange("zip", e.target.value)}
                        className="w-full bg-pearl border border-charcoal/10 rounded px-4 py-2 text-xs outline-none focus:border-gold transition-all"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-luxury text-gold font-bold">Phone</label>
                    <input
                        type="text"
                        value={info.phone}
                        onChange={(e) => handleChange("phone", e.target.value)}
                        className="w-full bg-pearl border border-charcoal/10 rounded px-4 py-2 text-xs outline-none focus:border-gold transition-all"
                        placeholder="+1..."
                    />
                </div>
            </div>

            <div className="pt-4 border-t border-charcoal/5">
                <label className="text-[10px] uppercase tracking-luxury text-gold font-bold mb-3 block">Default Parcel (Inches / Lbs)</label>
                <div className="grid grid-cols-4 gap-4">
                    <input value={info.parcel_l} onChange={(e) => handleChange("parcel_l", e.target.value)} placeholder="L" className="bg-pearl border border-charcoal/10 rounded px-3 py-1.5 text-xs outline-none" />
                    <input value={info.parcel_w} onChange={(e) => handleChange("parcel_w", e.target.value)} placeholder="W" className="bg-pearl border border-charcoal/10 rounded px-3 py-1.5 text-xs outline-none" />
                    <input value={info.parcel_h} onChange={(e) => handleChange("parcel_h", e.target.value)} placeholder="H" className="bg-pearl border border-charcoal/10 rounded px-3 py-1.5 text-xs outline-none" />
                    <input value={info.parcel_wt} onChange={(e) => handleChange("parcel_wt", e.target.value)} placeholder="Lb" className="bg-pearl border border-charcoal/10 rounded px-3 py-1.5 text-xs outline-none" />
                </div>
            </div>
        </div>
    );
}
