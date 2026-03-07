import { createClient } from "@/lib/supabase/server";
import CMSEditor from "./CMSEditor";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PageArchitect({ params }: { params: { id: string } }) {
    const supabase = await createClient();

    const { data: page } = await supabase
        .from("cms_pages")
        .select(`
            *,
            cms_sections(*)
        `)
        .eq("id", params.id)
        .order("sort_order", { foreignTable: "cms_sections", ascending: true })
        .single();

    if (!page) notFound();

    return (
        <div className="space-y-8 pb-32">
            {/* Context Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-8">
                <div className="flex items-center gap-6">
                    <Link href="/admin/cms" className="p-3 bg-white/5 border border-white/10 rounded-sm text-white/40 hover:text-gold hover:border-gold/30 transition-all">
                        <ArrowLeft size={16} />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-serif text-white">{page.title}</h1>
                            <span className={`text-[8px] uppercase tracking-widest px-2 py-0.5 rounded border ${page.is_published ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/5" : "border-white/10 text-white/20"}`}>
                                {page.is_published ? "Live Architecture" : "Blueprint Draft"}
                            </span>
                        </div>
                        <p className="text-[9px] text-white/30 uppercase tracking-[0.3em] mt-1">Fragment: /{page.slug}</p>
                    </div>
                </div>

                {page.is_published && (
                    <Link
                        href={`/${page.slug}`}
                        target="_blank"
                        className="flex items-center gap-2 text-[10px] uppercase tracking-luxury text-gold hover:text-white transition-colors"
                    >
                        Preview Essence <ExternalLink size={12} />
                    </Link>
                )}
            </div>

            {/* Visual Assembler */}
            <CMSEditor pageId={page.id} initialSections={page.cms_sections || []} />
        </div>
    );
}

