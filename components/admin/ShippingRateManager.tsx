"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Package, Truck, Globe, Plus, Trash2, Save, Loader2,
  ChevronDown, ChevronUp, Info, DollarSign, Weight
} from "lucide-react";

interface WeightBracket {
  id: string;
  max_lb: number;
  rate: number;
  label: string;
}

interface IntlBracket {
  id: string;
  max_lb: number;
  rate: number;
  region: string;
}

interface ShippingConfig {
  standard_rate: number;
  express_rate: number;
  free_shipping_threshold: number;
  standard_label: string;
  express_label: string;
  weight_brackets: WeightBracket[];
  intl_weight_brackets: IntlBracket[];
}

const DEFAULT_CONFIG: ShippingConfig = {
  standard_rate: 7.99,
  express_rate: 19.99,
  free_shipping_threshold: 99.99,
  standard_label: "Standard Shipping (5-10 Business Days)",
  express_label: "Express Shipping (2-4 Business Days)",
  weight_brackets: [
    { id: "1", max_lb: 0.5, rate: 5.99, label: "Letter/Envelope" },
    { id: "2", max_lb: 1, rate: 7.99, label: "Small Package" },
    { id: "3", max_lb: 2, rate: 9.99, label: "Medium Package" },
    { id: "4", max_lb: 5, rate: 12.99, label: "Large Package" },
    { id: "5", max_lb: 999, rate: 16.99, label: "Heavy Package" },
  ],
  intl_weight_brackets: [
    { id: "1", max_lb: 1, rate: 19.99, region: "Canada / Mexico" },
    { id: "2", max_lb: 3, rate: 29.99, region: "Europe / Australia" },
    { id: "3", max_lb: 5, rate: 39.99, region: "Asia / Middle East" },
    { id: "4", max_lb: 10, rate: 59.99, region: "Rest of World" },
    { id: "5", max_lb: 999, rate: 99.99, region: "Remote / Islands" },
  ],
};

function uid() {
  return Math.random().toString(36).slice(2, 8);
}

export default function ShippingRateManager({ initialConfig }: { initialConfig?: Partial<ShippingConfig> }) {
  const [config, setConfig] = useState<ShippingConfig>({ ...DEFAULT_CONFIG, ...initialConfig });
  const [activeTab, setActiveTab] = useState<"domestic" | "international" | "zones">("domestic");
  const [isPending, startTransition] = useTransition();
  const [expandedSection, setExpandedSection] = useState<string | null>("flat");

  // Calculate what a sample order would cost
  const [previewWeight, setPreviewWeight] = useState(0.8);
  const [previewSubtotal, setPreviewSubtotal] = useState(45);

  function getPreviewRate(): { label: string; cost: number } {
    if (previewSubtotal >= config.free_shipping_threshold) {
      return { label: "Free Standard Shipping 🎁", cost: 0 };
    }
    const bracket = config.weight_brackets.find(b => previewWeight <= b.max_lb);
    if (bracket) return { label: bracket.label, cost: bracket.rate };
    return { label: config.standard_label, cost: config.standard_rate };
  }

  const preview = getPreviewRate();

  async function handleSave() {
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/shipping-config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(config),
        });
        if (res.ok) {
          toast.success("Shipping rates saved successfully");
        } else {
          toast.error("Failed to save — check console");
        }
      } catch {
        // Save to localStorage as fallback
        localStorage.setItem("shipping_config_draft", JSON.stringify(config));
        toast.success("Draft saved locally (API not connected yet)");
      }
    });
  }

  const TABS = [
    { id: "domestic", label: "Domestic (US)", icon: Package },
    { id: "international", label: "International", icon: Globe },
    { id: "zones", label: "Rate Preview", icon: DollarSign },
  ] as const;

  return (
    <div className="space-y-8 pb-24 animate-luxury-fade">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif text-white tracking-wide">Shipping Rates</h1>
          <p className="text-xs text-white/40 uppercase tracking-widest mt-1">
            Weight-based · Zone-based · International brackets
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2 bg-[#D4AF37] text-black px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-white transition-all disabled:opacity-50"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save All Rates
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 overflow-x-auto custom-scrollbar whitespace-nowrap pb-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 text-[11px] uppercase tracking-widest font-bold transition-all border-b-2 ${
              activeTab === tab.id
                ? "border-[#D4AF37] text-[#D4AF37]"
                : "border-transparent text-white/40 hover:text-white"
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── DOMESTIC TAB ── */}
      {activeTab === "domestic" && (
        <div className="space-y-6">
          {/* Flat rates */}
          <div className="bg-[#121214] border border-white/10 rounded-xl overflow-hidden">
            <button
              onClick={() => setExpandedSection(expandedSection === "flat" ? null : "flat")}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Truck className="w-4 h-4 text-[#D4AF37]" />
                <span className="text-sm font-bold text-white uppercase tracking-wide">Flat Rate Fallback</span>
              </div>
              {expandedSection === "flat" ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
            </button>

            {expandedSection === "flat" && (
              <div className="px-6 pb-6 space-y-4 border-t border-white/5">
                <p className="text-[11px] text-white/40 uppercase tracking-widest pt-4">
                  Used when no weight bracket matches, or as display price before checkout
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest text-white/40">Standard Rate ($)</label>
                    <div className="flex items-center bg-black/40 border border-white/10 rounded-lg overflow-hidden">
                      <span className="px-3 text-white/40">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={config.standard_rate}
                        onChange={e => setConfig(p => ({ ...p, standard_rate: parseFloat(e.target.value) }))}
                        className="flex-1 bg-transparent py-2.5 pr-3 text-white text-sm outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest text-white/40">Express Rate ($)</label>
                    <div className="flex items-center bg-black/40 border border-white/10 rounded-lg overflow-hidden">
                      <span className="px-3 text-white/40">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={config.express_rate}
                        onChange={e => setConfig(p => ({ ...p, express_rate: parseFloat(e.target.value) }))}
                        className="flex-1 bg-transparent py-2.5 pr-3 text-white text-sm outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest text-white/40">Free Shipping Threshold ($)</label>
                    <div className="flex items-center bg-black/40 border border-white/10 rounded-lg overflow-hidden">
                      <span className="px-3 text-white/40">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={config.free_shipping_threshold}
                        onChange={e => setConfig(p => ({ ...p, free_shipping_threshold: parseFloat(e.target.value) }))}
                        className="flex-1 bg-transparent py-2.5 pr-3 text-white text-sm outline-none"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest text-white/40">Standard Label (shown to customer)</label>
                    <input
                      type="text"
                      value={config.standard_label}
                      onChange={e => setConfig(p => ({ ...p, standard_label: e.target.value }))}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-[#D4AF37]/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest text-white/40">Express Label</label>
                    <input
                      type="text"
                      value={config.express_label}
                      onChange={e => setConfig(p => ({ ...p, express_label: e.target.value }))}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-[#D4AF37]/50"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Weight brackets */}
          <div className="bg-[#121214] border border-white/10 rounded-xl overflow-hidden">
            <button
              onClick={() => setExpandedSection(expandedSection === "weight" ? null : "weight")}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Weight className="w-4 h-4 text-[#D4AF37]" />
                <span className="text-sm font-bold text-white uppercase tracking-wide">Weight-Based Brackets</span>
                <span className="text-[10px] bg-[#D4AF37]/10 text-[#D4AF37] px-2 py-0.5 rounded-full border border-[#D4AF37]/20">
                  {config.weight_brackets.length} tiers
                </span>
              </div>
              {expandedSection === "weight" ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
            </button>

            {expandedSection === "weight" && (
              <div className="border-t border-white/5">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/5 bg-black/20">
                        <th className="text-left px-6 py-3 text-[10px] uppercase tracking-widest text-white/40">Label</th>
                        <th className="text-left px-6 py-3 text-[10px] uppercase tracking-widest text-white/40">Max Weight (lbs)</th>
                        <th className="text-left px-6 py-3 text-[10px] uppercase tracking-widest text-white/40">Rate ($)</th>
                        <th className="px-6 py-3 w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {config.weight_brackets.map((bracket, i) => (
                        <tr key={bracket.id} className="hover:bg-white/5 transition-colors group">
                          <td className="px-6 py-3">
                            <input
                              type="text"
                              value={bracket.label}
                              onChange={e => {
                                const updated = [...config.weight_brackets];
                                updated[i] = { ...bracket, label: e.target.value };
                                setConfig(p => ({ ...p, weight_brackets: updated }));
                              }}
                              className="bg-transparent text-sm text-white outline-none border-b border-transparent focus:border-[#D4AF37]/50 w-full"
                            />
                          </td>
                          <td className="px-6 py-3">
                            <input
                              type="number"
                              step="0.1"
                              value={bracket.max_lb}
                              onChange={e => {
                                const updated = [...config.weight_brackets];
                                updated[i] = { ...bracket, max_lb: parseFloat(e.target.value) };
                                setConfig(p => ({ ...p, weight_brackets: updated }));
                              }}
                              className="bg-transparent text-sm text-white outline-none border-b border-transparent focus:border-[#D4AF37]/50 w-24 font-mono"
                            />
                          </td>
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-1">
                              <span className="text-white/40">$</span>
                              <input
                                type="number"
                                step="0.01"
                                value={bracket.rate}
                                onChange={e => {
                                  const updated = [...config.weight_brackets];
                                  updated[i] = { ...bracket, rate: parseFloat(e.target.value) };
                                  setConfig(p => ({ ...p, weight_brackets: updated }));
                                }}
                                className="bg-transparent text-sm text-[#D4AF37] font-mono outline-none border-b border-transparent focus:border-[#D4AF37]/50 w-20"
                              />
                            </div>
                          </td>
                          <td className="px-6 py-3">
                            <button
                              onClick={() => setConfig(p => ({
                                ...p,
                                weight_brackets: p.weight_brackets.filter((_, idx) => idx !== i)
                              }))}
                              className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-6 py-4 border-t border-white/5">
                  <button
                    onClick={() => setConfig(p => ({
                      ...p,
                      weight_brackets: [...p.weight_brackets, { id: uid(), max_lb: 1, rate: 9.99, label: "New Tier" }]
                    }))}
                    className="flex items-center gap-2 text-[11px] text-white/40 hover:text-[#D4AF37] transition-colors uppercase tracking-widest font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Weight Tier
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── INTERNATIONAL TAB ── */}
      {activeTab === "international" && (
        <div className="bg-[#121214] border border-white/10 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-sm font-bold text-white uppercase tracking-wide">International Weight Brackets</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 bg-black/20">
                  <th className="text-left px-6 py-3 text-[10px] uppercase tracking-widest text-white/40">Region</th>
                  <th className="text-left px-6 py-3 text-[10px] uppercase tracking-widest text-white/40">Max Weight (lbs)</th>
                  <th className="text-left px-6 py-3 text-[10px] uppercase tracking-widest text-white/40">Standard Rate ($)</th>
                  <th className="text-left px-6 py-3 text-[10px] uppercase tracking-widest text-white/40">Express (+$30)</th>
                  <th className="px-6 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {config.intl_weight_brackets.map((bracket, i) => (
                  <tr key={bracket.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-3">
                      <input
                        type="text"
                        value={bracket.region}
                        onChange={e => {
                          const updated = [...config.intl_weight_brackets];
                          updated[i] = { ...bracket, region: e.target.value };
                          setConfig(p => ({ ...p, intl_weight_brackets: updated }));
                        }}
                        className="bg-transparent text-sm text-white outline-none border-b border-transparent focus:border-[#D4AF37]/50 w-full"
                      />
                    </td>
                    <td className="px-6 py-3">
                      <input
                        type="number"
                        step="0.1"
                        value={bracket.max_lb}
                        onChange={e => {
                          const updated = [...config.intl_weight_brackets];
                          updated[i] = { ...bracket, max_lb: parseFloat(e.target.value) };
                          setConfig(p => ({ ...p, intl_weight_brackets: updated }));
                        }}
                        className="bg-transparent text-sm font-mono text-white outline-none border-b border-transparent focus:border-[#D4AF37]/50 w-24"
                      />
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-1">
                        <span className="text-white/40">$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={bracket.rate}
                          onChange={e => {
                            const updated = [...config.intl_weight_brackets];
                            updated[i] = { ...bracket, rate: parseFloat(e.target.value) };
                            setConfig(p => ({ ...p, intl_weight_brackets: updated }));
                          }}
                          className="bg-transparent text-sm text-[#D4AF37] font-mono outline-none border-b border-transparent focus:border-[#D4AF37]/50 w-20"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-sm text-white/30 font-mono">${(bracket.rate + 30).toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-3">
                      <button
                        onClick={() => setConfig(p => ({
                          ...p,
                          intl_weight_brackets: p.intl_weight_brackets.filter((_, idx) => idx !== i)
                        }))}
                        className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-white/5">
            <button
              onClick={() => setConfig(p => ({
                ...p,
                intl_weight_brackets: [...p.intl_weight_brackets, { id: uid(), max_lb: 2, rate: 25.99, region: "New Region" }]
              }))}
              className="flex items-center gap-2 text-[11px] text-white/40 hover:text-[#D4AF37] transition-colors uppercase tracking-widest font-bold"
            >
              <Plus className="w-3.5 h-3.5" />
              Add International Tier
            </button>
          </div>
        </div>
      )}

      {/* ── PREVIEW TAB ── */}
      {activeTab === "zones" && (
        <div className="space-y-6">
          <div className="bg-[#121214] border border-white/10 rounded-xl p-6 space-y-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2">
              <Info className="w-4 h-4 text-[#D4AF37]" />
              Rate Calculator Preview
            </h3>
            <p className="text-[11px] text-white/40 uppercase tracking-widest">
              Simulate what a customer would be charged
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-white/40">Order Weight (lbs)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={previewWeight}
                  onChange={e => setPreviewWeight(parseFloat(e.target.value))}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-[#D4AF37]/50 font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-white/40">Order Subtotal ($)</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={previewSubtotal}
                  onChange={e => setPreviewSubtotal(parseFloat(e.target.value))}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-[#D4AF37]/50 font-mono"
                />
              </div>
            </div>

            <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-xl p-6 text-center">
              <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Customer would pay</p>
              <p className={`text-4xl font-serif font-bold ${preview.cost === 0 ? "text-emerald-400" : "text-[#D4AF37]"}`}>
                {preview.cost === 0 ? "FREE" : `$${preview.cost.toFixed(2)}`}
              </p>
              <p className="text-xs text-white/40 mt-2">{preview.label}</p>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-white/40 mb-3">All tiers at a glance</p>
              {config.weight_brackets.map((b, i) => (
                <div key={b.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-none">
                  <span className="text-xs text-white/60">{b.label}</span>
                  <span className="text-xs text-white/40">≤ {b.max_lb} lbs</span>
                  <span className="text-sm font-mono text-[#D4AF37] font-bold">${b.rate.toFixed(2)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between py-2 mt-2 bg-emerald-500/5 border border-emerald-500/20 rounded-lg px-3">
                <span className="text-xs text-emerald-400">Free shipping threshold</span>
                <span className="text-sm font-mono text-emerald-400 font-bold">${config.free_shipping_threshold.toFixed(2)}+</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
