"use client"

import { useState } from "react"
import { motion, Reorder, AnimatePresence } from "framer-motion"
import { GripVertical, Trash2, Plus, Save, Settings2, Image as ImageIcon, Type, LayoutGrid, Palette, Sparkles, Loader2, Mail, Film } from "lucide-react"
import { saveSections } from "@/lib/actions/cms"
import { toast } from "sonner"
import { SingleImageUpload } from "@/components/admin/SingleImageUpload"


interface Section {
    id?: string
    type: string
    props: any
}

// ── COMPONENT REGISTRY ──
const COMPONENT_TYPES = [
    { type: "hero", label: "Hero Banner", icon: Sparkles, color: "text-amber-400", defaultProps: { title: "New Experience", subtitle: "Crafted for Excellence", imageUrl: "" } },
    { type: "productGrid", label: "Product Gallery", icon: LayoutGrid, color: "text-emerald-400", defaultProps: { category: "all", limit: 4 } },
    { type: "richText", label: "Philosophy Block", icon: Type, color: "text-blue-400", defaultProps: { content: "Add your storytelling here..." } },
    { type: "philosophyGrid", label: "Philosophy Grid", icon: LayoutGrid, color: "text-amber-500/80", defaultProps: {} },
    { type: "imageBanner", label: "Visual Vibe", icon: ImageIcon, color: "text-purple-400", defaultProps: { imageUrl: "", title: "", subtitle: "", ctaText: "", ctaLink: "", overlayOpacity: 0.4, height: "70vh" } },
    { type: "videoBlock", label: "Video Showcase", icon: Film, color: "text-red-400", defaultProps: { playbackId: "", title: "", subtitle: "", autoPlay: 1 } },
    { type: "contactForm", label: "Concierge Link", icon: Mail, color: "text-gold", defaultProps: {} },
]

export default function CMSEditor({ pageId, initialSections }: { pageId: string, initialSections: any[] }) {
    const [sections, setSections] = useState<Section[]>(initialSections)
    const [activeSection, setActiveSection] = useState<number | null>(null)
    const [saving, setSaving] = useState(false)

    async function handleSave() {
        setSaving(true)
        try {
            await saveSections(pageId, sections)
            toast.success("Architecture finalized")
        } catch (err: any) {
            toast.error(err.message || "Failed to save")
        } finally {
            setSaving(false)
        }
    }

    function addSection(component: typeof COMPONENT_TYPES[0]) {
        const newSection: Section = {
            type: component.type,
            props: { ...component.defaultProps }
        }
        setSections([...sections, newSection])
        setActiveSection(sections.length)
        toast.success(`${component.label} Added`)
    }

    function removeSection(index: number) {
        const newSections = [...sections]
        newSections.splice(index, 1)
        setSections(newSections)
        if (activeSection === index) setActiveSection(null)
    }

    function updateProp(index: number, key: string, value: any) {
        const newSections = [...sections]
        newSections[index].props = { ...newSections[index].props, [key]: value }
        setSections(newSections)
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* ── LEFT: SECTION LIST (DRAGGABLE) ── */}
            <div className="lg:col-span-8 space-y-6">
                <div className="bg-obsidian border border-luxury-border rounded-luxury overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-luxury font-bold text-gold">Structural Order</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] text-white/20 uppercase tracking-widest">{sections.length} Components</span>
                        </div>
                    </div>

                    <Reorder.Group axis="y" values={sections} onReorder={setSections} className="p-6 space-y-4">
                        <AnimatePresence mode="popLayout">
                            {sections.map((section, index) => (
                                <Reorder.Item
                                    key={section.id || `temp-${index}`}
                                    value={section}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className={`group flex items-center gap-4 p-4 bg-black/40 border transition-all cursor-default ${activeSection === index ? "border-gold/50 bg-gold/5 shadow-gold-soft" : "border-white/10 hover:border-gold/30"}`}
                                    onClick={() => setActiveSection(index)}
                                >
                                    <div className="cursor-grab active:cursor-grabbing text-white/10 group-hover:text-gold/40">
                                        <GripVertical size={16} />
                                    </div>

                                    <div className="flex-grow flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-sm bg-white/5 border border-white/10 flex items-center justify-center ${activeSection === index ? "text-gold" : "text-white/40"}`}>
                                            {(() => {
                                                const Icon = COMPONENT_TYPES.find(c => c.type === section.type)?.icon || Sparkles
                                                return <Icon size={16} />
                                            })()}
                                        </div>
                                        <div>
                                            <p className="text-[11px] uppercase tracking-luxury font-bold text-white/80">
                                                {COMPONENT_TYPES.find(c => c.type === section.type)?.label || section.type}
                                            </p>
                                            <p className="text-[9px] text-white/20 font-mono mt-0.5">Instance: #{index + 1}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); removeSection(index); }}
                                            className="p-2 text-white/20 hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </Reorder.Item>
                            ))}
                        </AnimatePresence>

                        {sections.length === 0 && (
                            <div className="py-12 border-2 border-dashed border-white/5 flex flex-col items-center justify-center text-white/10">
                                <Palette size={32} className="mb-4 opacity-20" />
                                <p className="text-[10px] uppercase tracking-luxury">Canvas Empty</p>
                            </div>
                        )}
                    </Reorder.Group>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full py-5 bg-gold text-black text-[11px] font-bold uppercase tracking-[0.4em] flex items-center justify-center gap-3 hover:bg-gold-light transition-all shadow-gold disabled:opacity-50"
                >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Finalize Digital Architecture
                </button>
            </div>

            {/* ── RIGHT: TOOLBOX / SETTINGS ── */}
            <div className="lg:col-span-4 space-y-6 sticky top-8">

                {/* ── COMPONENT VAULT ── */}
                <div className="bg-obsidian border border-luxury-border rounded-luxury overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/5 bg-white/5">
                        <span className="text-[10px] uppercase tracking-luxury font-bold text-gold">Component Vault</span>
                    </div>
                    <div className="p-6 grid grid-cols-2 gap-3">
                        {COMPONENT_TYPES.map((comp) => (
                            <button
                                key={comp.type}
                                onClick={() => addSection(comp)}
                                className="flex flex-col items-center justify-center gap-3 p-4 bg-white/5 border border-white/10 rounded hover:border-gold/30 hover:bg-gold/5 transition-all group"
                            >
                                <comp.icon className={`w-5 h-5 ${comp.color} opacity-40 group-hover:opacity-100 transition-opacity`} />
                                <span className="text-[9px] uppercase tracking-widest text-white/40 group-hover:text-white font-bold">{comp.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── PROPERTY REGISTRY ── */}
                <div className="bg-obsidian border border-luxury-border rounded-luxury overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex items-center gap-3">
                        <Settings2 size={12} className="text-gold" />
                        <span className="text-[10px] uppercase tracking-luxury font-bold text-gold">Property Registry</span>
                    </div>
                    <div className="p-8">
                        {activeSection !== null ? (
                            <div className="space-y-6">
                                <div className="space-y-1 pb-4 border-b border-white/5">
                                    <p className="text-[10px] text-white/80 font-serif uppercase tracking-luxury">
                                        {COMPONENT_TYPES.find(c => c.type === sections[activeSection].type)?.label} Configuration
                                    </p>
                                    <p className="text-[8px] text-white/20 font-mono">ID: {sections[activeSection].id || "unsaved_instance"}</p>
                                </div>

                                {Object.keys({
                                    ...(COMPONENT_TYPES.find(c => c.type === sections[activeSection].type)?.defaultProps || {}), 
                                    ...sections[activeSection].props
                                }).map((key) => {
                                    const isImageUrl = key.toLowerCase().endsWith('url');
                                    // Make sure we read from the merged props to avoid undefined value warnings
                                    const defaultProps = (COMPONENT_TYPES.find(c => c.type === sections[activeSection].type) as any)?.defaultProps || {};
                                    const currentValue = sections[activeSection].props[key] !== undefined 
                                        ? sections[activeSection].props[key] 
                                        : defaultProps[key] || '';
                                        
                                    return (
                                        <div key={key} className="space-y-2">
                                            <label className="text-[9px] uppercase tracking-widest text-white/30 font-bold">{key.replace(/([A-Z])/g, ' $1')}</label>
                                            {isImageUrl ? (
                                                <div className="bg-black/40 border border-white/10 rounded p-4">
                                                    <SingleImageUpload
                                                        value={currentValue}
                                                        onChange={(url) => updateProp(activeSection, key, url)}
                                                        className="w-full h-32"
                                                    />
                                                </div>
                                            ) : typeof currentValue === 'string' ? (
                                                <textarea
                                                    value={currentValue}
                                                    onChange={(e) => updateProp(activeSection, key, e.target.value)}
                                                    className="w-full bg-black/40 border border-white/10 rounded p-3 text-xs text-white focus:border-gold/50 outline-none transition-all min-h-[80px]"
                                                />
                                            ) : (
                                                <input
                                                    type="number"
                                                    value={currentValue}
                                                    onChange={(e) => updateProp(activeSection, key, parseInt(e.target.value))}
                                                    className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-xs text-white focus:border-gold/50 outline-none transition-all font-mono"
                                                />
                                            )}
                                        </div>
                                    )
                                })}

                            </div>
                        ) : (
                            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 opacity-20">
                                <Settings2 size={24} />
                                <p className="text-[9px] uppercase tracking-widest font-bold">Select a component to adjust its parameters.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
