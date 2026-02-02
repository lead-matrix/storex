"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const supabase = createClient();
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError) {
            setError(authError.message);
            setLoading(false);
        } else {
            router.push("/admin");
            router.refresh();
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.05)_0%,transparent_70%)]">
            <div className="w-full max-w-md space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                {/* Brand Header */}
                <div className="flex flex-col items-center text-center space-y-6">
                    <Link href="/" className="relative w-20 h-20 opacity-80 hover:opacity-100 transition-opacity">
                        <Image src="/logo.jpg" alt="DINA COSMETIC" fill className="object-contain" />
                    </Link>
                    <div className="space-y-2">
                        <h1 className="text-3xl font-serif tracking-widest text-white uppercase">Identity Verification</h1>
                        <p className="text-[10px] text-gold uppercase tracking-[0.5em] font-light">Access The Obsidian Vault</p>
                    </div>
                </div>

                {/* Login Form */}
                <form onSubmit={handleLogin} className="space-y-8 bg-white/[0.02] border border-white/5 p-10 backdrop-blur-sm relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

                    <div className="space-y-6">
                        <div className="space-y-3">
                            <Label htmlFor="email" className="text-[10px] uppercase tracking-[0.3em] text-white/40 ml-1">
                                Registry Email
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="PROPRIETOR@DINACOSMETIC.STORE"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-black/50 border-white/10 text-white placeholder:text-white/10 rounded-none focus-visible:ring-gold/50 h-12 uppercase text-[11px] tracking-widest"
                            />
                        </div>

                        <div className="space-y-3">
                            <Label htmlFor="password" throws-error className="text-[10px] uppercase tracking-[0.3em] text-white/40 ml-1">
                                Security Cipher
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="bg-black/50 border-white/10 text-white placeholder:text-white/10 rounded-none focus-visible:ring-gold/50 h-12 uppercase text-[11px] tracking-widest"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-[10px] uppercase tracking-widest text-red-500/80 bg-red-500/5 border border-red-500/10 p-3 text-center animate-shake">
                            {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gold text-black hover:bg-white transition-all duration-700 h-14 uppercase text-[10px] tracking-[0.4em] font-bold rounded-none group-hover:shadow-[0_0_30px_rgba(212,175,55,0.1)]"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <div className="flex items-center gap-3">
                                <span>Authorize Access</span>
                                <ShieldCheck className="w-4 h-4" />
                            </div>
                        )}
                    </Button>

                    <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gold/10 to-transparent" />
                </form>

                {/* Footer */}
                <div className="flex flex-col items-center gap-6 pt-4">
                    <Link href="/" className="text-[9px] uppercase tracking-[0.4em] text-white/30 hover:text-white transition-colors flex items-center gap-2 group">
                        <ArrowRight className="w-3 h-3 rotate-180 group-hover:-translate-x-1 transition-transform" />
                        Return To Public Gallery
                    </Link>
                    <p className="text-[8px] text-white/10 uppercase tracking-[0.6em] font-light">
                        Strictly Private Property • Obsidian Palace Protocols Active
                    </p>
                </div>
            </div>
        </div>
    );
}
