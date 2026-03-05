import { ProductForm } from "@/components/admin/ProductForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function NewProductPage() {
    return (
        <div className="max-w-4xl space-y-8 animate-luxury-fade">
            <Link
                href="/admin/products"
                className="flex items-center gap-2 text-[10px] uppercase tracking-luxury text-textsoft hover:text-gold transition-colors font-medium"
            >
                <ArrowLeft size={12} />
                Back to Vault
            </Link>

            <div>
                <h2 className="text-3xl font-heading text-charcoal mb-1 tracking-luxury">Forge New Item</h2>
                <p className="text-textsoft text-sm tracking-luxury uppercase font-medium">Add a new masterpiece to the Obsidian collection</p>
            </div>

            <div className="bg-white rounded-luxury border border-charcoal/10 p-8 shadow-luxury">
                <ProductForm />
            </div>
        </div>
    );
}
