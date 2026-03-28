"use client";

import { useState, useRef, useCallback } from "react";
import { Sparkles, Upload, Loader2, Check, ChevronDown, ChevronUp, Wand2, Palette, X } from "lucide-react";
import { toast } from "sonner";

interface AIResult {
  description?: string;
  shortDescription?: string;
  suggestedPrice?: number;
  keyBenefits?: string[];
  ingredients?: string;
  howToUse?: string;
}

interface Variant {
  name: string;
  colorCode: string;
  suggestedPrice: number;
}

interface AIProductWriterProps {
  productTitle: string;
  onApplyDescription: (description: string) => void;
  onApplyPrice: (price: number) => void;
  onApplyVariants: (variants: Variant[]) => void;
}

export default function AIProductWriter({
  productTitle,
  onApplyDescription,
  onApplyPrice,
  onApplyVariants,
}: AIProductWriterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState<"description" | "variants" | null>(null);
  const [result, setResult] = useState<AIResult | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [applied, setApplied] = useState<Record<string, boolean>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setImagePreview(dataUrl);
      // Strip data:image/jpeg;base64, prefix
      const base64 = dataUrl.split(",")[1];
      setImageBase64(base64);
    };
    reader.readAsDataURL(file);
  }, []);

  async function generateDescription() {
    if (!productTitle?.trim()) {
      toast.error("Enter a product title first");
      return;
    }
    setLoading("description");
    setResult(null);
    try {
      const res = await fetch("/api/admin/ai-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: productTitle,
          imageBase64,
          mode: "description",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setResult(data.result);
      toast.success("AI description generated");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(null);
    }
  }

  async function generateVariants() {
    if (!productTitle?.trim()) {
      toast.error("Enter a product title first");
      return;
    }
    setLoading("variants");
    setVariants([]);
    try {
      const res = await fetch("/api/admin/ai-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: productTitle, mode: "variants" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setVariants(data.result?.variants || []);
      toast.success("Variants generated");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(null);
    }
  }

  function applyField(field: string, value: any) {
    if (field === "description" && result?.description) {
      onApplyDescription(result.description);
    }
    if (field === "price" && result?.suggestedPrice) {
      onApplyPrice(result.suggestedPrice);
    }
    if (field === "variants") {
      onApplyVariants(variants);
    }
    setApplied(prev => ({ ...prev, [field]: true }));
    setTimeout(() => setApplied(prev => ({ ...prev, [field]: false })), 2000);
  }

  return (
    <div className="border border-[#D4AF37]/20 rounded-xl overflow-hidden bg-gradient-to-br from-[#D4AF37]/5 to-transparent">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#D4AF37]/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-white">AI Product Assistant</p>
            <p className="text-[10px] text-white/40 uppercase tracking-widest">Generate descriptions · shade names · pricing</p>
          </div>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
      </button>

      {isOpen && (
        <div className="border-t border-[#D4AF37]/10 px-5 pb-5 pt-4 space-y-5">
          {/* Image Upload */}
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-white/40">
              Optional: Upload product photo for better descriptions
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-[11px] uppercase tracking-widest text-white/60 hover:border-[#D4AF37]/40 hover:text-white transition-all"
              >
                <Upload className="w-3.5 h-3.5" />
                {imagePreview ? "Change Photo" : "Upload Photo"}
              </button>
              {imagePreview && (
                <div className="relative">
                  <img src={imagePreview} alt="Product" className="w-12 h-12 object-cover rounded-lg border border-white/10" />
                  <button
                    type="button"
                    onClick={() => { setImagePreview(null); setImageBase64(null); }}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center"
                  >
                    <X className="w-2.5 h-2.5 text-white" />
                  </button>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={generateDescription}
              disabled={loading !== null}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#D4AF37] text-black rounded-lg text-[11px] font-bold uppercase tracking-widest hover:bg-white transition-all disabled:opacity-50"
            >
              {loading === "description" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
              Write Description
            </button>
            <button
              type="button"
              onClick={generateVariants}
              disabled={loading !== null}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/10 border border-white/10 text-white rounded-lg text-[11px] font-bold uppercase tracking-widest hover:bg-white/20 transition-all disabled:opacity-50"
            >
              {loading === "variants" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Palette className="w-3.5 h-3.5" />}
              Generate Shades
            </button>
          </div>

          {/* Description result */}
          {result && (
            <div className="space-y-3 bg-black/30 border border-white/10 rounded-xl p-4">
              <p className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold">AI Generated Content</p>

              {result.description && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] uppercase tracking-widest text-white/40">Description</p>
                    <button
                      type="button"
                      onClick={() => applyField("description", result.description)}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                        applied.description
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 hover:bg-[#D4AF37]/20"
                      }`}
                    >
                      {applied.description ? <Check className="w-3 h-3" /> : null}
                      {applied.description ? "Applied!" : "Apply"}
                    </button>
                  </div>
                  <p className="text-sm text-white/80 leading-relaxed">{result.description}</p>
                </div>
              )}

              {result.suggestedPrice && (
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-white/40">Suggested Price</p>
                    <p className="text-xl font-serif text-[#D4AF37] font-bold">${result.suggestedPrice}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => applyField("price", result.suggestedPrice)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                      applied.price
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 hover:bg-[#D4AF37]/20"
                    }`}
                  >
                    {applied.price ? <Check className="w-3 h-3" /> : null}
                    {applied.price ? "Applied!" : "Use This Price"}
                  </button>
                </div>
              )}

              {result.keyBenefits && result.keyBenefits.length > 0 && (
                <div className="pt-2 border-t border-white/5">
                  <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Key Benefits</p>
                  <div className="flex flex-wrap gap-2">
                    {result.keyBenefits.map((b, i) => (
                      <span key={i} className="px-2 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] text-white/70">
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result.howToUse && (
                <div className="pt-2 border-t border-white/5">
                  <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">How To Use</p>
                  <p className="text-xs text-white/60 italic">{result.howToUse}</p>
                </div>
              )}
            </div>
          )}

          {/* Variants result */}
          {variants.length > 0 && (
            <div className="space-y-3 bg-black/30 border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold">
                  {variants.length} Shades Generated
                </p>
                <button
                  type="button"
                  onClick={() => applyField("variants", variants)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                    applied.variants
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 hover:bg-[#D4AF37]/20"
                  }`}
                >
                  {applied.variants ? <Check className="w-3 h-3" /> : null}
                  {applied.variants ? "Applied!" : "Add All Variants"}
                </button>
              </div>
              <div className="flex flex-wrap gap-3">
                {variants.map((v, i) => (
                  <div key={i} className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-lg px-3 py-2">
                    <div
                      className="w-5 h-5 rounded-full border border-white/20 flex-shrink-0"
                      style={{ backgroundColor: v.colorCode }}
                    />
                    <div>
                      <p className="text-xs font-medium text-white">{v.name}</p>
                      <p className="text-[9px] text-white/40 font-mono">{v.colorCode}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-3 py-4 text-white/40">
              <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
              <p className="text-[11px] uppercase tracking-widest">
                {loading === "description" ? "Writing luxury copy..." : "Generating shade palette..."}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
