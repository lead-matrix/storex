"use client"

import React, { useState } from "react"
import { Reorder, AnimatePresence } from "framer-motion"
import { GripVertical, Trash2, Plus, Save, Loader2, X } from "lucide-react"
import { saveSections } from "@/lib/actions/cms-client"
import { toast } from "sonner"
import { SingleImageUpload } from "@/components/admin/SingleImageUpload"

type Section = {
  id?: string
  type: string
  props: Record<string, any>
}

const COMPONENT_TYPES = [
  { type: "hero", label: "Hero Banner", defaultProps: { title: "New Experience", subtitle: "", badge: "", slide1_url: "", slide2_url: "", slide3_url: "" } },
  { type: "imageBanner", label: "Image Banner", defaultProps: { imageUrl: "", title: "", subtitle: "", badge: "", ctaText: "", ctaLink: "/shop", overlayOpacity: 0.4, height: "70vh" } },
  { type: "richText", label: "Rich Text", defaultProps: { heading: "", content: "" } },
  { type: "productGrid", label: "Product Grid", defaultProps: { category: "all", limit: 4 } },
  { type: "philosophyGrid", label: "Philosophy Grid", defaultProps: { items: [] } },
  { type: "videoBlock", label: "Video Showcase", defaultProps: { playbackId: "", title: "", subtitle: "" } },
  { type: "contactForm", label: "Contact Form", defaultProps: { heading: "Get In Touch", subheading: "" } },
]

function PhilosophyGridEditor({ items, onChange }: { items: any[]; onChange: (items: any[]) => void }) {
  const updateItem = (i: number, key: string, val: any) => onChange(items.map((it, idx) => (idx === i ? { ...it, [key]: val } : it)))
  const addItem = () => onChange([...items, { icon: "Sparkles", title: "New Value", text: "Describe this value here." }])
  const removeItem = (i: number) => onChange(items.filter((_, idx) => idx !== i))

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="bg-black/40 border border-white/10 rounded p-3 space-y-2">
          <div className="flex justify-between items-center">
            <div className="text-sm font-bold">Item {i + 1}</div>
            <button onClick={() => removeItem(i)} className="text-white/40 hover:text-red-400"><X size={14} /></button>
          </div>
          <input value={item.title} onChange={e => updateItem(i, "title", e.target.value)} className="w-full bg-black/60 rounded px-2 py-1" />
          <textarea value={item.text} onChange={e => updateItem(i, "text", e.target.value)} className="w-full bg-black/60 rounded px-2 py-1" rows={2} />
        </div>
      ))}
      <button onClick={addItem} className="w-full py-2 border border-dashed rounded text-sm">+ Add Item</button>
    </div>
  )
}

export default function CMSEditor({ pageId, initialSections }: { pageId: string; initialSections: Section[] }) {
  const [sections, setSections] = useState<Section[]>(initialSections ?? [])
  const [active, setActive] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  const addSection = (comp: typeof COMPONENT_TYPES[number]) => {
    setSections(prev => [...prev, { type: comp.type, props: { ...(comp.defaultProps as Record<string, any>) } }])
    toast.success(`${comp.label} added`)
  }

  const removeSection = (idx: number) => {
    setSections(prev => prev.filter((_, i) => i !== idx))
    if (active === idx) setActive(null)
  }

  const updateProp = (idx: number, key: string, value: any) => {
    setSections(prev => {
      const next = [...prev]
      next[idx] = { ...next[idx], props: { ...next[idx].props, [key]: value } }
      return next
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveSections(pageId, sections)
      toast.success("Sections saved")
    } catch (err: any) {
      toast.error(err?.message || "Failed to save sections")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid lg:grid-cols-12 gap-6">
      <div className="lg:col-span-8 space-y-4">
        <div className="bg-obsidian border rounded p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-bold">Structural Order</div>
            <div className="text-xs text-white/40">{sections.length} components</div>
          </div>

          <Reorder.Group axis="y" values={sections} onReorder={setSections} className="space-y-3">
            <AnimatePresence>
              {sections.map((section, idx) => (
                <Reorder.Item key={section.id ?? `t-${idx}`} value={section} className={`flex items-center gap-3 p-3 bg-black/40 border rounded ${active === idx ? "border-gold/40" : "border-white/10"}`} onClick={() => setActive(idx)}>
                  <div className="cursor-grab"><GripVertical size={16} /></div>
                  <div className="flex-1">
                    <div className="font-bold text-sm">{section.type}</div>
                    <div className="text-xs text-white/30">Instance #{idx + 1}</div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); removeSection(idx) }} className="p-2 text-white/40 hover:text-red-400"><Trash2 size={14} /></button>
                </Reorder.Item>
              ))}
            </AnimatePresence>

            {sections.length === 0 && (
              <div className="py-8 border border-dashed text-center text-white/30">Canvas Empty — add a component</div>
            )}
          </Reorder.Group>
        </div>

        <button onClick={handleSave} disabled={saving} className="w-full py-3 bg-gold text-black flex items-center justify-center gap-2">
          {saving ? <Loader2 className="animate-spin" /> : <Save />} Finalize Architecture
        </button>
      </div>

      <div className="lg:col-span-4 space-y-4">
        <div className="bg-obsidian border rounded p-4">
          <div className="mb-3 font-bold text-sm">Component Vault</div>
          <div className="grid grid-cols-2 gap-3">
            {COMPONENT_TYPES.map(comp => (
              <button key={comp.type} onClick={() => addSection(comp)} className="p-3 bg-white/5 rounded text-sm">{comp.label}</button>
            ))}
          </div>
        </div>

        <div className="bg-obsidian border rounded p-4">
          <div className="mb-3 font-bold text-sm">Property Registry</div>
          {active !== null ? (
            (() => {
              const sec = sections[active]
              if (!sec) return <div className="text-white/30">No section selected</div>
              if (sec.type === "philosophyGrid") {
                const items = Array.isArray(sec.props.items) ? sec.props.items : []
                return <PhilosophyGridEditor items={items} onChange={(val) => updateProp(active, "items", val)} />
              }
              const merged = { ...(COMPONENT_TYPES.find(c => c.type === sec.type)?.defaultProps || {}), ...(sec.props || {}) } as Record<string, any>
              return (
                <div className="space-y-3">
                  {Object.keys(merged).map(key => {
                    const val = sec.props[key] ?? merged[key] ?? ""
                    const isImage = key.toLowerCase().endsWith("url")
                    return (
                      <div key={key} className="space-y-1">
                        <label className="text-xs uppercase text-white/40">{key}</label>
                        {isImage ? (
                          <SingleImageUpload value={val} onChange={(url) => updateProp(active, key, url)} />
                        ) : typeof val === "string" ? (
                          <textarea value={val} onChange={e => updateProp(active, key, e.target.value)} className="w-full bg-black/60 rounded p-2" />
                        ) : (
                          <input type="number" value={val} onChange={e => updateProp(active, key, Number(e.target.value))} className="w-full bg-black/60 rounded p-2" />
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })()
          ) : (
            <div className="text-white/30">Select a component to edit its properties.</div>
          )}
        </div>
      </div>
    </div>
  )
}
