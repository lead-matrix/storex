"use client";

import { useState } from "react";
import { Plus, Trash2, Image as ImageIcon, Link as LinkIcon, Type, MousePointer2 } from "lucide-react";
import { SingleImageUpload } from "@/components/admin/SingleImageUpload";

type Slide = {
    id: number | string;
    image: string;
    title: string;
    subtitle: string;
    buttonText: string;
    link: string;
};

export default function HeroSlidesEditor({ initialSlides }: { initialSlides: Slide[] }) {
    const [slides, setSlides] = useState<Slide[]>(initialSlides || []);

    const addSlide = () => {
        setSlides([
            ...slides,
            { id: Date.now(), image: "", title: "", subtitle: "", buttonText: "SHOP NOW", link: "/collections" },
        ]);
    };

    const updateSlide = (index: number, field: keyof Slide, value: string) => {
        const newSlides = [...slides];
        newSlides[index] = { ...newSlides[index], [field]: value };
        setSlides(newSlides);
    };

    const removeSlide = (index: number) => {
        setSlides(slides.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-6">
            <input type="hidden" name="hero_slides" value={JSON.stringify(slides)} />

            <div className="space-y-4">
                {slides.map((slide, index) => (
                    <div key={slide.id} className="p-6 bg-pearl/30 border border-charcoal/10 rounded-md relative group">
                        <button
                            type="button"
                            onClick={() => removeSlide(index)}
                            className="absolute top-4 right-4 text-red-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                            title="Remove Slide"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[9px] uppercase tracking-luxury text-textsoft font-medium flex items-center gap-2 text-charcoal/70 mb-2">
                                    <ImageIcon className="w-3 h-3" /> Image URL
                                </label>
                                <div className="flex items-center gap-4">
                                    <SingleImageUpload
                                        value={slide.image}
                                        onChange={(url: string) => updateSlide(index, "image", url)}
                                    />
                                    <input
                                        type="text"
                                        value={slide.image}
                                        onChange={(e) => updateSlide(index, "image", e.target.value)}
                                        placeholder="https://... or upload"
                                        className="flex-1 bg-white border border-charcoal/10 rounded-md px-4 py-2 text-xs text-charcoal outline-none focus:border-gold/50 shadow-sm"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] uppercase tracking-luxury text-textsoft font-medium flex items-center gap-2 text-charcoal/70">
                                    <Type className="w-3 h-3" /> Title
                                </label>
                                <input
                                    type="text"
                                    value={slide.title}
                                    onChange={(e) => updateSlide(index, "title", e.target.value)}
                                    placeholder="DINA COSMETIC"
                                    className="w-full bg-white border border-charcoal/10 rounded-md px-4 py-2 text-xs text-charcoal outline-none focus:border-gold/50 shadow-sm"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] uppercase tracking-luxury text-textsoft font-medium flex items-center gap-2 text-charcoal/70">
                                    <Type className="w-3 h-3" /> Subtitle
                                </label>
                                <input
                                    type="text"
                                    value={slide.subtitle}
                                    onChange={(e) => updateSlide(index, "subtitle", e.target.value)}
                                    placeholder="Elevate your ritual..."
                                    className="w-full bg-white border border-charcoal/10 rounded-md px-4 py-2 text-xs text-charcoal outline-none focus:border-gold/50 shadow-sm"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] uppercase tracking-luxury text-textsoft font-medium flex items-center gap-2 text-charcoal/70">
                                        <MousePointer2 className="w-3 h-3" /> Button Text
                                    </label>
                                    <input
                                        type="text"
                                        value={slide.buttonText}
                                        onChange={(e) => updateSlide(index, "buttonText", e.target.value)}
                                        placeholder="SHOP NOW"
                                        className="w-full bg-white border border-charcoal/10 rounded-md px-4 py-2 text-xs text-charcoal outline-none focus:border-gold/50 shadow-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] uppercase tracking-luxury text-textsoft font-medium flex items-center gap-2 text-charcoal/70">
                                        <LinkIcon className="w-3 h-3" /> Link Destination
                                    </label>
                                    <input
                                        type="text"
                                        value={slide.link}
                                        onChange={(e) => updateSlide(index, "link", e.target.value)}
                                        placeholder="/collections"
                                        className="w-full bg-white border border-charcoal/10 rounded-md px-4 py-2 text-xs text-charcoal outline-none focus:border-gold/50 shadow-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <button
                type="button"
                onClick={addSlide}
                className="w-full py-4 border-2 border-dashed border-charcoal/10 hover:border-gold/50 text-textsoft hover:text-gold rounded-md flex items-center justify-center gap-2 text-[10px] tracking-widest uppercase font-bold transition-all"
            >
                <Plus className="w-4 h-4" /> Add New Slide
            </button>
            <p className="text-[9px] text-textsoft/70 uppercase tracking-luxury leading-relaxed mt-2 text-center">
                Visual Edits automatically sync to the JSON interface.
            </p>
        </div>
    );
}

