import { Shield, Truck, RotateCcw, Award } from "lucide-react"

const TRUST_ITEMS = [
    {
        icon: Truck,
        title: "Complimentary Delivery",
        description: "On all orders exceeding $150"
    },
    {
        icon: RotateCcw,
        title: "Effortless Returns",
        description: "30-day elegant exchange protocol"
    },
    {
        icon: Award,
        title: "Authentic Masterpieces",
        description: "Guaranteed direct from the Palace"
    },
    {
        icon: Shield,
        title: "Secure Encrypted Transport",
        description: "Uncompromised transaction safety"
    }
]

export function TrustIndicators() {
    return (
        <section className="py-24 px-6 bg-white border-t border-b border-charcoal/5">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 stagger-children">
                    {TRUST_ITEMS.map((item, index) => (
                        <div key={index} className="flex flex-col items-center text-center group">
                            <div className="w-16 h-16 rounded-full border border-gold/20 flex items-center justify-center mb-6 bg-pearl group-hover:bg-gold/5 transition-colors duration-500">
                                <item.icon className="w-6 h-6 text-charcoal group-hover:text-gold transition-colors duration-500" strokeWidth={1.5} />
                            </div>
                            <h3 className="text-sm font-heading uppercase tracking-luxury text-charcoal mb-2 font-medium">
                                {item.title}
                            </h3>
                            <p className="text-xs tracking-luxury text-textsoft max-w-[200px]">
                                {item.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
