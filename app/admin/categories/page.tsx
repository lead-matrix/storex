import { createClient } from '@/lib/supabase/server'
import { Plus, Trash2, Edit3, Tag } from 'lucide-react'
import { createCategory, deleteCategory } from '@/lib/actions/admin'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Categories | Admin' }


import { CategoryCard } from '@/components/admin/CategoryCard'

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
                    <CategoryCard key={category.id} category={category} />
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

