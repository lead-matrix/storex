"use client";

import { useState } from "react";
import { Plus, Trash2, Link as LinkIcon, Type, ListTree } from "lucide-react";

type MenuItem = {
    label: string;
    href: string;
};

export default function MenuEditor({ initialItems, name }: { initialItems: MenuItem[], name: string }) {
    const [items, setItems] = useState<MenuItem[]>(initialItems || []);

    const addItem = () => {
        setItems([
            ...items,
            { label: "", href: "/" },
        ]);
    };

    const updateItem = (index: number, field: keyof MenuItem, value: string) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-4">
            <input type="hidden" name={name} value={JSON.stringify(items)} />

            {items.map((item, index) => (
                <div key={index} className="flex flex-col sm:flex-row gap-4 bg-[#121214] border border-white/5 p-4 rounded-md relative group items-start sm:items-center w-full">
                    <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="absolute top-2 right-2 text-red-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                        title="Remove Link"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="w-1/2 min-w-[150px] space-y-1">
                        <label className="text-[8px] uppercase tracking-widest text-luxury-subtext font-medium flex items-center gap-1">
                            <Type className="w-2.5 h-2.5" /> Label
                        </label>
                        <input
                            type="text"
                            value={item.label}
                            onChange={(e) => updateItem(index, "label", e.target.value)}
                            placeholder="Collections"
                            className="w-full bg-black border border-white/10 rounded px-3 py-1.5 text-xs text-white outline-none focus:border-gold/50 shadow-sm"
                            required
                        />
                    </div>

                    <div className="w-1/2 min-w-[150px] space-y-1">
                        <label className="text-[8px] uppercase tracking-widest text-luxury-subtext font-medium flex items-center gap-1">
                            <LinkIcon className="w-2.5 h-2.5" /> Path/URL
                        </label>
                        <input
                            type="text"
                            value={item.href}
                            onChange={(e) => updateItem(index, "href", e.target.value)}
                            placeholder="/collections"
                            className="w-full bg-black border border-white/10 rounded px-3 py-1.5 text-xs text-white outline-none focus:border-gold/50 shadow-sm"
                            required
                        />
                    </div>
                </div>
            ))}

            <button
                type="button"
                onClick={addItem}
                className="w-full py-3 border border-dashed border-white/10 hover:border-gold/50 text-luxury-subtext hover:text-gold rounded-md flex items-center justify-center gap-2 text-[10px] tracking-widest uppercase font-bold transition-all"
            >
                <Plus className="w-3.5 h-3.5" /> Add Navigation Link
            </button>
        </div>
    );
}

