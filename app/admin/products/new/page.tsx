import { ProductForm } from "@/components/admin/ProductForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function NewProductPage() {
    return (
        <div className="max-w-4xl space-y-8 animate-luxury-fade">
            <Link
                href="/admin/products"
                className="flex items-center gap-2 text-[10px] uppercase tracking-luxury text-luxury-subtext hover:text-gold transition-colors font-medium"
            >
                <ArrowLeft size={12} />
                Back to Products
            </Link>

            <div>
                <h2 className="text-3xl font-heading text-white mb-1 tracking-luxury">Create New Product</h2>
                <p className="text-luxury-subtext text-sm tracking-luxury uppercase font-medium">Add a new product to your store catalog</p>
            </div>

            <div className="bg-[#121214] rounded-luxury border border-white/10 p-8 shadow-luxury">
                <ProductForm />
            </div>
        </div>
    );
}
