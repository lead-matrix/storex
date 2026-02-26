"use client"

import Link from "next/link"
import { Package, User, ChevronRight } from "lucide-react"

interface AccountDashboardProps {
    user: {
        email?: string
        created_at: string
    }
    profile: {
        full_name?: string
        role?: string
    }
}

export function AccountDashboard({ user, profile }: AccountDashboardProps) {
    const userName = profile?.full_name || user.email?.split("@")[0] || "Guest"
    const userRole = profile?.role || "customer"

    return (
        <div className="space-y-12 animate-luxury-fade">
            {/* Welcome Header */}
            <div className="text-center space-y-4">
                <p className="text-gold text-xs uppercase tracking-luxury font-medium">The Obsidian Palace</p>
                <h1 className="text-3xl md:text-5xl font-heading text-charcoal tracking-luxury font-medium">
                    Welcome back, {userName}
                </h1>
                <p className="text-textsoft font-light tracking-luxury max-w-lg mx-auto text-sm leading-relaxed">
                    Your personal sanctuary for managing orders and account details.
                </p>
            </div>

            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Orders Card */}
                <Link
                    href="/orders"
                    className="group p-8 border border-charcoal/10 bg-white rounded-luxury hover:border-gold/50 hover:shadow-luxury transition-all duration-500"
                >
                    <div className="flex justify-between items-start mb-8">
                        <div className="w-12 h-12 rounded-full bg-pearl flex items-center justify-center group-hover:bg-gold/10 transition-colors">
                            <Package size={20} className="text-charcoal group-hover:text-gold transition-colors" />
                        </div>
                        <ChevronRight size={18} className="text-textsoft group-hover:text-charcoal transition-colors group-hover:translate-x-1 duration-300" />
                    </div>
                    <h3 className="text-xl font-heading mb-3 text-charcoal tracking-luxury font-medium">Order History</h3>
                    <p className="text-sm text-textsoft leading-relaxed">
                        View past purchases, track current shipments, and initiate elegant exchanges.
                    </p>
                </Link>

                {/* Profile Card */}
                <div className="p-8 border border-charcoal/10 bg-white rounded-luxury hover:shadow-soft transition-all duration-500">
                    <div className="flex justify-between items-start mb-8">
                        <div className="w-12 h-12 rounded-full bg-pearl flex items-center justify-center">
                            <User size={20} className="text-charcoal" />
                        </div>
                        <div className="px-3 py-1 bg-pearl text-[10px] font-medium uppercase tracking-luxury text-charcoal border border-charcoal/10 rounded-full">
                            {userRole}
                        </div>
                    </div>
                    <h3 className="text-xl font-heading mb-3 text-charcoal tracking-luxury font-medium">Account Details</h3>
                    <p className="text-sm text-textsoft mb-2">{user.email}</p>
                    <p className="text-xs text-textsoft/70 uppercase tracking-luxury">
                        Member since {new Date(user.created_at).getFullYear()}
                    </p>
                </div>

                {/* Admin Access (If Admin) */}
                {userRole === 'admin' && (
                    <Link
                        href="/admin"
                        className="md:col-span-2 group p-8 border border-gold/30 bg-gold/5 rounded-luxury hover:bg-gold/10 transition-all duration-500 relative overflow-hidden flex items-center justify-between"
                    >
                        <div className="relative z-10">
                            <h3 className="text-xl font-heading mb-2 text-gold tracking-luxury font-medium">Admin Portal Access</h3>
                            <p className="text-sm text-charcoal/70">Manage products, orders, and site content with elevated privileges.</p>
                        </div>
                        <ChevronRight size={20} className="text-gold group-hover:translate-x-2 transition-transform duration-300 relative z-10" />
                    </Link>
                )}
            </div>
        </div>
    )
}
