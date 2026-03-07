"use client"

import { useState } from "react"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { toast } from "sonner"
import { GripVertical, Trash2, Plus } from "lucide-react"

// Types
interface Section {
    id: string;
    type: "hero" | "banner" | "product_grid" | "cta";
    [key: string]: any;
}

// Available Blocks
const AVAILABLE_BLOCKS = [
    { type: "hero", label: "Hero Banner", defaultProps: { title: "New Collection", subtitle: "Limited Drop" } },
    { type: "banner", label: "Announcement Banner", defaultProps: { text: "Free shipping over $50" } },
    { type: "product_grid", label: "Product Grid", defaultProps: { collection: "Featured" } },
    { type: "cta", label: "Call to Action", defaultProps: { headline: "Shop Now", text: "Click Here" } },
]

function SortableItem({ id, section, onRemove, onChange }: { id: string, section: Section, onRemove: (id: string) => void, onChange: (id: string, key: string, val: any) => void }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    return (
        <div ref={setNodeRef} style={style} className="flex gap-4 items-start p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm mb-4">
            <button {...attributes} {...listeners} className="mt-2 text-zinc-400 hover:text-zinc-900 cursor-grab">
                <GripVertical size={20} />
            </button>

            <div className="flex-1 space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 uppercase text-xs tracking-wider">
                        {AVAILABLE_BLOCKS.find(b => b.type === section.type)?.label || section.type}
                    </h3>
                    <button onClick={() => onRemove(section.id)} className="text-red-500 hover:text-red-700">
                        <Trash2 size={16} />
                    </button>
                </div>

                {/* Dynamic Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.keys(section).filter(k => k !== 'id' && k !== 'type').map(key => (
                        <div key={key} className="flex flex-col gap-1">
                            <label className="text-xs uppercase text-zinc-500 tracking-wider font-medium">{key}</label>
                            <input
                                type="text"
                                value={section[key]}
                                onChange={e => onChange(section.id, key, e.target.value)}
                                className="border border-zinc-200 dark:border-zinc-800 rounded px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default function PageBuilder() {
    const [sections, setSections] = useState<Section[]>([
        { id: "1", type: "hero", title: "New Collection", subtitle: "Limited Drop", image: "/placeholder.jpg" },
        { id: "2", type: "product_grid", collection: "summer" },
        { id: "3", type: "cta", text: "Shop Now", link: "/shop", headline: "Welcome", description: "Discover more" }
    ])

    const [pageMeta, setPageMeta] = useState({ slug: "home", title: "Home Page" })
    const [isSaving, setIsSaving] = useState(false)

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    )

    const handleDragEnd = (event: any) => {
        const { active, over } = event
        if (active.id !== over.id) {
            setSections((items) => {
                const oldIndex = items.findIndex(i => i.id === active.id)
                const newIndex = items.findIndex(i => i.id === over.id)
                return arrayMove(items, oldIndex, newIndex)
            })
        }
    }

    const handleAddBlock = (type: string) => {
        const blockMeta = AVAILABLE_BLOCKS.find(b => b.type === type)
        if (!blockMeta) return
        const newSection: Section = {
            id: Math.random().toString(36).substr(2, 9),
            type: type as any,
            ...blockMeta.defaultProps
        }
        setSections([...sections, newSection])
    }

    const handleRemoveBlock = (id: string) => {
        setSections(sections.filter(s => s.id !== id))
    }

    const handleChange = (id: string, key: string, val: any) => {
        setSections(sections.map(s => {
            if (s.id === id) {
                return { ...s, [key]: val }
            }
            return s
        }))
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            // Create JSON structure matching schema
            const payload = {
                slug: pageMeta.slug,
                title: pageMeta.title,
                status: "published",
                content: { sections }
            }

            // We call the API wrapper or supabase directly
            // In a real app we'd want to use an action or API route due to RLS.
            // For this implementation, we will mock API via fetch
            const res = await fetch('/api/admin/pages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                toast.success("Page published successfully")
            } else {
                throw new Error(await res.text())
            }
        } catch (e: any) {
            toast.error(e.message || "Failed to save page")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 pb-4">
                <div>
                    <h1 className="text-3xl font-light tracking-tight text-zinc-900 dark:text-锌-100">Visual Page Builder</h1>
                    <p className="text-zinc-500 mt-1">Drag and drop blocks to build headless pages</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900 px-6 py-2 rounded-md font-medium text-sm disabled:opacity-50"
                >
                    {isSaving ? "Saving..." : "Save & Publish"}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                {/* Left Sidebar - Meta & Available Blocks */}
                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
                        <h3 className="text-sm uppercase tracking-wider font-semibold mb-4 text-zinc-900 dark:text-zinc-100">Page Meta</h3>
                        <div className="space-y-4 text-sm">
                            <div className="flex flex-col gap-1">
                                <label className="text-zinc-500 font-medium tracking-wide">Title</label>
                                <input
                                    type="text"
                                    value={pageMeta.title}
                                    onChange={e => setPageMeta({ ...pageMeta, title: e.target.value })}
                                    className="border border-zinc-200 dark:border-zinc-800 rounded px-3 py-2 bg-white dark:bg-zinc-900"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-zinc-500 font-medium tracking-wide">Slug (/route)</label>
                                <input
                                    type="text"
                                    value={pageMeta.slug}
                                    onChange={e => setPageMeta({ ...pageMeta, slug: e.target.value })}
                                    className="border border-zinc-200 dark:border-zinc-800 rounded px-3 py-2 bg-white dark:bg-zinc-900"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
                        <h3 className="text-sm uppercase tracking-wider font-semibold mb-4 text-zinc-900 dark:text-zinc-100">Add Block</h3>
                        <div className="space-y-2">
                            {AVAILABLE_BLOCKS.map(block => (
                                <button
                                    key={block.type}
                                    onClick={() => handleAddBlock(block.type)}
                                    className="w-full text-left px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md text-sm font-medium hover:border-zinc-400 transition-colors flex items-center gap-2"
                                >
                                    <Plus size={16} className="text-zinc-400" />
                                    {block.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Area - Canvas */}
                <div className="lg:col-span-3">
                    <div className="bg-zinc-50/50 dark:bg-zinc-950/50 min-h-[600px] p-6 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 relative">

                        {sections.length === 0 ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400">
                                <p>No blocks added yet.</p>
                                <p className="text-sm mt-1">Add a block from the sidebar to get started.</p>
                            </div>
                        ) : (
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                                    {sections.map(section => (
                                        <SortableItem
                                            key={section.id}
                                            id={section.id}
                                            section={section}
                                            onRemove={handleRemoveBlock}
                                            onChange={handleChange}
                                        />
                                    ))}
                                </SortableContext>
                            </DndContext>
                        )}

                    </div>
                </div>

            </div>
        </div>
    )
}
