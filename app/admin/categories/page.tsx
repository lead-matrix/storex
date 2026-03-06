import { createClient } from '@/lib/supabase/server'
import { Plus, Trash2, Edit3, Tag } from 'lucide-react'
import { createCategory, deleteCategory } from '@/lib/actions/admin'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Categories | Admin' }


export default async function AdminCategories() {
    const supabase = await createClient()
    const { data: categories } = await supabase
        .from('categories')
        .select('*')
        .order('name')

    return (
        <div className="space-y-12 pb-24 animate-luxury-fade">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-4xl font-heading text-charcoal mb-2 tracking-luxury">Taxonomy</h1>
                    <p className="text-textsoft text-xs uppercase tracking-luxury font-medium">Category Management & Hierarchy</p>
                </div>

                <form action={createCategory} className="flex gap-4">
                    <input
                        name="name"
                        placeholder="NEW CATEGORY NAME"
                        className="bg-pearl border border-charcoal/10 rounded-md px-6 py-3 text-[10px] uppercase tracking-luxury text-charcoal outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50 transition-all placeholder:text-textsoft/50 shadow-sm"
                        required
                    />
                    <button type="submit" className="bg-charcoal text-pearl rounded-full px-10 py-3 text-[11px] font-medium uppercase tracking-luxury flex items-center gap-2 hover:bg-gold transition-all active:scale-95 shadow-soft hover:shadow-luxury">
                        <Plus className="w-4 h-4" />
                        Add Category
                    </button>
                </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {categories?.map((category) => (
                    <div key={category.id} className="group relative bg-white rounded-luxury shadow-soft border border-charcoal/10 p-8 hover:shadow-luxury hover:border-gold/30 transition-all duration-500 overflow-hidden">
                        {/* Background Ornament */}
                        <Tag className="absolute -right-4 -bottom-4 w-24 h-24 text-charcoal/[0.02] -rotate-12 group-hover:text-gold/[0.05] transition-all duration-700 pointer-events-none" />

                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex justify-between items-start mb-6">
                                <h3 className="text-lg font-heading text-charcoal tracking-luxury">{category.name}</h3>
                                <form action={async () => {
                                    "use server"
                                    await deleteCategory(category.id);
                                }}>
                                    <button className="text-textsoft hover:text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </form>
                            </div>

                            <p className="text-[11px] text-textsoft/80 leading-relaxed uppercase tracking-luxury mb-8">
                                Permanent collection identified by unique slug identifier.
                            </p>

                            <div className="mt-auto pt-6 border-t border-charcoal/5 flex items-center justify-between">
                                <span className="text-[9px] text-textsoft/60 uppercase tracking-luxury font-medium">Slug: {category.slug}</span>
                                <button className="text-[9px] text-gold uppercase tracking-luxury font-bold flex items-center gap-2 hover:text-charcoal transition-all">
                                    <Edit3 className="w-3 h-3" />
                                    Modify
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {(!categories || categories.length === 0) && (
                    <div className="col-span-full py-24 text-center border border-dashed border-charcoal/10 rounded-luxury">
                        <p className="text-textsoft text-[10px] uppercase tracking-luxury">No categories defined in the vault.</p>
                    </div>
                )}
            </div>
        </div>
    )
}

