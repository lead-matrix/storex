import Link from "next/link";
import Image from "next/image";

interface Category {
    id: string;
    name: string;
    slug: string;
    description: string;
    image_url: string;
}

export function HomeCategoryGrid({ categories }: { categories: Category[] }) {
    if (!categories || categories.length === 0) return null;

    return (
        <section className="bg-black py-24 border-t border-white/5">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-playfair text-primary tracking-[0.1em] uppercase mb-4">
                        Discover Collections
                    </h2>
                    <p className="text-white/60 tracking-wider font-light">
                        Curated selections for your distinct elegance.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {categories.map((category) => (
                        <Link
                            key={category.id}
                            href={`/shop?category=${category.slug}`}
                            className="group relative aspect-[4/5] overflow-hidden block"
                        >
                            {/* Category Image */}
                            <Image
                                src={category.image_url || "/logo.jpg"}
                                alt={category.name}
                                fill
                                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                            />
                            {/* Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500" />

                            {/* Text Content */}
                            <div className="absolute inset-x-0 bottom-0 p-8 flex flex-col items-center text-center transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                <h3 className="text-2xl font-playfair text-white tracking-widest uppercase mb-2">
                                    {category.name}
                                </h3>
                                <p className="text-xs text-primary/80 uppercase tracking-[0.2em] font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                                    Explore &rarr;
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
