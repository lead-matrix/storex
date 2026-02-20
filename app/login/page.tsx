"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import Link from "next/link";

type AuthMode = "login" | "signup";

export default function LoginPage() {
    const [mode, setMode] = useState<AuthMode>("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
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
            router.push("/");
            router.refresh();
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        // Validation
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            setLoading(false);
            return;
        }

        const { data, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                },
            },
        });

        if (authError) {
            setError(authError.message);
            setLoading(false);
        } else {
            setSuccess("Account created! Please check your email to verify your account.");
            setLoading(false);
            // Clear form
            setEmail("");
            setPassword("");
            setConfirmPassword("");
            setFullName("");
        }
    };

    return (
        <div className="min-h-screen bg-background-primary flex items-center justify-center p-6 bg-[radial-gradient(circle_at_center,rgb(var(--gold-primary)/0.05)_0%,transparent_70%)]">
            <div className="w-full max-w-md space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                {/* Brand Header */}
                <div className="flex flex-col items-center text-center space-y-6">
                    <Link href="/" className="relative w-20 h-20 opacity-80 hover:opacity-100 transition-opacity">
                        <Image src="/logo.jpg" alt="DINA COSMETIC" fill className="object-contain" />
                    </Link>
                    <div className="space-y-2">
                        <h1 className="text-3xl font-serif tracking-widest text-text-headingDark uppercase">Identity Verification</h1>
                        <p className="text-[10px] text-gold-primary uppercase tracking-[0.5em] font-light">Access The Obsidian Vault</p>
                    </div>
                </div>

                {/* Mode Switcher */}
                <div className="flex border border-gold-primary/10 bg-background-secondary/50">
                    <button
                        onClick={() => setMode("login")}
                        className={`flex-1 py-4 text-[10px] uppercase tracking-[0.3em] transition-all duration-300 ${mode === "login"
                            ? "bg-gold-primary text-background-primary font-bold"
                            : "text-text-mutedDark/40 hover:text-text-bodyDark"
                            }`}
                    >
                        Login
                    </button>
                    <button
                        onClick={() => setMode("signup")}
                        className={`flex-1 py-4 text-[10px] uppercase tracking-[0.3em] transition-all duration-300 ${mode === "signup"
                            ? "bg-gold-primary text-background-primary font-bold"
                            : "text-text-mutedDark/40 hover:text-text-bodyDark"
                            }`}
                    >
                        Sign Up
                    </button>
                </div>

                {/* Forms */}
                {mode === "login" ? (
                    <form onSubmit={handleLogin} className="space-y-8 bg-background-secondary/30 border border-gold-primary/5 p-6 md:p-10 backdrop-blur-sm relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gold-primary/30 to-transparent" />

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <Label htmlFor="email" className="text-[10px] uppercase tracking-[0.3em] text-text-mutedDark/40 ml-1">
                                    Registry Email
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="your@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="bg-background-primary/50 border-gold-primary/10 text-text-bodyDark placeholder:text-text-mutedDark/10 rounded-none focus-visible:ring-gold-primary/50 h-12 uppercase text-[11px] tracking-widest"
                                />
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="password" className="text-[10px] uppercase tracking-[0.3em] text-text-mutedDark/40 ml-1">
                                    Security Cipher
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="bg-background-primary/50 border-gold-primary/10 text-text-bodyDark placeholder:text-text-mutedDark/10 rounded-none focus-visible:ring-gold-primary/50 h-12 uppercase text-[11px] tracking-widest"
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
                            className="w-full bg-gold-primary text-background-primary hover:bg-gold-hover transition-all duration-700 h-14 uppercase text-[10px] tracking-[0.4em] font-bold rounded-none group-hover:shadow-[0_0_30px_rgb(var(--gold-primary)/0.1)]"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <span className="flex items-center justify-center gap-3">
                                    Authorize Access
                                    <ArrowRight className="w-3 h-3" />
                                </span>
                            )}
                        </Button>

                        <div className="text-center">
                            <Link href="/forgot-password" className="text-[9px] uppercase tracking-widest text-text-mutedDark/30 hover:text-gold-primary transition-colors">
                                Forgot Password?
                            </Link>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleSignup} className="space-y-8 bg-background-secondary/30 border border-gold-primary/5 p-6 md:p-10 backdrop-blur-sm relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gold-primary/30 to-transparent" />

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <Label htmlFor="fullName" className="text-[10px] uppercase tracking-[0.3em] text-text-mutedDark/40 ml-1">
                                    Full Name
                                </Label>
                                <Input
                                    id="fullName"
                                    type="text"
                                    placeholder="Your Full Name"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                    className="bg-background-primary/50 border-gold-primary/10 text-text-bodyDark placeholder:text-text-mutedDark/10 rounded-none focus-visible:ring-gold-primary/50 h-12 uppercase text-[11px] tracking-widest"
                                />
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="signup-email" className="text-[10px] uppercase tracking-[0.3em] text-text-mutedDark/40 ml-1">
                                    Email Address
                                </Label>
                                <Input
                                    id="signup-email"
                                    type="email"
                                    placeholder="your@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="bg-background-primary/50 border-gold-primary/10 text-text-bodyDark placeholder:text-text-mutedDark/10 rounded-none focus-visible:ring-gold-primary/50 h-12 uppercase text-[11px] tracking-widest"
                                />
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="signup-password" className="text-[10px] uppercase tracking-[0.3em] text-text-mutedDark/40 ml-1">
                                    Password
                                </Label>
                                <Input
                                    id="signup-password"
                                    type="password"
                                    placeholder="••••••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="bg-background-primary/50 border-gold-primary/10 text-text-bodyDark placeholder:text-text-mutedDark/10 rounded-none focus-visible:ring-gold-primary/50 h-12 uppercase text-[11px] tracking-widest"
                                />
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="confirm-password" className="text-[10px] uppercase tracking-[0.3em] text-text-mutedDark/40 ml-1">
                                    Confirm Password
                                </Label>
                                <Input
                                    id="confirm-password"
                                    type="password"
                                    placeholder="••••••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="bg-background-primary/50 border-gold-primary/10 text-text-bodyDark placeholder:text-text-mutedDark/10 rounded-none focus-visible:ring-gold-primary/50 h-12 uppercase text-[11px] tracking-widest"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="text-[10px] uppercase tracking-widest text-red-500/80 bg-red-500/5 border border-red-500/10 p-3 text-center">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="text-[10px] uppercase tracking-widest text-green-500/80 bg-green-500/5 border border-green-500/10 p-3 text-center">
                                {success}
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gold-primary text-background-primary hover:bg-gold-hover transition-all duration-700 h-14 uppercase text-[10px] tracking-[0.4em] font-bold rounded-none group-hover:shadow-[0_0_30px_rgb(var(--gold-primary)/0.1)]"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <span className="flex items-center justify-center gap-3">
                                    Create Account
                                    <ShieldCheck className="w-4 h-4" />
                                </span>
                            )}
                        </Button>

                        <p className="text-[9px] uppercase tracking-widest text-text-mutedDark/30 text-center">
                            By signing up, you agree to our Terms of Service
                        </p>
                    </form>
                )}

                {/* Back to Home */}
                <div className="text-center">
                    <Link href="/" className="text-[9px] uppercase tracking-widest text-text-mutedDark/30 hover:text-gold-primary transition-colors inline-flex items-center gap-2">
                        ← Return to Palace
                    </Link>
                </div>
            </div>
        </div>
    );
}
