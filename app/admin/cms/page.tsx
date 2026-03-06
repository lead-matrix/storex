import { createClient } from "@/utils/supabase/server";
import { Plus, Layout, Globe, Lock, Trash2, Edit2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { togglePagePublish, deletePage } from "@/lib/actions/cms";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export default async function AdminCMSPage() {
    const supabase = await createClient();

    const { data: pages, error } = await supabase
        .from("cms_pages")
        .select("*")
        .order("created_at", { ascending: false });

    return (
        <div className="space-y-12 animate-luxury-fade pb-24">
            {/* Header */}
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-4xl font-heading text-white mb-2 tracking-luxury font-serif uppercase">Experiences</h1>
                    <p className="text-gold text-[10px] uppercase tracking-luxury font-bold">Content Architecture · Digital Storytelling</p>
                </div>
                <Link
                    href="/admin/cms/new"
                    className="flex items-center gap-2 bg-gold text-black px-6 py-3 rounded text-[11px] font-bold uppercase tracking-luxury hover:bg-gold-light transition-all shadow-gold"
                >
                    <Plus className="w-4 h-4" />
                    Forge New Space
                </Link>
            </div>

            {/* Grid of Pages */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pages?.map((page) => (
                    <div key={page.id} className="bg-obsidian border border-luxury-border rounded-luxury overflow-hidden group hover:border-gold/30 transition-all flex flex-col">
                        <div className="h-40 bg-black/40 border-b border-white/5 flex items-center justify-center relative overflow-hidden">
                            <Layout className="w-12 h-12 text-white/5 group-hover:text-gold/20 transition-all group-hover:scale-110 duration-700" />
                            <div className="absolute top-4 right-4">
                                <Badge className={`text-[8px] uppercase tracking-widest px-2 py-0.5 border ${page.is_published ? "bg-emerald-950/40 text-emerald-400 border-emerald-800/50" : "bg-white/5 text-white/30 border-white/10"}`}>
                                    {page.is_published ? "Live" : "Draft"}
                                </Badge>
                            </div>
                        </div>

                        <div className="p-8 space-y-4 flex-grow">
                            <div>
                                <h3 className="text-lg font-serif text-white group-hover:text-gold transition-colors">{page.title}</h3>
                                <p className="text-[10px] text-white/30 uppercase tracking-luxury mt-1 font-mono">/{page.slug}</p>
                            </div>

                            <div className="flex items-center gap-2 pt-4 border-t border-white/5">
                                <Link
                                    href={`/admin/cms/${page.id}`}
                                    className="flex-grow bg-white/5 hover:bg-gold hover:text-black text-white/70 text-[10px] uppercase tracking-luxury font-bold py-3 text-center transition-all flex items-center justify-center gap-2"
                                >
                                    <Edit2 className="w-3 h-3" />
                                    Architect
                                </Link>

                                <form action={async () => { "use server"; await togglePagePublish(page.id, page.is_published); }} className="contents">
                                    <button className="w-12 h-11 bg-white/5 hover:text-gold text-white/30 flex items-center justify-center transition-colors">
                                        {page.is_published ? <Lock className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
                                    </button>
                                </form>

                                <form action={async () => { "use server"; await deletePage(page.id); }} className="contents">
                                    <button className="w-12 h-11 bg-white/5 hover:text-red-400 text-white/30 flex items-center justify-center transition-colors">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </form>
                            </div>
                        </div>

                        {page.is_published && (
                            <Link href={`/${page.slug}`} target="_blank" className="block w-full py-2 bg-gold/5 text-[8px] text-gold/60 text-center uppercase tracking-[0.4em] hover:bg-gold/10 transition-all font-bold group-hover:text-gold">
                                View Published Essence <ExternalLink size={8} className="inline ml-1 mb-0.5" />
                            </Link>
                        )}
                    </div>
                ))}

                {(!pages || pages.length === 0) && (
                    <div className="col-span-full py-24 bg-obsidian border border-luxury-border border-dashed flex flex-col items-center justify-center text-white/20">
                        <Layout className="w-12 h-12 mb-4 opacity-50" />
                        <p className="uppercase text-[10px] tracking-luxury">The digital halls are empty.</p>
                        <Link href="/admin/cms/new" className="text-gold text-[10px] uppercase tracking-widest mt-4 hover:underline">Begin Creation</Link>
                    </div>
                )}
            </div>
        </div>
    );
}
